import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  SelectChangeEvent,
  AppBar,
  Toolbar,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  ButtonGroup,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  CalendarToday, 
  Group, 
  Feedback, 
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  ChangeCircle as ChangesRequestedIcon,
  Menu as MenuIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { Link } from '@mui/material';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'pending' | 'approved' | 'changes_requested';
  extendedProps: {
    description: string;
    location: string;
    time: string;
    club: {
      _id: string;
      name: string;
    };
    eventType: string;
    registrationLink: string;
    feedbackLink?: string;
    approvalStatus: string;
    approvalNotes?: string;
  };
}

interface Club {
  _id: string;
  name: string;
}

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'dayGridWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const quickAccessLinks = [
    { text: 'Event Calendar', icon: <CalendarToday />, path: '/admin/calendar' },
    { text: 'Club Management', icon: <Group />, path: '/admin/clubs' },
    { text: 'Feedback Overview', icon: <Feedback />, path: '/admin/feedback' },
  ];

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClub) params.append('club', selectedClub);
      if (selectedEventType) params.append('eventType', selectedEventType);
      if (selectedApprovalStatus) params.append('status', selectedApprovalStatus);
      if (startDate) params.append('startDate', startDate.format('YYYY-MM-DD'));
      if (endDate) params.append('endDate', endDate.format('YYYY-MM-DD'));

      const response = await axios.get(`http://localhost:5001/api/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const formattedEvents = response.data.map((event: any) => ({
        id: event._id,
        title: event.title,
        start: `${event.date.split('T')[0]}T${event.time}`,
        end: `${event.date.split('T')[0]}T${event.time}`,
        status: event.status,
        extendedProps: {
          description: event.description,
          location: event.location,
          time: event.time,
          club: event.club,
          eventType: event.eventType,
          registrationLink: event.registrationLink,
          feedbackLink: event.feedbackLink,
          approvalStatus: event.status,
          approvalNotes: event.approvalNotes,
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again later.');
    }
  }, [selectedClub, selectedEventType, selectedApprovalStatus, startDate, endDate]);

  const fetchClubs = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/clubs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Failed to fetch clubs. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchClubs();
  }, [fetchEvents, fetchClubs]);

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      console.log('User role:', user.role);
      console.log('Not an admin, redirecting...');
      navigate('/calendar');
      return;
    }

    console.log('Admin user verified:', user);
  }, [user, navigate]);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setApprovalNotes(info.event.extendedProps.approvalNotes || '');
    setIsDialogOpen(true);
  };

  const handleApproveEvent = async () => {
    if (!selectedEvent) return;
    
    if (!user || user.role !== 'admin') {
      setError('You must be an admin to perform this action');
      return;
    }
    
    try {
      console.log('Approving event:', selectedEvent.id);
      console.log('User role:', user.role);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await axios.patch(
        `http://localhost:5001/api/events/${selectedEvent.id}/status`,
        {
          status: 'approved',
          approvalNotes: approvalNotes || ''
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Approval response:', response.data);
      setSuccessMessage('Event approved successfully');
      await fetchEvents();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error approving event:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to approve events. Please make sure you are logged in as an admin.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 3000);
      } else {
        setError(error.response?.data?.message || 'Failed to approve event. Please try again.');
      }
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedEvent) {
      setError('No event selected');
      return;
    }
    
    if (!user || user.role !== 'admin') {
      setError('You must be an admin to perform this action');
      return;
    }
    
    if (!approvalNotes || approvalNotes.trim() === '') {
      setError('Please provide notes explaining the requested changes.');
      return;
    }
    
    try {
      console.log('Requesting changes for event:', selectedEvent.id);
      console.log('User role:', user.role);
      console.log('Token:', localStorage.getItem('token'));
      
      const response = await axios.patch(
        `http://localhost:5001/api/events/${selectedEvent.id}/status`,
        {
          status: 'changes_requested',
          approvalNotes: approvalNotes.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Changes request response:', response.data);
      setSuccessMessage('Changes requested successfully');
      await fetchEvents();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error requesting changes:', error);
      if (error.response?.status === 403) {
        setError('You do not have permission to request changes. Please make sure you are logged in as an admin.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 3000);
      } else {
        setError(error.response?.data?.message || 'Failed to request changes. Please try again.');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
    setApprovalNotes('');
    setError('');
  };

  const handleClubChange = (event: SelectChangeEvent) => {
    setSelectedClub(event.target.value);
  };

  const handleEventTypeChange = (event: SelectChangeEvent) => {
    setSelectedEventType(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setSelectedApprovalStatus(event.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const eventTypes = [
    'academic',
    'social',
    'sports',
    'cultural',
    'other'
  ];

  const handleResetFilters = () => {
    setSelectedClub('');
    setSelectedEventType('');
    setSelectedApprovalStatus('');
    setStartDate(null);
    setEndDate(null);
  };

  const navigateToToday = () => {
    setCurrentDate(dayjs());
  };

  const navigatePrevious = () => {
    setCurrentDate(currentDate.subtract(1, viewMode === 'dayGridMonth' ? 'month' : 'week'));
  };

  const navigateNext = () => {
    setCurrentDate(currentDate.add(1, viewMode === 'dayGridMonth' ? 'month' : 'week'));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Club Event Calendar - Admin View
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body1">
              Welcome, {user?.firstName} {user?.lastName}
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleLogout}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
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
                    component="div"
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
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Calendar and Filters */}
          <Grid item xs={12} md={9}>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" gutterBottom>
                  Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Club</InputLabel>
                      <Select
                        value={selectedClub}
                        label="Select Club"
                        onChange={handleClubChange}
                      >
                        <MenuItem value="">All Clubs</MenuItem>
                        {clubs.map((club) => (
                          <MenuItem key={club._id} value={club._id}>
                            {club.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Event Type</InputLabel>
                      <Select
                        value={selectedEventType}
                        label="Event Type"
                        onChange={handleEventTypeChange}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        {eventTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Approval Status</InputLabel>
                      <Select
                        value={selectedApprovalStatus}
                        label="Approval Status"
                        onChange={handleStatusChange}
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="changes_requested">Changes Requested</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleResetFilters}
                      size="medium"
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            {/* Calendar */}
            <Paper sx={{ p: 2 }}>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView={viewMode}
                events={events}
                eventClick={handleEventClick}
                headerToolbar={false}
                height="auto"
                eventContent={(eventInfo) => ({
                  html: `
                    <div class="fc-content" style="display: flex; align-items: center; gap: 4px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${
                        eventInfo.event.extendedProps.approvalStatus === 'approved'
                          ? '#4caf50'
                          : eventInfo.event.extendedProps.approvalStatus === 'changes_requested'
                          ? '#f44336'
                          : '#ff9800'
                      };"></div>
                      <div>${eventInfo.event.title}</div>
                    </div>
                  `
                })}
              />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Event Details Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              Event Details
              <Typography variant="caption" display="block" color="textSecondary">
                Status: {selectedEvent.extendedProps.approvalStatus.toUpperCase()}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Typography variant="h6">{selectedEvent.title}</Typography>
                <Typography><strong>Club:</strong> {selectedEvent.extendedProps.club.name}</Typography>
                <Typography><strong>Description:</strong> {selectedEvent.extendedProps.description}</Typography>
                <Typography><strong>Location:</strong> {selectedEvent.extendedProps.location}</Typography>
                <Typography><strong>Date:</strong> {dayjs(selectedEvent.start).format('MMMM D, YYYY')}</Typography>
                <Typography><strong>Time:</strong> {selectedEvent.extendedProps.time}</Typography>
                <Typography><strong>Event Type:</strong> {selectedEvent.extendedProps.eventType}</Typography>
                {selectedEvent.extendedProps.registrationLink && (
                  <Typography>
                    <strong>Registration Link:</strong>{' '}
                    <Link href={selectedEvent.extendedProps.registrationLink} target="_blank">
                      {selectedEvent.extendedProps.registrationLink}
                    </Link>
                  </Typography>
                )}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Approval Notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes about your decision (required for requesting changes)"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <ButtonGroup variant="contained">
                <Button
                  startIcon={<ApproveIcon />}
                  color="success"
                  onClick={handleApproveEvent}
                  disabled={selectedEvent.extendedProps.approvalStatus === 'approved'}
                >
                  Approve
                </Button>
                <Button
                  startIcon={<RejectIcon />}
                  color="error"
                  onClick={handleRequestChanges}
                  disabled={selectedEvent.extendedProps.approvalStatus === 'changes_requested'}
                >
                  Request Changes
                </Button>
              </ButtonGroup>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminCalendar; 