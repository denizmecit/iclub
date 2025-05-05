import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Club {
  _id: string;
  name: string;
  description: string;
  members: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

const ClubManagement: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchClubs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5001/api/clubs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Failed to fetch clubs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleOpenDialog = (club?: Club) => {
    if (club) {
      setSelectedClub(club);
      setFormData({
        name: club.name,
        description: club.description,
      });
      setIsEditMode(true);
    } else {
      setSelectedClub(null);
      setFormData({
        name: '',
        description: '',
      });
      setIsEditMode(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedClub(null);
    setFormData({
      name: '',
      description: '',
    });
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedClub) {
        await axios.put(
          `http://localhost:5001/api/clubs/${selectedClub._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setSuccessMessage('Club updated successfully!');
      } else {
        await axios.post(
          'http://localhost:5001/api/clubs',
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setSuccessMessage('Club created successfully!');
      }
      handleCloseDialog();
      fetchClubs();
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handleDelete = async (clubId: string) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        await axios.delete(`http://localhost:5001/api/clubs/${clubId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSuccessMessage('Club deleted successfully!');
        fetchClubs();
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete club. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Club Management
          </Typography>
          {user && (
            <Typography variant="body1" sx={{ mr: 2 }}>
              Welcome, {user.firstName} {user.lastName}
            </Typography>
          )}
          <Button variant="outlined" color="primary" onClick={handleLogout}>
            Logout
          </Button>
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Clubs
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Club
          </Button>
        </Box>

        {isLoading ? (
          <Typography>Loading clubs...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club._id}>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.description}</TableCell>
                    <TableCell>{club.members?.length || 0}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(club)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(club._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Edit Club' : 'Add New Club'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Club Name"
                type="text"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClubManagement; 