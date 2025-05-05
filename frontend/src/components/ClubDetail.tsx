import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Club {
  _id: string;
  name: string;
  description: string;
}

const ClubDetail: React.FC = () => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/clubs/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setClub(response.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching club details');
        setLoading(false);
      }
    };

    if (id) {
      fetchClubDetails();
    }
  }, [id]);

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

  if (!club) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 2 }}>Club not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            {club.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            {club.description}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ClubDetail; 