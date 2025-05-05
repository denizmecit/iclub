import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Rating,
  Stack,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface FeedbackForm {
  rating: number;
  comment: string;
}

const EventFeedback: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [feedback, setFeedback] = useState<FeedbackForm>({
    rating: 0,
    comment: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5001/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvent(response.data);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to fetch event details');
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5001/api/events/${eventId}/feedback`,
        feedback,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Feedback submitted successfully!');
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback');
    }
  };

  if (!event) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Event Feedback
        </Typography>
        <Typography variant="h6" gutterBottom>
          {event.title}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box>
              <Typography component="legend">Rate your experience</Typography>
              <Rating
                name="rating"
                value={feedback.rating}
                onChange={(_, newValue) => {
                  setFeedback(prev => ({ ...prev, rating: newValue || 0 }));
                }}
                size="large"
              />
            </Box>

            <TextField
              label="Your Feedback"
              multiline
              rows={4}
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              fullWidth
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{
                mt: 2,
                bgcolor: '#001f3f',
                '&:hover': {
                  bgcolor: '#00284d',
                }
              }}
            >
              Submit Feedback
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default EventFeedback; 