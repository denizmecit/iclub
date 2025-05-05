const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Club = require('../models/Club');
const { authenticate } = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, studentId, userType, club } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Additional validation for club managers
    if (userType === 'clubManager') {
      if (!club) {
        return res.status(400).json({ message: 'Club selection is required for club managers' });
      }

      // Check if club exists
      const clubExists = await Club.findById(club);
      if (!clubExists) {
        return res.status(400).json({ message: 'Selected club does not exist' });
      }

      // Check if club already has a manager
      const existingManager = await User.findOne({ club, role: 'clubManager' });
      if (existingManager) {
        return res.status(400).json({ message: 'This club already has a manager' });
      }
    }

    // Additional validation for admin registration
    if (userType === 'admin') {
      // Check if there are any existing admins
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'An administrator already exists. Please contact the existing administrator.' });
      }
    }

    // Create new user with correct role mapping
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: userType,
      ...(userType === 'student' ? { studentId } : {}),
      ...(userType === 'clubManager' ? { club } : {})
    };

    const user = new User(userData);
    await user.save();

    // If user is a club manager, update the club
    if (userType === 'clubManager' && club) {
      await Club.findByIdAndUpdate(club, {
        $push: { managers: user._id }
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        club: user.club
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).populate('club', 'name description');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        club: user.club
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('club', 'name description');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 