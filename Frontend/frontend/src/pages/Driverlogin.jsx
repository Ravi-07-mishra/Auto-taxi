import React, { useState } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { useDriverAuth } from '../Context/driverContext';
import { Box, Button, Typography, TextField } from '@mui/material';
import { RiLoginCircleFill } from 'react-icons/ri';
import toast from 'react-hot-toast';

const DriverLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const socket = useSocket();
  const { login } = useDriverAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      if (data && data.driver) {
        sendDriverLocation(data.driver._id);
        setMsg('Login successful!');
        toast.success('Logged in Successfully', { id: 'login' });
        setTimeout(() => navigate('/driverdashboard'), 500);
      } else {
        throw new Error('Login failed: Driver data not found');
      }
    } catch (error) {
      setMsg(error.message);
      toast.error(error.message, { id: 'loginError' });
    } finally {
      setLoading(false);
    }
  };

  const sendDriverLocation = (driverId) => {
    const sendLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              id: driverId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (socket?.connected) {
              socket.emit('driverLocation', location);
              console.log('Location sent:', location);
            } else {
              console.error('Socket is not connected. Retrying...');
              setTimeout(sendLocation, 5000); // Retry after 5 seconds
            }
          },
          (error) => console.error('Geolocation error:', error.message)
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };

    sendLocation();
    setInterval(sendLocation, 10000); // Send location every 10 seconds
  };

  return (
    <Box width="100%" height="100%" display="flex" flexDirection="row">
      {/* Left side: Placeholder Image */}
      <Box
        padding={2}
        mt={8}
        display={{ md: 'block', xs: 'none' }}
        sx={{ flex: 1 }}
      >
        <img
          src="login.png"
          alt="Driver Login"
          style={{ width: '100%', maxWidth: '400px', display: 'block', margin: 'auto' }}
        />
      </Box>

      {/* Right side: Login Form */}
      <Box
        display="flex"
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding={2}
        margin="auto"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            margin: 'auto',
            padding: 4,
            boxShadow: '10px 10px 20px rgba(0,0,0,0.2)',
            borderRadius: 2,
            maxWidth: '400px',
            width: '100%',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h4" textAlign="center" fontWeight={600} mb={3}>
            Driver Login
          </Typography>

          <Box mb={3}>
            <Typography variant="body1" mb={1}>
              Email:
            </Typography>
            <TextField
              type="email"
              name="email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Box>

          <Box mb={3}>
            <Typography variant="body1" mb={1}>
              Password:
            </Typography>
            <TextField
              type="password"
              name="password"
              fullWidth
              variant="outlined"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            sx={{
              py: 1.5,
              mt: 2,
              borderRadius: 2,
              bgcolor: '#00fffc',
              color: '#000',
              ':hover': {
                bgcolor: 'white',
                color: 'black',
              },
            }}
            endIcon={<RiLoginCircleFill />}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverLogin;
