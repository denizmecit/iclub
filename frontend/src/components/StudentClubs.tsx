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
  Snackbar,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Club {
  _id: string;
  name: string;
  description: string;
  members: string[];
}

const StudentClubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/clubs');
        setClubs(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Error fetching clubs');
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const handleJoinClub = async (clubId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setError('Please login to join clubs');
        return;
      }

      await axios.post(
        `http://localhost:5001/api/clubs/${clubId}/members/${user._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the clubs list to reflect the new member
      setClubs(clubs.map(club => {
        if (club._id === clubId) {
          return {
            ...club,
            members: [...club.members, user._id]
          };
        }
        return club;
      }));

      setSuccessMessage('Successfully joined the club!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error joining club');
    }
  };

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  const isUserMember = (club: Club): boolean => {
    return Boolean(user && club.members.includes(user._id));
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Student Clubs
      </Typography>

      {successMessage && (
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        />
      )}

      <Paper elevation={3}>
        <List>
          {clubs.map((club, index) => (
            <React.Fragment key={club._id}>
              <ListItem
                sx={{
                  py: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
                secondaryAction={
                  !isUserMember(club) && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleJoinClub(club._id)}
                      sx={{ minWidth: 100 }}
                    >
                      Join Club
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Link
                      component="button"
                      variant="h6"
                      onClick={() => handleClubClick(club._id)}
                      sx={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {club.name}
                    </Link>
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
    </Container>
  );
};

export default StudentClubs; 