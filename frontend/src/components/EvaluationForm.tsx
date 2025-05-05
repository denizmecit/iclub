import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

interface EvaluationFormProps {
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ eventId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please provide a rating');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to submit feedback');
        return;
      }

      const response = await axios.post(
        `http://localhost:5001/api/events/${eventId}/feedback`,
        {
          rating,
          comment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        setSuccess('Feedback submitted successfully!');
        setRating(null);
        setComment('');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Event Evaluation
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

      <Box sx={{ my: 3 }}>
        <Typography component="legend" gutterBottom>
          Rating
        </Typography>
        <Rating
          value={rating}
          onChange={(_, newValue) => {
            setRating(newValue);
          }}
          size="large"
        />
      </Box>

      <Box sx={{ my: 3 }}>
        <Typography component="legend" gutterBottom>
          Your Feedback
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Share your thoughts about the event..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !rating}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </Box>
    </Paper>
  );
};

export default EvaluationForm; 