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
  Link,
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
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  People as PeopleIcon,
  Feedback, 
  Add as AddIcon, 
  Edit as EditIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  ChangeCircle as ChangesRequestedIcon,
  Groups as GroupsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  LocationOn,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { EventClickArg } from '@fullcalendar/core';

interface EventData {
  _id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  club: {
    _id: string;
    name: string;
  };
  eventType: string;
  registrationLink?: string;
  feedbackLink?: string;
}

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    description: string;
    location: string;
    time: string;
    club: {
      _id: string;
      name: string;
    };
    eventType: string;
    registrationLink?: string;
    feedbackLink?: string;
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
  feedbackLink: string;
}

const EventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('');
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
  const [error, setError] = useState<string | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const quickAccessLinks = [
    { text: 'Event Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'Event Management', icon: <EditIcon />, path: '/events/manage' },
    { text: 'Club Membership', icon: <PeopleIcon />, path: '/membership' },
    ...(user?.role === 'clubManager' ? [
      { text: 'Garden Event Location', icon: <LocationOn />, path: '/garden-location' }
    ] : [])
  ];

  const fetchClubs = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/clubs');
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClub) params.append('club', selectedClub);
      if (selectedEventType) params.append('eventType', selectedEventType);
      if (user?.role === 'clubManager') {
        if (selectedApprovalStatus) params.append('status', selectedApprovalStatus);
      } else {
        // For students, only show approved events
        params.append('status', 'approved');
      }
      if (startDate) params.append('startDate', startDate.format('YYYY-MM-DD'));
      if (endDate) params.append('endDate', endDate.format('YYYY-MM-DD'));

      const response = await axios.get<EventData[]>(`http://localhost:5001/api/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const formattedEvents: Event[] = response.data.map((event) => ({
        id: event._id,
        title: event.title,
        start: `${event.date.split('T')[0]}T${event.time}`,
        end: `${event.date.split('T')[0]}T${event.time}`,
        extendedProps: {
          description: event.description,
          location: event.location,
          time: event.time,
          club: {
            _id: event.club._id,
            name: event.club.name
          },
          eventType: event.eventType,
          ...(event.registrationLink && { registrationLink: event.registrationLink }),
          ...(event.feedbackLink && { feedbackLink: event.feedbackLink })
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events. Please try again later.');
    }
  }, [selectedClub, selectedEventType, selectedApprovalStatus, startDate, endDate, user?.role]);

  useEffect(() => {
    fetchClubs();
    fetchEvents();
  }, [fetchClubs, fetchEvents]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    navigate(`/events/${eventId}`);
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
      registrationLink: event.extendedProps.registrationLink || '',
      feedbackLink: event.extendedProps.feedbackLink || '',
    });
    setIsEventFormOpen(true);
  };

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventFormData,
        club: user?.club,
        date: eventFormData.date?.format('YYYY-MM-DD'),
        // Only include non-empty links
        ...(eventFormData.registrationLink && { registrationLink: eventFormData.registrationLink }),
        ...(eventFormData.feedbackLink && { feedbackLink: eventFormData.feedbackLink }),
      };

      if (isEditMode && selectedEvent) {
        await axios.put(`http://localhost:5001/api/events/${selectedEvent.id}`, eventData);
      } else {
        await axios.post('http://localhost:5001/api/events', eventData);
      }

      setIsEventFormOpen(false);
      fetchEvents(); // Use the existing fetchEvents function
    } catch (error) {
      console.error('Error saving event:', error);
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

  const handleClubChange = (event: SelectChangeEvent) => {
    setSelectedClub(event.target.value);
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
    setSelectedClub('');
    setSelectedEventType('');
    if (user?.role === 'clubManager') {
      setSelectedApprovalStatus('');
    }
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

  const handleCloseEventDetail = () => {
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
              {user?.role === 'clubManager' ? 'Club Event Calendar - Manager View' : 'Club Event Calendar'}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {user?.role === 'clubManager' && (
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  color="primary"
                  onClick={handleAddEvent}
                >
                  Add Event
                </Button>
              )}
              <Typography variant="body1">
                Welcome, {user?.firstName} {user?.lastName}
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleLogout}>
                Logout
              </Button>
            </Stack>
          </Box>
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
                  <Grid item xs={12} md={user?.role === 'clubManager' ? 2 : 3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select a Club</InputLabel>
                      <Select
                        value={selectedClub}
                        label="Select a Club"
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
                  <Grid item xs={12} md={user?.role === 'clubManager' ? 2 : 3}>
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
                  {user?.role === 'clubManager' && (
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
                  )}
                  <Grid item xs={12} md={user?.role === 'clubManager' ? 2 : 3}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={user?.role === 'clubManager' ? 2 : 3}>
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
                eventContent={(arg) => {
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getStatusIcon(arg.event.extendedProps.approvalStatus)}
                      <span>{arg.event.title}</span>
                    </Box>
                  );
                }}
                headerToolbar={false}
                height="auto"
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Event Form Dialog */}
        <Dialog 
          open={isEventFormOpen} 
          onClose={() => setIsEventFormOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {isEditMode ? 'Edit Event' : 'Add New Event'}
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
                <TextField
                  required
                  label="Time"
                  value={eventFormData.time}
                  onChange={(e) => handleEventFormChange('time', e.target.value)}
                  fullWidth
                  type="time"
                  InputLabelProps={{ shrink: true }}
                />
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

        {/* Event Details Dialog */}
        <Dialog 
          open={isEventDetailOpen} 
          onClose={handleCloseEventDetail}
          maxWidth="sm"
          fullWidth
        >
          {selectedEvent && (
            <>
              <DialogTitle>
                Event Details
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
                      <Link href={selectedEvent.extendedProps.registrationLink} target="_blank" rel="noopener noreferrer">
                        {selectedEvent.extendedProps.registrationLink}
                      </Link>
                    </Typography>
                  )}
                  {selectedEvent.extendedProps.feedbackLink && (
                    <Typography>
                      <strong>Feedback Link:</strong>{' '}
                      <Link href={selectedEvent.extendedProps.feedbackLink} target="_blank" rel="noopener noreferrer">
                        {selectedEvent.extendedProps.feedbackLink}
                      </Link>
                    </Typography>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseEventDetail}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default EventCalendar; 