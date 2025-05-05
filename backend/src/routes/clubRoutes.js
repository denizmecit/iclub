const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('members', 'firstName lastName email _id')
      .sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ message: 'Error fetching clubs', error: error.message });
  }
});

// Get club by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('members', 'firstName lastName email');
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching club', error: error.message });
  }
});

// Create new club (admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const club = new Club({
      name,
      description
    });
    
    await club.save();
    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: 'Error creating club', error: error.message });
  }
});

// Update club (admin only)
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedClub);
  } catch (error) {
    res.status(500).json({ message: 'Error updating club', error: error.message });
  }
});

// Delete club (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    await Club.findByIdAndDelete(req.params.id);
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting club', error: error.message });
  }
});

// Add member to club (students can join)
router.post('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const club = await Club.findById(id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if the user is trying to join themselves
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only join clubs for yourself' });
    }
    
    if (club.members.includes(userId)) {
      return res.status(400).json({ message: 'You are already a member of this club' });
    }
    
    club.members.push(userId);
    await club.save();
    
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: 'Error joining club', error: error.message });
  }
});

// Remove member from club (admin or self)
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const club = await Club.findById(id)
      .populate('members', 'firstName lastName email _id');
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Allow users to remove themselves or admins to remove anyone
    if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only leave clubs for yourself' });
    }

    // Check if user is actually a member
    const isMember = club.members.some(member => member._id.toString() === userId);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this club' });
    }
    
    // Remove member
    club.members = club.members.filter(member => member._id.toString() !== userId);
    await club.save();
    
    res.json({ message: 'Successfully left the club' });
  } catch (error) {
    console.error('Error leaving club:', error);
    res.status(500).json({ message: 'Error leaving club', error: error.message });
  }
});

module.exports = router; 