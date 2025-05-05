require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');

const createTestEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test club first (if it doesn't exist)
    let club = await Club.findOne({ name: 'Test Club' });
    if (!club) {
      club = new Club({
        name: 'Test Club',
        description: 'A test club for demonstration'
      });
      await club.save();
    }

    // Create a test user first (if it doesn't exist)
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'student',
        studentId: '12345'
      });
      await user.save();
    }

    // Delete existing test event if exists
    await Event.deleteOne({ title: 'Test Event' });

    const now = new Date();
    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0); // Today at 2 PM

    // Create new test event
    const testEvent = new Event({
      title: 'Test Event',
      description: 'This is a test event for feedback testing',
      location: 'Test Location',
      date: eventDate,
      time: '14:00',
      eventType: 'social',
      club: club._id,
      createdBy: user._id,
      status: 'approved'
    });

    await testEvent.save();
    console.log('Test event created successfully');
    console.log('Event ID:', testEvent._id);
    console.log('Event Title:', testEvent.title);
    console.log('Event Date:', testEvent.date);
    console.log('\nTest user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test event:', error);
    await mongoose.disconnect();
  }
};

createTestEvent(); 