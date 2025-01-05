import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useDriverAuthContext } from '../hooks/usedriverauthContext';
import { useNavigate } from 'react-router-dom';
import '../Css/DriverDashboard.css';

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { driver, dispatch } = useDriverAuthContext();
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (driver && driver.user) {
      const id = driver.user.id;
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
    <div className="dashboard-container">
      <h2>Driver Dashboard</h2>
      {driver && <p className="welcome-message">Welcome, {driver.user.email}!</p>}

      <div className="booking-requests">
        <h3>Booking Requests</h3>
        {bookingRequests.length > 0 ? (
          bookingRequests.map((req) => (
            <div key={req.bookingId} className="request-card">
              <p>Pickup: {JSON.stringify(req.pickupLocation)}</p>
              <p>Destination: {JSON.stringify(req.destinationLocation)}</p>
              <button onClick={() => handleAccept(req.bookingId)}>Accept</button>
              <button onClick={() => handleDecline(req.bookingId)}>Decline</button>
            </div>
          ))
        ) : (
          <p>No booking requests at the moment.</p>
        )}
      </div>

      <div className="bookings">
        <h3>Bookings</h3>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <p>Booking ID: {booking._id}</p>
              <button onClick={() => navigate(`/inbox/${booking._id}`)}>Open Inbox</button>
            </div>
          ))
        ) : (
          <p>No bookings available.</p>
        )}
      </div>

      {driver && driver.isAvailable !== undefined ? (
        <button onClick={toggleAvailability}>
          {driver.isAvailable ? 'Go Offline' : 'Go Online'}
        </button>
      ) : (
        <p>Loading availability status...</p>
      )}
      <button className="logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default DriverDashboard;
