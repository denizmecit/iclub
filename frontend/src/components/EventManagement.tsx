import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  ChangeCircle as ChangesRequestedIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  registrationLink: string;
  feedbackLink?: string;
  status: 'pending' | 'approved' | 'changes_requested';
  approvalNotes?: string;
  club: {
    _id: string;
    name: string;
  };
}

interface EventFormData {
  title: string;
  description: string;
  location: string;
  date: any;
  time: string;
  eventType: string;
  registrationLink: string;
  feedbackLink?: string;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    date: null,
    time: '',
    eventType: '',
    registrationLink: '',
    feedbackLink: '',
  });

  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      date: null,
      time: '',
      eventType: '',
      registrationLink: '',
      feedbackLink: '',
    });
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      date: dayjs(event.date),
      time: event.time,
      eventType: event.eventType,
      registrationLink: event.registrationLink,
      feedbackLink: event.feedbackLink,
    });
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await axios.delete(`http://localhost:5001/api/events/${selectedEvent._id}`);
      await fetchEvents();
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: formData.date?.format('YYYY-MM-DD'),
        club: user?.club
      };

      if (selectedEvent) {
        await axios.put(`http://localhost:5001/api/events/${selectedEvent._id}`, eventData);
      } else {
        await axios.post('http://localhost:5001/api/events', eventData);
      }

      await fetchEvents();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
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
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'changes_requested':
        return 'error';
      default:
        return 'default';
    }
  };

  const eventTypes = ['academic', 'social', 'sports', 'cultural', 'other'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Event Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddEvent}
        >
          Add New Event
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                <TableCell>{event.time}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>
                  {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(event.status)}
                    label={event.status.replace('_', ' ')}
                    color={getStatusColor(event.status) as any}
                    size="small"
                  />
                  {event.approvalNotes && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Note: {event.approvalNotes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditEvent(event)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDeleteDialogOpen(true);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Event Form Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {selectedEvent ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                multiline
                rows={4}
                fullWidth
              />
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                fullWidth
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Event Date"
                  value={formData.date}
                  onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
              <TextField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth required>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={formData.eventType}
                  label="Event Type"
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
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
                value={formData.registrationLink}
                onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Feedback Link"
                value={formData.feedbackLink}
                onChange={(e) => setFormData({ ...formData, feedbackLink: e.target.value })}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteEvent} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventManagement; 