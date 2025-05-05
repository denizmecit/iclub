import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Rating,
  Alert,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';

const DemoFeedbackPage: React.FC = () => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Demo event data
  const demoEvent = {
    title: "Web Development Workshop",
    description: "Join us for an interactive workshop on modern web development! We'll cover React, TypeScript, and Material-UI. Perfect for both beginners and intermediate developers looking to enhance their skills.",
    date: "2024-04-20",
    time: "14:00",
    location: "Computer Science Building, Room 101",
    participants: 45,
    organizer: "Computer Science Club"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setShowFeedbackForm(false);
      setRating(null);
      setComment('');
    }, 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Event Details Card */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {demoEvent.title}
        </Typography>
        
        <Box sx={{ my: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<CalendarTodayIcon />}
            label={`${demoEvent.date} at ${demoEvent.time}`}
            variant="outlined"
          />
          <Chip
            icon={<LocationOnIcon />}
            label={demoEvent.location}
            variant="outlined"
          />
          <Chip
            icon={<GroupIcon />}
            label={`${demoEvent.participants} participants`}
            variant="outlined"
          />
        </Box>

        <Typography variant="body1" paragraph>
          {demoEvent.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" color="text.secondary">
            Organized by: {demoEvent.organizer}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowFeedbackForm(true)}
            disabled={submitted}
          >
            Give Feedback
          </Button>
        </Box>
      </Paper>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Event Feedback
          </Typography>

          {submitted ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Thank you for your feedback!
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography component="legend" gutterBottom>
                    How would you rate this event?
                  </Typography>
                  <Rating
                    value={rating}
                    onChange={(_, value) => setRating(value)}
                    size="large"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Share your thoughts about the event"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!rating}
                    >
                      Submit Feedback
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default DemoFeedbackPage; 