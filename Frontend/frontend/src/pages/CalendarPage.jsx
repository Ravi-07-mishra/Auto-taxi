import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Css/CalendarStyles.css";
import { MapPin, DollarSign, Clock } from "lucide-react";

const CalendarPage = () => {
  const auth = useAuth();
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchCompletedBookings = async () => {
      try {
        const response = await fetch(`/api/user/completedBookings/${auth.user._id}`);
        const data = await response.json();
        setCompletedBookings(data);
      } catch (error) {
        console.error("Error fetching completed bookings:", error);
      }
    };

    if (auth.user) {
      fetchCompletedBookings();
    }
  }, [auth.user]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const bookingForSelectedDate = completedBookings.find(
    (b) => new Date(b.createdAt).toDateString() === selectedDate?.toDateString()
  );

  return (
    <div ref={calendarRef} className="flex flex-col lg:flex-row bg-gradient-to-br from-teal-400 to-indigo-500 rounded-xl shadow-2xl overflow-hidden">
      {/* Left Half: Booking Details */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col justify-center bg-opacity-10 bg-white backdrop-filter backdrop-blur-lg">
        <div className="w-full max-w-md mx-auto">
          {!selectedDate ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">Select a Date</h2>
              <p className="text-teal-100">Choose a date to view your booking details.</p>
            </div>
          ) : (
            <div>
              {bookingForSelectedDate ? (
                <div className="p-6 bg-white bg-opacity-20 rounded-2xl shadow-lg text-white backdrop-filter backdrop-blur-md">
                  <h3 className="text-2xl font-semibold mb-6 text-teal-100">Booking Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <DollarSign className="w-6 h-6 mr-3 text-teal-200" />
                      <p><span className="font-medium">Price:</span> ${bookingForSelectedDate.price}</p>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-6 h-6 mr-3 mt-1 text-teal-200" />
                      <div>
                        <p className="font-medium">Pickup:</p>
                        <p className="text-sm">
                          {bookingForSelectedDate.pickupLocation.lat}, {bookingForSelectedDate.pickupLocation.lng}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-6 h-6 mr-3 mt-1 text-teal-200" />
                      <div>
                        <p className="font-medium">Destination:</p>
                        <p className="text-sm">
                          {bookingForSelectedDate.destinationLocation.lat},{" "}
                          {bookingForSelectedDate.destinationLocation.lng}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-teal-200" />
                      <p>
                        <span className="font-medium">Date:</span> {selectedDate.toDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-white bg-opacity-10 rounded-2xl backdrop-filter backdrop-blur-md">
                  <p className="text-xl text-white">No bookings on this date.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Half: Calendar */}
      <div className="w-full lg:w-1/2 p-6 bg-opacity-10 bg-white backdrop-filter backdrop-blur-lg">
        <div className="shadow-xl rounded-2xl bg-white bg-opacity-20 p-4 w-full max-w-sm mx-auto backdrop-filter backdrop-blur-md">
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={({ date, view }) =>
              view === "month" && completedBookings.some((b) => new Date(b.createdAt).toDateString() === date.toDateString())
                ? "bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors duration-200"
                : "text-indigo-100 hover:bg-indigo-400 hover:bg-opacity-50 rounded-full transition-colors duration-200"
            }
            className="rounded-xl shadow-inner bg-transparent text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
