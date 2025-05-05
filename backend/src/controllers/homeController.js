const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const News = require('../models/News');

const getHomeData = async (req, res) => {
  try {
    // Fetch latest announcements
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name');

    // Fetch upcoming events
    const events = await Event.find({
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .limit(5)
      .populate('organizer', 'name');

    // Fetch latest news
    const news = await News.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'name');

    res.json({
      announcements,
      events,
      news
    });
  } catch (error) {
    console.error('Error fetching home data:', error);
    res.status(500).json({ message: 'Error fetching home data' });
  }
};

module.exports = {
  getHomeData
}; 