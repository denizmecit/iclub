import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  TextField,
  Rating,
  Alert,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Feedback {
  _id?: string;
  user: User;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  club: string;
  eventType: string;
  registrationLink?: string;
  feedbackLink?: string;
  participants: string[];
  feedback?: Feedback[];
  status: string;
}

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isClubManager, setIsClubManager] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setError('Please log in to view event details');
        setLoading(false);
        return;
      }

      if (!eventId) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      setEvent(response.data);
      
      // Fix participant check
      const isUserParticipant = response.data.participants
        .map((p: any) => (typeof p === 'string' ? p : p._id))
        .includes(userId);
      setIsParticipant(isUserParticipant);
      
      // Check if user is a club manager
      const userResponse = await axios.get(`http://localhost:5001/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsClubManager(userResponse.data.role === 'club_manager');
      
      // If user is a club manager, fetch participants list
      if (userResponse.data.role === 'club_manager') {
        const participantsResponse = await axios.get(`http://localhost:5001/api/events/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setParticipants(participantsResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching event details:', error);
      setError(error.response?.data?.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    } else {
      setError('Event ID is missing');
      setLoading(false);
    }
  }, [eventId, fetchEventDetails]);

  const handleParticipation = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setError('Please log in to participate in events');
        return;
      }

      if (isParticipant) {
        // Leave event
        await axios.delete(`http://localhost:5001/api/events/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsParticipant(false);
        setSuccess('Successfully left the event');
      } else {
        // Join event
        await axios.post(`http://localhost:5001/api/events/${eventId}/participants`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsParticipant(true);
        setSuccess('Successfully joined the event');
      }
      
      // Refresh event details
      await fetchEventDetails();
    } catch (error: any) {
      console.error('Error updating participation:', error);
      setError(error.response?.data?.message || 'Failed to update participation');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      setError(null);
      
      if (!feedbackRating) {
        setError('Please provide a rating');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to submit feedback');
        return;
      }

      const response = await axios.post(
        `http://localhost:5001/api/events/${eventId}/feedback`,
        {
          rating: feedbackRating,
          comment: feedbackComment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        setFeedbackRating(null);
        setFeedbackComment('');
        await fetchEventDetails(); // Refresh event details to show new feedback
        setSuccess('Feedback submitted successfully!');
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  // Helper to check if user has already submitted feedback
  const userId = localStorage.getItem('userId');
  const hasSubmittedFeedback = event?.feedback?.some(fb => fb.user && fb.user._id === userId);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading event details...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/calendar')}
            sx={{ mt: 2 }}
          >
            Return to Calendar
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Event not found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/calendar')}
            sx={{ mt: 2 }}
          >
            Return to Calendar
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: '#001f3f' }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            iClub
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Quick Access Links */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6">Quick Access Links</Typography>
              <List>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/calendar')}>
                    <ListItemText primary="Calendar" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/clubs')}>
                    <ListItemText primary="Clubs" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate('/club-membership')}>
                    <ListItemText primary="Club Membership" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3, position: 'relative' }}>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Event Title and Date */}
              <Typography variant="h4" gutterBottom>
                {event?.title}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                {event?.date && new Date(event.date).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {event?.time}
              </Typography>

              {/* Event Description */}
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Event Description
                </Typography>
                <Typography paragraph>
                  {event?.description}
                </Typography>
              </Box>

              {/* Location Information */}
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Location Information
                </Typography>
                <Typography>
                  {event?.location}
                </Typography>
              </Box>

              {/* Event Type */}
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Event Type
                </Typography>
                <Typography sx={{ textTransform: 'capitalize' }}>
                  {event?.eventType}
                </Typography>
              </Box>

              {/* Participation Status and Action Buttons */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                {isParticipant && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#e8f5e9', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CheckCircleIcon color="success" />
                    <Typography color="success.main">
                      You are participating in this event
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setShowFeedbackForm(true)}
                    sx={{
                      minWidth: '150px',
                      bgcolor: '#001f3f',
                      '&:hover': {
                        bgcolor: '#00284d',
                      }
                    }}
                  >
                    Evaluation Form
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleParticipation}
                    sx={{
                      minWidth: '150px',
                      bgcolor: isParticipant ? '#4caf50' : '#001f3f',
                      '&:hover': {
                        bgcolor: isParticipant ? '#43a047' : '#00284d',
                      }
                    }}
                    startIcon={isParticipant ? <CheckCircleIcon /> : undefined}
                  >
                    {isParticipant ? 'Leave Event' : 'Join Event'}
                  </Button>
                </Box>
              </Box>

              {showFeedbackForm && (
                <Paper sx={{ p: 4, mt: 4, mb: 4, position: 'relative' }} elevation={4}>
                  <Typography variant="h5" gutterBottom>
                    Event Feedback
                  </Typography>
                  {isParticipant ? (
                    hasSubmittedFeedback ? (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        You have already submitted feedback for this event.
                      </Alert>
                    ) : (
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Quick Rating
                          </Typography>
                          <Rating
                            value={feedbackRating}
                            onChange={(_, newValue) => setFeedbackRating(newValue)}
                            size="large"
                          />
                        </Grid>
                        <Grid item xs={12} md={12}>
                          <Typography variant="subtitle1" gutterBottom>
                            Feedback Form
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={5}
                            placeholder="Share your thoughts about the event..."
                            value={feedbackComment}
                            onChange={e => setFeedbackComment(e.target.value)}
                            sx={{ mt: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              onClick={handleFeedbackSubmit}
                              variant="contained"
                              color="primary"
                              disabled={!feedbackRating}
                              sx={{ minWidth: 120 }}
                            >
                              Submit
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    )
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Only participants can submit feedback for this event.
                    </Alert>
                  )}
                </Paper>
              )}

              {/* Display Existing Feedback */}
              {event?.feedback && event.feedback.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Previous Feedback
                  </Typography>
                  {event.feedback.map((feedback, index) => (
                    <Paper key={feedback._id || index} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={feedback.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          by {feedback.user ? `${feedback.user.firstName} ${feedback.user.lastName}` : 'Anonymous User'}
                        </Typography>
                      </Box>
                      <Typography variant="body1">{feedback.comment}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Club Manager Section */}
              {isClubManager && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Participants
                  </Typography>
                  <List>
                    {participants.map((participant) => (
                      <ListItem key={participant._id}>
                        <ListItemText 
                          primary={`${participant.firstName} ${participant.lastName}`}
                          secondary={participant.email}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EventDetails;