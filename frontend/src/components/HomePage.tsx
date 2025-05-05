import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  Group,
  Edit,
  LocationOn,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface AnnouncementType {
  _id: string;
  title: string;
  summary: string;
  createdAt: string;
  author: {
    name: string;
  };
}

interface EventType {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  registrationLink: string;
  category: string;
}

interface NewsType {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
}

const HomePage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [news, setNews] = useState<NewsType[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/home');
        setAnnouncements(response.data.announcements);
        setEvents(response.data.events);
        setNews(response.data.news);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };

    fetchHomeData();
  }, []);

  const quickAccessLinks = [
    { text: 'Event Calendar', icon: <CalendarToday />, path: '/calendar' },
    ...(user ? [
      ...(user.role === 'clubManager' ? [
        { text: 'Event Management', icon: <Edit />, path: '/events/manage' },
        { text: 'Garden Event Location', icon: <LocationOn />, path: '/garden-location' }
      ] : []),
      { text: 'Club Membership', icon: <Group />, path: '/membership' }
    ] : [])
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {/* Logo */}
            <Box
              component="img"
              src="/logo.png"
              alt="Logo"
              sx={{ height: 40, mr: 2 }}
            />
            {/* Navigation Links */}
            <Stack direction="row" spacing={2}>
              {['Home', 'Clubs', 'Events', 'About'].map((item) => (
                <Button
                  key={item}
                  color="inherit"
                  onClick={() => navigate(`/${item.toLowerCase()}`)}
                >
                  {item}
                </Button>
              ))}
            </Stack>
          </Box>
          <Button variant="outlined" color="primary" onClick={() => navigate('/login')}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Quick Access Links */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Quick Access Links
              </Typography>
              <List>
                {quickAccessLinks.map((item) => (
                  <ListItem
                    key={item.text}
                    component="a"
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                      },
                    }}
                  >
                    <Box sx={{ mr: 2 }}>{item.icon}</Box>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Announcements */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Announcements
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {announcements.map((announcement) => (
                <Box key={announcement._id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {announcement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                    {announcement.summary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Posted by {announcement.author.name} on{' '}
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Right Column: Events and News */}
          <Grid item xs={12} md={3}>
            <Stack spacing={3}>
              {/* Upcoming Events */}
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Upcoming Events</Typography>
                  <Button
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/events')}
                    size="small"
                  >
                    View All
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {events.map((event) => (
                  <Box key={event._id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.location}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      href={event.registrationLink}
                      target="_blank"
                      fullWidth
                    >
                      Register
                    </Button>
                  </Box>
                ))}
              </Paper>

              {/* Club News Highlights */}
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Club News</Typography>
                  <Button
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/news')}
                    size="small"
                  >
                    View All
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {news.map((item) => (
                  <Box key={item._id} sx={{ mb: 2 }}>
                    {item.imageUrl && (
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.title}
                        sx={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.content.substring(0, 80)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;