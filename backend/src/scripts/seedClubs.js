const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create default advisor
    const hashedPassword = await bcrypt.hash('advisor123', 10);
    let advisor = await User.findOne({ email: 'advisor@sabanciuniv.edu' });
    
    if (!advisor) {
      advisor = await User.create({
        firstName: 'Default',
        lastName: 'Advisor',
        email: 'advisor@sabanciuniv.edu',
        password: hashedPassword,
        role: 'clubAdvisor',
        studentId: 'ADV001'
      });
      console.log('Created default advisor');
    }

    // Clear existing clubs
    await Club.deleteMany({});
    console.log('Cleared existing clubs');

    // Create clubs
    const clubs = [
      {
        name: 'RadyoSu',
        description: 'Sabancı University Radio Club',
        advisor: advisor._id
      },
      {
        name: 'IES',
        description: 'Industrial Engineering Society',
        advisor: advisor._id
      },
      {
        name: 'GGK',
        description: 'Young Entrepreneurs Club',
        advisor: advisor._id
      }
    ];

    const createdClubs = await Club.insertMany(clubs);
    console.log('Added clubs:', createdClubs);

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 