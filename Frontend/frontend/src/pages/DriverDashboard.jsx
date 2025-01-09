import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useDriverAuth } from '../Context/driverContext';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, Card, CardContent, Typography } from "@mui/material";
import '../Css/DriverDashboard.css'
const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { driver } = useDriverAuth();
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (driver) {
      const id = driver._id;
      setDriverId(id);
      console.log('Driver ID set to:', id);
    }
  }, [driver]);

  useEffect(() => {
    if (!driverId) return;

    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/driver/${driverId}`);
        const json = await response.json();
        setBookings(json.bookings || []);
        console.log('Fetched bookings:', json.bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [driverId]);

  useEffect(() => {
    if (!driverId) return;

    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('BookingRequest', (data) => {
      console.log('Received booking request:', data);
      if (data.driverId === driverId) {
        setBookingRequests((prev) => [...prev, data]);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('reconnect_attempt', () => {
      console.log('Reconnecting to socket...');
    });

    const updateDriverLocation = () => {
      if (driver && driver.location) {
        socket.emit('driverLocation', {
          id: driverId,
          lat: driver.location.lat,
          lng: driver.location.lng,
        });
      } else {
        socket.emit('driverLocation', {
          id: driverId,
          lat: 20.2960587, // Default latitude
          lng: 85.8245398, // Default longitude
        });
      }
    };

    updateDriverLocation();

    return () => {
      socket.off('BookingRequest');
      socket.disconnect();
      console.log('Socket disconnected on cleanup.');
    };
  }, [driverId, driver]);

  const handleAccept = (bookingId) => {
    const socket = socketRef.current;
    socket.emit('acceptBooking', { bookingId, price: 100 });
    setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId));
  };

  const handleDecline = (bookingId) => {
    const socket = socketRef.current;
    socket.emit('declineBooking', { bookingId });
    setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId));
  };

  const toggleAvailability = async () => {
    if (!driver || !driver.user) return;

    try {
      const response = await fetch('/api/driver/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.user.id,
          isAvailable: !driver.isAvailable || false,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        dispatch({ type: 'UPDATE_AVAILABILITY', payload: data.driver });
      } else {
        console.error(data.msg);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('driver');
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };
  return (
    <div className="dashboard-container p-4">
      <h2 className="text-2xl font-bold mb-4">Driver Dashboard</h2>
      {driver && <p className="text-lg mb-6">Welcome, {driver.email}!</p>}

      {/* Booking Requests */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Booking Requests</h3>
        <Grid container spacing={2}>
          {bookingRequests.length > 0 ? (
            bookingRequests.map((req) => (
              <Grid item  xs={12} sm={8} md={15}  key={req.bookingId} width={"400px"}>
                <Card className="hover:shadow-lg border border-gray-300">
                  <CardContent>
                    <Typography variant="body1">
                      <strong>Pickup:</strong>{" "}
                      {JSON.stringify(req.pickupLocation)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Destination:</strong>{" "}
                      {JSON.stringify(req.destinationLocation)}
                    </Typography>
                    <div className="mt-4 flex justify-between">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleAccept(req.bookingId)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDecline(req.bookingId)}
                      >
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <p>No booking requests at the moment.</p>
          )}
        </Grid>
      </div>

      {/* Bookings */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Bookings</h3>
        <Grid container spacing={2}>
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <Grid item xs={12} sm={8} md={15} key={booking._id} width={"100%"}>
                <Card className="hover:shadow-lg border border-gray-300">
                  <CardContent>
                    <Typography variant="body1">
                      <strong>Booking ID:</strong> {booking._id}
                    </Typography>
                    <Button
                      className="mt-4"
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/inbox/${booking._id}`)}
                    >
                      Open Inbox
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <p>No bookings available.</p>
          )}
        </Grid>
      </div>
    </div>
  );
};

export default DriverDashboard;