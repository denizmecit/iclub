const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

// Create new feedback (requires authentication)
router.post('/', authenticate, feedbackController.createFeedback);

// Get feedback for an event
router.get('/event/:eventId', feedbackController.getEventFeedback);

module.exports = router; 