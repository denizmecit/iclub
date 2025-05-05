import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Location {
  id: number;
  x: number;
  y: number;
  label: string;
}

const GardenLocationPage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, x: 100, y: 100, label: "Main Stage" },
    { id: 2, x: 300, y: 150, label: "Food Court" },
    { id: 3, x: 500, y: 200, label: "Workshop Area" },
    { id: 4, x: 200, y: 300, label: "Rest Area" },
    { id: 5, x: 400, y: 350, label: "Information Desk" },
  ]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLocationClick = (location: Location) => {
    if (!isEditing) return;
    setSelectedLocation(location);
    setNewLabel(location.label);
    setIsDialogOpen(true);
  };

  const handleLabelChange = () => {
    if (!selectedLocation || !newLabel.trim()) return;
    setLocations(prevLocations =>
      prevLocations.map(loc =>
        loc.id === selectedLocation.id ? { ...loc, label: newLabel.trim() } : loc
      )
    );
    setIsDialogOpen(false);
    setSelectedLocation(null);
    setNewLabel('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Garden Event Location Map
          </Typography>
          {user?.role === 'clubManager' && (
            <Box>
              {isEditing ? (
                <>
                  <IconButton color="primary" onClick={() => setIsEditing(false)}>
                    <SaveIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => setIsEditing(false)}>
                    <CancelIcon />
                  </IconButton>
                </>
              ) : (
                <IconButton color="primary" onClick={() => setIsEditing(true)}>
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper 
          sx={{ 
            p: 2,
            position: 'relative',
            width: '100%',
            height: 600,
            backgroundColor: '#f8f8f8',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* UC Circle */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 100,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 200,
              height: 100,
              borderTopLeftRadius: 100,
              borderTopRightRadius: 100,
              bgcolor: '#e0e0e0',
              border: '2px solid #ccc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography>UC</Typography>
          </Box>

          {/* Location Markers */}
          <Grid container spacing={2} sx={{ height: '100%', position: 'relative' }}>
            {locations.map((location) => (
              <Grid item key={location.id}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: location.x,
                    top: location.y,
                    cursor: isEditing ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={() => handleLocationClick(location)}
                >
                  <LocationIcon 
                    sx={{ 
                      fontSize: 32,
                      color: isEditing ? 'primary.main' : 'text.secondary',
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: -0.5,
                      bgcolor: 'background.paper',
                      px: 1,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {location.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Edit Label Dialog */}
        <Dialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          PaperProps={{
            sx: { minWidth: 300 }
          }}
        >
          <DialogTitle>Edit Location Label</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Location Label"
              fullWidth
              variant="outlined"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLabelChange} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GardenLocationPage; 