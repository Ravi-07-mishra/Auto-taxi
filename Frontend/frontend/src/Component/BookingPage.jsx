import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, DollarSign, Calendar, Clock } from "lucide-react";
import { CSSTransition } from 'react-transition-group';
import '../Css/BookingPage.css'; // Import the updated CSS

const BookingPage = () => {
  const [currentBookingIndex, setCurrentBookingIndex] = useState(0);

  const bookings = [
    {
      price: 100,
      pickupLocation: { lat: 40.7128, lng: -74.006 },
      destinationLocation: { lat: 34.0522, lng: -118.2437 },
      createdAt: "2023-01-01T00:00:00Z",
      time: "10:00 AM",
    },
    {
      price: 120,
      pickupLocation: { lat: 34.0522, lng: -118.2437 },
      destinationLocation: { lat: 51.5074, lng: -0.1278 },
      createdAt: "2023-02-01T00:00:00Z",
      time: "11:00 AM",
    },
    {
      price: 90,
      pickupLocation: { lat: 48.8566, lng: 2.3522 },
      destinationLocation: { lat: 41.9028, lng: 12.4964 },
      createdAt: "2023-03-01T00:00:00Z",
      time: "2:00 PM",
    },
  ];

  const handleNextBooking = () => {
    setCurrentBookingIndex((prevIndex) => (prevIndex + 1) % bookings.length);
  };

  const handlePreviousBooking = () => {
    setCurrentBookingIndex((prevIndex) => (prevIndex - 1 + bookings.length) % bookings.length);
  };

  const BookingCard = ({ booking }) => (
    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500 text-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold mb-4">Booking Info</h2>
      <div className="space-y-2">
        <p className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" /> <strong>Price:</strong> ${booking.price}
        </p>
        <p className="flex items-center">
          <MapPin className="w-5 h-5 mr-2" /> <strong>Pickup:</strong> {booking.pickupLocation.lat.toFixed(4)},{" "}
          {booking.pickupLocation.lng.toFixed(4)}
        </p>
        <p className="flex items-center">
          <MapPin className="w-5 h-5 mr-2" /> <strong>Destination:</strong>{" "}
          {booking.destinationLocation.lat.toFixed(4)}, {booking.destinationLocation.lng.toFixed(4)}
        </p>
        <p className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" /> <strong>Booking Date:</strong>{" "}
          {new Date(booking.createdAt).toDateString()}
        </p>
        <p className="flex items-center">
          <Clock className="w-5 h-5 mr-2" /> <strong>Time:</strong> {booking.time}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-blue-100 p-6">
      <h1 className="text-4xl font-bold text-teal-800 mb-8">Your Bookings</h1>

      {/* Book Display with CSSTransition */}
      <div className="mb-8 w-full max-w-md h-96 relative book-container">
        <CSSTransition
          key={currentBookingIndex}
          timeout={600}
          classNames="fade"
        >
          <BookingCard booking={bookings[currentBookingIndex]} />
        </CSSTransition>
      </div>

      {/* Navigation Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handlePreviousBooking}
          className="bg-teal-600 text-white px-6 py-3 rounded-full hover:bg-teal-700 transition duration-300 flex items-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Previous
        </button>
        <button
          onClick={handleNextBooking}
          className="bg-blue-600 text-white px-6 py-3 mt-10 rounded-full hover:bg-blue-700 transition duration-300 flex items-center"
        >
          Next <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default BookingPage;
