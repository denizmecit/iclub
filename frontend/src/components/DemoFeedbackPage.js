import React, { useState } from 'react';
import StarRating from './StarRating';
import './FeedbackPage.css';

const DemoFeedbackPage = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [averageRating, setAverageRating] = useState(4.2);

  // Dummy event data
  const event = {
    title: "Demo Event: Web Development Workshop",
    date: new Date().toISOString(),
    description: "This is a demonstration event to showcase the feedback functionality."
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 3000);
  };

  return (
    <div className="feedback-page">
      <div className="event-header">
        <h1>{event.title}</h1>
        <p className="event-date">{new Date(event.date).toLocaleDateString()}</p>
      </div>

      <div className="quick-rating">
        <h3>Current Rating</h3>
        <StarRating
          value={averageRating}
          readOnly
          size="large"
        />
        <span className="rating-value">({averageRating.toFixed(1)})</span>
      </div>

      {submitted ? (
        <div className="success-message">
          <h3>Thank you for your feedback!</h3>
          <p>Your rating and comments have been submitted successfully.</p>
        </div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h3>Your Feedback</h3>
          <div className="rating-section">
            <label>Rate this event:</label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="medium"
            />
          </div>

          <div className="comment-section">
            <label htmlFor="comment">Comments:</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about the event..."
              required
            />
          </div>

          <button type="submit" className="submit-button">
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
};

export default DemoFeedbackPage; 