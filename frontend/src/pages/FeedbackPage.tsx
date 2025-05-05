import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Rating,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import axios from 'axios';

interface Event {
  _id: string;
  title: string;
  date: string;
  time: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

const FeedbackPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
  });

  useEffect(() => {
    fetchJoinedEvents();
  }, []);

  const fetchJoinedEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/events/joined', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching joined events:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/events/${selectedEvent._id}/feedback`,
        feedback,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the events list
      fetchJoinedEvents();
      
      // Reset form
      setSelectedEvent(null);
      setFeedback({ rating: 0, comment: '' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Event Feedback
      </Typography>
      
      <Grid container spacing={3}>
        {/* List of joined events */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Your Joined Events
          </Typography>
          {events.map((event) => (
            <Card key={event._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{event.title}</Typography>
                <Typography color="textSecondary">
                  {new Date(event.date).toLocaleDateString()} at {event.time}
                </Typography>
                {event.feedback && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Your Rating: <Rating value={event.feedback.rating} readOnly />
                    </Typography>
                    <Typography variant="body2">
                      Your Comment: {event.feedback.comment}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                {!event.feedback && (
                  <Button 
                    size="small" 
                    onClick={() => setSelectedEvent(event)}
                  >
                    Provide Feedback
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Grid>

        {/* Feedback form */}
        <Grid item xs={12} md={6}>
          {selectedEvent ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Provide Feedback for {selectedEvent.title}
              </Typography>
              <Box sx={{ my: 2 }}>
                <Typography component="legend">Rating</Typography>
                <Rating
                  value={feedback.rating}
                  onChange={(event, newValue) => {
                    setFeedback({ ...feedback, rating: newValue || 0 });
                  }}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.rating}
                >
                  Submit Feedback
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setSelectedEvent(null);
                    setFeedback({ rating: 0, comment: '' });
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                Select an event to provide feedback
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default FeedbackPage; 