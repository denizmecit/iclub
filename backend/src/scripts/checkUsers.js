require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    const users = await User.find({}).select('-password');
    console.log('\nUsers in database:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  }
  
  mongoose.connection.close();
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
}); 