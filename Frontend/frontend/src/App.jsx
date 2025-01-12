import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Sendotp from "./pages/Sendotp";
import Signup from "./pages/Signup";
import DriverRegistrationForm from "./pages/Register";

import UserDashboard from "./pages/UserDashboard";
import DriverLogin from "./pages/Driverlogin";
import LoginPage from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import BookDrive from "./pages/Book-drive";
import UserHome from "./pages/userHome";
import './index.css'; // Your custom CSS
import DriverInbox from "./pages/DriverInbox";
import UserInbox from "./pages/UserInbox";

import { SocketProvider } from "./Context/SocketContext";

import HomePage from "./pages/Home";
import Payment from "./Component/PaymentGateway";
import DriverHomePage from "./pages/DriverHomePage";

// Import your navbars
import Navbar2 from "./Component/Navbar2";
import DriverNavbar from "./Component/DriverNavbar";
import ProfilePage from "./pages/DriverProfile";
import RatingPage from "./Component/Ratingsystem";
const Navbar = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/user")) {
    return <Navbar2 />;
  } else if (location.pathname.startsWith("/driver") || location.pathname.startsWith("/Driver") ) {
    return <DriverNavbar />;
  }
  return null; // No navbar for other routes
};

const App = () => {
  // Custom hook to determine the navbar based on the route

  

  return (
    <SocketProvider>
      <Router>
        {/* Conditionally render the appropriate navbar */}
    <Navbar/>
        <Routes>
          <Route path="/" element={<Sendotp />} />
          <Route path="/userhome" element={<UserHome />} />
          <Route path="/userlogin" element={<LoginPage />} />
          <Route path="/usersignup" element={<Signup />} />
          <Route path="/driverregister" element={<DriverRegistrationForm />} />
<Route path="/ratings" element={<RatingPage/>}/>
          <Route path="/userdashboard" element={<UserDashboard />} />
          <Route path="/driverlogin" element={<DriverLogin />} />
          <Route path="/driverdashboard" element={<DriverDashboard />} />
          <Route path="/userbookdrive" element={<BookDrive />} />
          <Route path="/driver/inbox/:bookingId" element={<DriverInbox />} />
          <Route path="/user/inbox/:bookingId" element={<UserInbox />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/userhomepage" element={<HomePage />} />
          <Route path="/driverpage" element={<DriverHomePage />} />
          <Route path="/driverprofile" element={<ProfilePage/>} />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
