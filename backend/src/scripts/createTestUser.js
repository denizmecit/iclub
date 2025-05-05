require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@example.com' });

    // Create new test user
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      studentId: '12345',
      userType: 'student'
    });

    await testUser.save();
    console.log('Test user created successfully');
    console.log('Email: test@example.com');
    console.log('Password: password123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

createTestUser(); 