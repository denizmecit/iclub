const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Get user by ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('club', 'name description');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Get all advisors (admin only)
router.get('/advisors', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const advisors = await User.find({ role: 'clubAdvisor' })
      .select('firstName lastName email')
      .sort({ firstName: 1 });
    res.json(advisors);
  } catch (error) {
    console.error('Error fetching advisors:', error);
    res.status(500).json({ message: 'Error fetching advisors', error: error.message });
  }
});

module.exports = router; 