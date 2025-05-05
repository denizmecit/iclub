import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StarRating from './StarRating';
import './FeedbackPage.css';

const FeedbackPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get event details
        const eventResponse = await axios.get(`http://localhost:5001/api/events/${eventId}`, { headers });
        setEvent(eventResponse.data);
        
        // Calculate average rating from event feedback
        if (eventResponse.data.feedback && eventResponse.data.feedback.length > 0) {
          const totalRating = eventResponse.data.feedback.reduce((sum, item) => sum + item.rating, 0);
          setAverageRating(totalRating / eventResponse.data.feedback.length);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/events/${eventId}/feedback`,
        {
          rating,
          comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reset form and show success message
      setRating(0);
      setComment('');
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div>Event not found</div>;

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
    </div>
  );
};

export default FeedbackPage; 