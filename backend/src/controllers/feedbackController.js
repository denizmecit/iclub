const Feedback = require('../models/Feedback');
const Event = require('../models/Event');

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has already submitted feedback
    const existingFeedback = await Feedback.findOne({ event: eventId, user: userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }

    const feedback = new Feedback({
      event: eventId,
      user: userId,
      rating,
      comment
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback for an event
exports.getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedback = await Feedback.find({ event: eventId })
      .populate('user', 'name')
      .sort('-createdAt');

    // Calculate average rating
    const feedbackCount = feedback.length;
    const averageRating = feedbackCount > 0
      ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedbackCount
      : 0;

    res.json({
      feedback,
      averageRating,
      totalFeedback: feedbackCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 