const Event = require('../models/Event');
const mongoose = require('mongoose');

// Get all events with filters
const getEvents = async (req, res) => {
  try {
    const query = {};
    
    // Apply filters with validation
    if (req.query.club) {
      if (!mongoose.Types.ObjectId.isValid(req.query.club)) {
        return res.status(400).json({ message: 'Invalid club ID format' });
      }
      query.club = req.query.club;
    }
    
    if (req.query.eventType) {
      if (!['workshop', 'seminar', 'conference', 'social', 'other'].includes(req.query.eventType)) {
        return res.status(400).json({ message: 'Invalid event type' });
      }
      query.eventType = req.query.eventType;
    }
    
    if (req.query.status) {
      if (!['pending', 'approved', 'rejected'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      query.status = req.query.status;
    }
    
    // Date range filter with validation
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: 'Invalid start date format' });
        }
        query.date.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid end date format' });
        }
        query.date.$lte = endDate;
      }
    }

    // For club managers, only show their club's events
    if (req.user.role === 'clubManager') {
      if (!req.user.club) {
        return res.status(400).json({ message: 'User is not associated with any club' });
      }
      query.club = req.user.club;
    }

    const events = await Event.find(query)
      .populate('club', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error('Error in getEvents:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, maxParticipants, eventType } = req.body;

    // Validate required fields
    if (!title || !description || !date || !location || !eventType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate date
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate maxParticipants if provided
    if (maxParticipants && (isNaN(maxParticipants) || maxParticipants < 1)) {
      return res.status(400).json({ message: 'Invalid maximum participants value' });
    }

    const eventData = {
      ...req.body,
      date: eventDate,
      createdBy: req.user._id,
      club: req.user.club,
      status: 'pending'
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Error in createEvent:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', errors: Object.values(error.errors).map(err => err.message) });
    }
    res.status(500).json({ message: 'Server error while creating event' });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, maxParticipants, eventType } = req.body;

    // Validate date if provided
    if (date) {
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      req.body.date = eventDate;
    }

    // Validate maxParticipants if provided
    if (maxParticipants && (isNaN(maxParticipants) || maxParticipants < 1)) {
      return res.status(400).json({ message: 'Invalid maximum participants value' });
    }

    // Validate eventType if provided
    if (eventType && !['workshop', 'seminar', 'conference', 'social', 'other'].includes(eventType)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error in updateEvent:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid event data', errors: Object.values(error.errors).map(err => err.message) });
    }
    res.status(500).json({ message: 'Server error while updating event' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event has participants
    if (event.participants.length > 0) {
      return res.status(400).json({ message: 'Cannot delete event with existing participants' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('participants', 'firstName lastName email')
      .populate('feedback.user', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error in getEvent:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// Update event status (for admin)
const updateEventStatus = async (req, res) => {
  try {
    const { status, approvalNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        approvalNotes,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error in updateEventStatus:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid status data', errors: Object.values(error.errors).map(err => err.message) });
    }
    res.status(500).json({ message: 'Server error while updating event status' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  updateEventStatus
}; 