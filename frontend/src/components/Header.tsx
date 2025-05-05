import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hide navigation buttons on login and register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo and Title */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              Inter-Club
            </Typography>
          </Box>

          {/* Navigation Links */}
          {!isAuthPage && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!user ? (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;