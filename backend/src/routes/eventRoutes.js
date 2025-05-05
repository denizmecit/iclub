const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  updateEventStatus 
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

// Input validation middleware
const validateEventId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid event ID format' });
  }
  next();
};

// Special routes that don't use IDs should come BEFORE the :id route
router.get('/manage', authenticate, authorize(['clubManager']), async (req, res) => {
  try {
    if (!req.user.club) {
      return res.status(400).json({ message: 'User is not associated with any club' });
    }
    
    const events = await Event.find({ club: req.user.club })
      .populate('club', 'name')
      .populate('participants', 'firstName lastName email')
      .populate('feedback.user', 'firstName lastName email')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching managed events:', error);
    res.status(500).json({ message: 'Server error while fetching managed events' });
  }
});

// Public routes (require authentication only)
router.get('/', authenticate, getEvents);

// Get event details by ID
router.get('/:id', authenticate, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name')
      .populate('participants', 'firstName lastName email')
      .populate('feedback.user', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ message: 'Server error while fetching event details' });
  }
});

// Club manager routes with validation
router.post('/', authenticate, authorize(['clubManager']), async (req, res) => {
  try {
    if (!req.user.club) {
      return res.status(400).json({ message: 'User is not associated with any club' });
    }
    await createEvent(req, res);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
});

router.put('/:id', authenticate, authorize(['clubManager']), validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.club.toString() !== req.user.club.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this event' });
    }
    await updateEvent(req, res);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error while updating event' });
  }
});

router.delete('/:id', authenticate, authorize(['clubManager']), validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.club.toString() !== req.user.club.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    await deleteEvent(req, res);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

// Admin routes with validation
router.patch('/:id/status', authenticate, authorize(['admin']), validateEventId, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    await updateEventStatus(req, res);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Server error while updating event status' });
  }
});

// Get event participants with validation
router.get('/:id/participants', authenticate, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.participants);
  } catch (error) {
    console.error('Error fetching event participants:', error);
    res.status(500).json({ message: 'Server error while fetching participants' });
  }
});

// Join an event with validation
router.post('/:id/participants', authenticate, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already participating in this event' });
    }

    event.participants.push(req.user._id);
    await event.save();

    res.json({ message: 'Successfully joined the event' });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Server error while joining event' });
  }
});

// Leave an event with validation
router.delete('/:id/participants', authenticate, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Not participating in this event' });
    }

    event.participants = event.participants.filter(
      participant => participant.toString() !== req.user._id.toString()
    );
    
    await event.save();

    res.json({ message: 'Successfully left the event' });
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ message: 'Server error while leaving event' });
  }
});

// Add feedback with validation
router.post('/:id/feedback', authenticate, validateEventId, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Only participants can provide feedback' });
    }

    const existingFeedback = event.feedback.find(
      f => f.user.toString() === req.user._id.toString()
    );
    
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already provided feedback for this event' });
    }

    event.feedback.push({
      user: req.user._id,
      rating,
      comment,
      createdAt: new Date()
    });

    await event.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
});

// Get feedback with validation
router.get('/:id/feedback', authenticate, validateEventId, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('feedback.user', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event.feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
});

module.exports = router; 