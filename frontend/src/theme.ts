import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#001F3F', // Navy blue
      light: '#173454',
      dark: '#00152A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F0F4F8', // Light blue-grey
      light: '#FFFFFF',
      dark: '#D8E2ED',
      contrastText: '#001F3F',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0.0075em',
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 31, 63, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 31, 63, 0.08)',
        },
      },
    },
  },
});

export default theme; 