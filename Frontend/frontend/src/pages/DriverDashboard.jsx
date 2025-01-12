import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useDriverAuth } from '../Context/driverContext';
import { useNavigate } from 'react-router-dom';
import { Button, Grid, Card, CardContent, Typography } from "@mui/material";
import '../Css/DriverDashboard.css'
import { useSubscription } from '../Context/SubscriptionContext';

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [bookingRequests, setBookingRequests] = useState([]);
  const {subscription} = useSubscription();
  
  const [bookings, setBookings] = useState([]);
  
  const { driver } = useDriverAuth();
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const isSubscriptionValid =
  subscription.isSubscribed && new Date(subscription.expiryDate) > new Date();

  // Redirect to login if not authenticated
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Redirect to login if not authenticated
      if (!driver) {
        navigate('/driverlogin');
      } else {
        setDriverId(driver._id);
        console.log('Driver ID set to:', driver._id);
      }
    }, 5000); // Wait for 5 seconds (5000 milliseconds)
  
    return () => clearTimeout(timeout); // Cleanup the timeout on component unmount
  }, [driver, navigate]);

  useEffect(() => {
    if (!driverId || !isSubscriptionValid) return;

    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/driver/${driverId}`);
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [driverId, isSubscriptionValid]);

  useEffect(() => {
    if (!driverId ) return;


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
      if (driver && driver.location && driver.location.lat && driver.location.lng) {
        socket.emit('driverLocation', {
          id: driverId,
          lat: driver.location.lat,
          lng: driver.location.lng,
        });
      } else {
        // Fallback location
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
  }, [driverId,driver]);

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
  const openInbox = (bookingId) => {
    navigate(`/driver/inbox/${bookingId}`);
  };

  const logout = () => {
    localStorage.removeItem('driver');
    navigate('/login');
  };

  if (!isSubscriptionValid) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-cover bg-center"
        style={{ backgroundImage: 'url("your-image.jpg")' }}
      >
        <div className="bg-white bg-opacity-50 p-8 rounded-lg shadow-xl w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800">Your subscription is inactive or expired.</h2>
          <Button variant="contained" color="primary" onClick={() => navigate('/subscription')} className="mt-4">
            Renew Subscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-cover bg-center min-h-screen"
      style={{
        backgroundImage: 'url("driverbg.jpg")', // Replace with your image URL
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Content (Heading and Welcome Message) */}
      <div className="flex items-center justify-center h-full pt-16">
        <div className="bg-white bg-opacity-70 p-8 rounded-lg shadow-xl w-full max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">Driver Dashboard</h2>
          <p className="text-xl text-gray-600 text-center">Welcome, {driver?.name}!</p>
        </div>
      </div>
      <section className="py-20 bg-transparent">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
            Driver Dashboard
          </h1>
          <p className="text-blue-100 mt-4 text-lg">
            Welcome, {driver?.name}. Manage your bookings and requests with ease.
          </p>
        </div>
      </section>
      {/* Booking Requests Section */}
     {/* Booking Requests Section */}
     <section className="py-12 bg-transparent">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Booking Requests</h2>
          <div className="flex flex-wrap justify-center">
            {bookingRequests.map((req) => (
              <div
                key={req.bookingId}
                className="mb-6 w-full md:w-1/2 lg:w-1/3 p-4"
              >
                <div className="bg-transparent p-6 rounded-lg shadow-xl backdrop-blur-md">
                  <Typography variant="body1" className="text-gray-800">
                    Pickup: Lat: {req.pickupLocation.lat}, Lng: {req.pickupLocation.lng}
                  </Typography>
                  <Typography variant="body1" className="text-gray-800">
                    Destination: Lat: {req.destinationLocation.lat}, Lng: {req.destinationLocation.lng}
                  </Typography>
                  <div className="flex mt-4 justify-center">
                    <Button onClick={() => handleAccept(req.bookingId)} className="mr-2 bg-green-500 text-white">
                      Accept
                    </Button>
                    <Button onClick={() => handleDecline(req.bookingId)} className="bg-red-500 text-white">
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Bookings Section */}
      <section className="py-12 bg-transparent">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Your Bookings</h2>
          <div className="flex flex-wrap justify-center">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="mb-6 w-full md:w-1/2 lg:w-1/3 p-4"
              >
                <div className="bg-transparent p-6 rounded-lg shadow-xl backdrop-blur-md">
                  <Typography variant="body1" className="text-gray-800">
                    Booking ID: {booking._id}
                  </Typography>
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() =>  openInbox(booking._id)}
                      className="bg-blue-500 text-white"
                    >
                      Open Inbox
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer (Toggle Availability and Logout) */}
      <div className="flex justify-between px-8 py-4">
        <Button onClick={toggleAvailability} className="bg-blue-500 text-white">Toggle Availability</Button>
        <Button onClick={logout} className="bg-red-500 text-white">Logout</Button>
      </div>
    </div>
  );
};

export default DriverDashboard;