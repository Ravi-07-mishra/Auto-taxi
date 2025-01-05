import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sendotp from "./pages/Sendotp";
import Signup from "./pages/Signup";
import DriverRegistrationForm from "./pages/Register";
import AdminDashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import DriverLogin from "./pages/Driverlogin";
import LoginPage from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import BookDrive from "./pages/Book-drive";
import UserHome from "./pages/userHome";
import './index.css';  // Your custom CSS
import DriverInbox from "./pages/DriverInbox";
import UserInbox from "./pages/UserInbox";
import { Payment } from "./Component/PaymentGateway";
import { SocketProvider } from "./context/SocketContext";

 // Bootstrap CSS


function App() {
  return (
    <SocketProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Sendotp />} />
        <Route path="/userhome" element={<UserHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<DriverRegistrationForm />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/userdashboard" element={<UserDashboard />} />
        <Route path="/driverlogin" element={<DriverLogin />} />
        <Route path="/driverdashboard" element={<DriverDashboard />} />
        <Route path="/bookdrive" element={<BookDrive />} />
        <Route path="/inbox/:bookingId" element={<DriverInbox/>} />
        <Route path="/user/inbox/:bookingId" element={<UserInbox/>} />
        <Route path="/payment/:bookingId"  element = {<Payment/>}/>
      </Routes>
    </Router>
    </SocketProvider>
  );
}

export default App;
