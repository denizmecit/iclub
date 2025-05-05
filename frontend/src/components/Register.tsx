import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  IconButton,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Header from './Header';

interface Club {
  _id: string;
  name: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    userType: 'student',
    club: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const navigate = useNavigate();
  const { register } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const fetchClubs = async () => {
      if (formData.userType === 'clubManager') {
        try {
          const response = await axios.get('http://localhost:5001/api/clubs');
          setClubs(response.data);
        } catch (error) {
          console.error('Error fetching clubs:', error);
          setError('Error fetching clubs. Please try again later.');
        }
      }
    };

    fetchClubs();
  }, [formData.userType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'userType' && { club: '' })
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.userType === 'student' && !formData.studentId) {
      setError('Student ID is required for students');
      return;
    }

    if (formData.userType === 'clubManager' && !formData.club) {
      setError('Please select a club');
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: '400px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Header />
            <Typography 
              component="h1" 
              variant="h6" 
              sx={{ 
                mb: 3,
                color: theme.palette.primary.main,
                fontWeight: 600
              }}
            >
              Create Account
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  borderRadius: '8px'
                }}
              >
                {error}
              </Alert>
            )}

            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ 
                width: '100%',
                '& .MuiTextField-root, & .MuiFormControl-root': { mb: 2 }
              }}
            >
              <TextField
                required
                fullWidth
                name="firstName"
                label="First Name"
                size="small"
                value={formData.firstName}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                name="lastName"
                label="Last Name"
                size="small"
                value={formData.lastName}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                size="small"
                value={formData.email}
                onChange={handleChange}
              />

              <FormControl fullWidth size="small">
                <InputLabel>User Type</InputLabel>
                <Select
                  name="userType"
                  value={formData.userType}
                  label="User Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="clubManager">Club Manager</MenuItem>
                  <MenuItem value="admin">University Administrator</MenuItem>
                </Select>
              </FormControl>

              {formData.userType === 'student' && (
                <TextField
                  required
                  fullWidth
                  name="studentId"
                  label="Student ID"
                  size="small"
                  value={formData.studentId}
                  onChange={handleChange}
                />
              )}

              {formData.userType === 'clubManager' && (
                <FormControl fullWidth size="small">
                  <InputLabel>Club</InputLabel>
                  <Select
                    name="club"
                    value={formData.club}
                    label="Club"
                    onChange={handleSelectChange}
                  >
                    {clubs.map((club) => (
                      <MenuItem key={club._id} value={club._id}>
                        {club.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                size="small"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                size="small"
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
              >
                Create Account
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;