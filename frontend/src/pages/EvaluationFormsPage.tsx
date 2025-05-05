import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EvaluationForm from '../components/EvaluationForm';

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

const EvaluationFormsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchUserEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setError('Please log in to view your events');
        setLoading(false);
        return;
      }

      // Fetch all events
      const response = await axios.get('http://localhost:5001/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter events where the user is a participant
      const userEvents = response.data.filter((event: Event) => 
        event.participants.includes(userId)
      );

      setEvents(userEvents);
    } catch (error: any) {
      console.error('Error fetching user events:', error);
      setError(error.response?.data?.message || 'Failed to fetch your events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const handleOpenFeedbackForm = (event: Event) => {
    if (event && event._id) {
      navigate(`/events/${event._id}`);
    } else {
      setError('Invalid event data');
    }
  };

  const handleFeedbackSuccess = () => {
    setSelectedEvent(null);
    fetchUserEvents();
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your events...
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
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Return to Home
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
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography variant="h4" gutterBottom>
                Event Evaluation Forms
              </Typography>
              <Typography variant="subtitle1" gutterBottom color="textSecondary">
                Provide feedback for events you've joined
              </Typography>

              {events.length === 0 ? (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary">
                    You haven't joined any events yet
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/calendar')}
                    sx={{ mt: 2 }}
                  >
                    Browse Events
                  </Button>
                </Box>
              ) : (
                <List sx={{ mt: 2 }}>
                  {events.map((event) => (
                    <React.Fragment key={event._id}>
                      <ListItem
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          py: 2,
                        }}
                      >
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">{event.title}</Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenFeedbackForm(event)}
                            sx={{ 
                              bgcolor: '#001f3f',
                              '&:hover': {
                                bgcolor: '#00284d',
                              }
                            }}
                          >
                            Evaluation Form
                          </Button>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} at {event.time}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {event.location}
                        </Typography>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {selectedEvent && (
        <EvaluationForm
          eventId={selectedEvent._id}
          onSuccess={handleFeedbackSuccess}
          onCancel={() => setSelectedEvent(null)}
        />
      )}
    </Box>
  );
};

export default EvaluationFormsPage; 