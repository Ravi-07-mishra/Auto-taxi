import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/userContext';
import { Box, Button, Typography, TextField, Alert } from '@mui/material';
import { RiLoginCircleFill } from 'react-icons/ri';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await login(email,password);
      if (response.user) {
      
       
        navigate('/userhome');
      } else {
        setError(response.data.msg || 'Unexpected error occurred.');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    }
  };

  return (
    <Box width="100%" height="100%" display="flex" flex="1" flexDirection="row">
      {/* Left side: Image */}
      <Box
        padding={2}
        mt={8}
        display={{ md: 'block', xs: 'none' }}
        sx={{ flex: 1 }}
      >
        <img
          src="login.png"
          alt="Login"
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
          onSubmit={handleLogin}
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
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box mb={3}>
            <Typography variant="body1" mb={1}>
              Email:
            </Typography>
            <TextField
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Box>

          <Box mb={3}>
            <Typography variant="body1" mb={1}>
              Password:
            </Typography>
            <TextField
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          >
            Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
