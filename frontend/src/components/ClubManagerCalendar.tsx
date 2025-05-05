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
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  CalendarToday, 
  Group, 
  Feedback, 
  Add as AddIcon, 
  Edit as EditIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  ChangeCircle as ChangesRequestedIcon,
  Menu as MenuIcon,
  LocationOn,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

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
    club: string;
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

interface EventFormData {
  title: string;
  description: string;
  location: string;
  date: Dayjs | null;
  time: string;
  eventType: string;
  registrationLink: string;
  feedbackLink?: string;
}

const ClubManagerCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [eventFormData, setEventFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    date: null,
    time: '',
    eventType: '',
    registrationLink: '',
    feedbackLink: '',
  });
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'dayGridWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const quickAccessLinks = [
    { text: 'Event Calendar', icon: <CalendarToday />, path: '/manager/calendar' },
    { text: 'Event Management', icon: <EditIcon />, path: '/events/manage' },
    { text: 'Club Membership', icon: <Group />, path: '/membership' },
    { text: 'Garden Event Location', icon: <LocationOn />, path: '/garden-location' }
  ];

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedApprovalStatus) params.append('status', selectedApprovalStatus);
      
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
        extendedProps: {
          description: event.description,
          location: event.location,
          time: event.time,
          eventType: event.eventType,
          registrationLink: event.registrationLink,
          feedbackLink: event.feedbackLink,
          approvalStatus: event.status,
          approvalNotes: event.approvalNotes
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again later.');
    }
  }, [selectedApprovalStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setIsDialogOpen(true);
  };

  const handleAddEvent = () => {
    setIsEditMode(false);
    setEventFormData({
      title: '',
      description: '',
      location: '',
      date: null,
      time: '',
      eventType: '',
      registrationLink: '',
      feedbackLink: '',
    });
    setIsEventFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setIsEditMode(true);
    setEventFormData({
      title: event.title,
      description: event.extendedProps.description,
      location: event.extendedProps.location,
      date: dayjs(event.start),
      time: event.extendedProps.time,
      eventType: event.extendedProps.eventType,
      registrationLink: event.extendedProps.registrationLink,
      feedbackLink: event.extendedProps.feedbackLink,
    });
    setIsEventFormOpen(true);
  };

  const formatTime = (time: string) => {
    // Add leading zeros if needed
    const [hours, minutes] = time.split(':');
    const paddedHours = hours.padStart(2, '0');
    const paddedMinutes = minutes ? minutes.padStart(2, '0') : '00';
    return `${paddedHours}:${paddedMinutes}`;
  };

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventFormData.date || !eventFormData.time || !eventFormData.title || !eventFormData.description || !eventFormData.location || !eventFormData.eventType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Ensure time is in HH:mm format
      let timeValue;
      if (typeof eventFormData.time === 'string') {
        timeValue = eventFormData.time;
      } else {
        const timeObj = dayjs(eventFormData.time);
        timeValue = timeObj.format('HH:mm');
      }

      const eventData = {
        title: eventFormData.title,
        description: eventFormData.description,
        location: eventFormData.location,
        date: eventFormData.date.format('YYYY-MM-DD'),
        time: timeValue,
        eventType: eventFormData.eventType,
        registrationLink: eventFormData.registrationLink || '',
        feedbackLink: eventFormData.feedbackLink || '',
        club: user?.club,
        createdBy: user?._id, // Add createdBy field
        status: 'pending'
      };

      console.log('Submitting event data:', eventData);

      if (isEditMode && selectedEvent) {
        const response = await axios.put(`http://localhost:5001/api/events/${selectedEvent.id}`, eventData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('http://localhost:5001/api/events', eventData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Create response:', response.data);
      }

      setIsEventFormOpen(false);
      fetchEvents();
      setSuccessMessage('Event saved successfully!');
    } catch (error: any) {
      console.error('Error saving event:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error creating event';
      alert(errorMessage);
    }
  };

  const handleEventFormChange = (field: keyof EventFormData, value: any) => {
    setEventFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'changes_requested':
        return <ChangesRequestedIcon color="error" />;
      default:
        return null;
    }
  };

  const handleEventTypeChange = (event: SelectChangeEvent) => {
    setSelectedEventType(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setSelectedApprovalStatus(event.target.value);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
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
            Club Event Calendar - Manager View
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              color="primary"
              onClick={handleAddEvent}
            >
              Add Event
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              color="primary"
              onClick={() => navigate('/events/manage')}
            >
              Edit Event
            </Button>
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
                  <Grid item xs={12} md={3}>
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
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Approval Status</InputLabel>
                      <Select
                        value={selectedApprovalStatus}
                        label="Approval Status"
                        onChange={(e) => setSelectedApprovalStatus(e.target.value)}
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
                      variant="contained"
                      onClick={handleResetFilters}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            {/* Calendar */}
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <IconButton onClick={navigatePrevious}>&lt;</IconButton>
                  <IconButton onClick={navigateNext}>&gt;</IconButton>
                  <Button onClick={navigateToToday}>today</Button>
                </Box>
                <Typography variant="h5">
                  {currentDate.format('MMMM YYYY')}
                </Typography>
                <Box>
                  <Button
                    variant={viewMode === 'dayGridMonth' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('dayGridMonth')}
                    sx={{ mr: 1 }}
                  >
                    month
                  </Button>
                  <Button
                    variant={viewMode === 'dayGridWeek' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('dayGridWeek')}
                  >
                    week
                  </Button>
                </Box>
              </Box>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView={viewMode}
                events={events}
                eventClick={handleEventClick}
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
                headerToolbar={false}
                height="auto"
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Event Details Dialog */}
        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          {selectedEvent && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6">{selectedEvent.title}</Typography>
                  <Box>
                    {getStatusIcon(selectedEvent.extendedProps.approvalStatus)}
                    <IconButton 
                      onClick={() => {
                        handleEditEvent(selectedEvent);
                        handleCloseDialog();
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2}>
                  <Typography variant="body1">
                    <strong>Date:</strong>{' '}
                    {new Date(selectedEvent.start).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Time:</strong> {selectedEvent.extendedProps.time}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Location:</strong> {selectedEvent.extendedProps.location}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Event Type:</strong>{' '}
                    {selectedEvent.extendedProps.eventType.charAt(0).toUpperCase() +
                      selectedEvent.extendedProps.eventType.slice(1)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Description:</strong>
                    <br />
                    {selectedEvent.extendedProps.description}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Approval Status:</strong>{' '}
                    {selectedEvent.extendedProps.approvalStatus.charAt(0).toUpperCase() +
                      selectedEvent.extendedProps.approvalStatus.slice(1).replace('_', ' ')}
                  </Typography>
                  {selectedEvent.extendedProps.approvalNotes && (
                    <Typography variant="body1">
                      <strong>Approval Notes:</strong>
                      <br />
                      {selectedEvent.extendedProps.approvalNotes}
                    </Typography>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                {selectedEvent.extendedProps.registrationLink && (
                  <Button
                    href={selectedEvent.extendedProps.registrationLink}
                    target="_blank"
                    variant="contained"
                    color="primary"
                  >
                    Register
                  </Button>
                )}
                {selectedEvent.extendedProps.feedbackLink && (
                  <Button
                    href={selectedEvent.extendedProps.feedbackLink}
                    target="_blank"
                    variant="outlined"
                  >
                    Feedback
                  </Button>
                )}
                <Button onClick={handleCloseDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Event Form Dialog */}
        <Dialog 
          open={isEventFormOpen} 
          onClose={() => setIsEventFormOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditMode ? 'Edit Event' : 'Create New Event'}
            {selectedEvent && selectedEvent.extendedProps.approvalStatus === 'changes_requested' && (
              <Typography color="error" variant="caption" display="block">
                Changes Requested: {selectedEvent.extendedProps.approvalNotes}
              </Typography>
            )}
          </DialogTitle>
          <form onSubmit={handleEventFormSubmit}>
            <DialogContent>
              <Stack spacing={2}>
                <TextField
                  required
                  label="Event Title"
                  value={eventFormData.title}
                  onChange={(e) => handleEventFormChange('title', e.target.value)}
                  fullWidth
                />
                <TextField
                  required
                  label="Description"
                  value={eventFormData.description}
                  onChange={(e) => handleEventFormChange('description', e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                />
                <TextField
                  required
                  label="Location"
                  value={eventFormData.location}
                  onChange={(e) => handleEventFormChange('location', e.target.value)}
                  fullWidth
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Event Date"
                    value={eventFormData.date}
                    onChange={(newValue) => handleEventFormChange('date', newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Time"
                    value={eventFormData.time ? dayjs(eventFormData.time) : null}
                    onChange={(newValue) => handleEventFormChange('time', newValue)}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        required: true
                      } 
                    }}
                    ampm={false}
                    minutesStep={5}
                  />
                </LocalizationProvider>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={eventFormData.eventType}
                    label="Event Type"
                    onChange={(e) => handleEventFormChange('eventType', e.target.value)}
                  >
                    {eventTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Registration Link"
                  value={eventFormData.registrationLink}
                  onChange={(e) => handleEventFormChange('registrationLink', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Feedback Link"
                  value={eventFormData.feedbackLink}
                  onChange={(e) => handleEventFormChange('feedbackLink', e.target.value)}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEventFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {isEditMode ? 'Save Changes' : 'Create Event'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClubManagerCalendar; 