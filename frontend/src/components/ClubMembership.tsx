import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { ExitToApp as ExitIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Club {
  _id: string;
  name: string;
  description: string;
  members: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
}

const ClubMembership: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/clubs', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        // Filter clubs where the user is a member
        const userClubs = response.data.filter((club: Club) => 
          club.members.some(member => member._id === user?._id)
        );
        setClubs(userClubs);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error fetching clubs');
        setLoading(false);
      }
    };

    if (user) {
      fetchClubs();
    }
  }, [user]);

  const handleLeaveClub = async () => {
    if (!selectedClub || !user) return;

    try {
      await axios.delete(
        `http://localhost:5001/api/clubs/${selectedClub._id}/members/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update local state
      setClubs(clubs.filter(club => club._id !== selectedClub._id));
      setSuccessMessage(`Successfully left ${selectedClub.name}`);
      
      // Close the dialog
      handleCloseDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error leaving club');
    }
  };

  const handleOpenDialog = (club: Club) => {
    setSelectedClub(club);
    setConfirmDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedClub(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (clubs.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          My Club Memberships
        </Typography>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            You are not a member of any clubs yet.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        My Club Memberships
      </Typography>
      <Paper elevation={3}>
        <List>
          {clubs.map((club, index) => (
            <React.Fragment key={club._id}>
              <ListItem
                sx={{ py: 2 }}
                secondaryAction={
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ExitIcon />}
                    onClick={() => handleOpenDialog(club)}
                  >
                    Leave Club
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      {club.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {club.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index < clubs.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Leave Club</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave {selectedClub?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLeaveClub} color="error" variant="contained">
            Yes, Leave Club
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClubMembership; 