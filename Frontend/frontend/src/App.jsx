import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sendotp from "./pages/Sendotp";
import Signup from "./pages/Signup";
import DriverRegistrationForm from "./pages/Register";
import "@fortawesome/fontawesome-free/css/all.min.css";


import DriverLogin from "./pages/Driverlogin";
import LoginPage from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import BookDrive from "./pages/Book-drive";
import UserHome from "./pages/userHome";
import "./index.css"; // Your custom CSS


import { SocketProvider } from "./Context/SocketContext";

import HomePage from "./pages/Home";
import Payment from "./Component/PaymentGateway";

// Import your navbars
import Navbar2 from "./Component/Navbar2";
import DriverNavbar from "./Component/DriverNavbar";
import ProfilePage from "./pages/DriverProfile";
import RatingPage from "./Component/Ratingsystem";



import DrivePage from "./pages/DrivePage";
import Home from "./pages/Home";

import BookingPage from "./Component/BookingPage";
import EditProfilePage from "./Component/EditProfile";
import AboutUs from "./pages/Aboutus";
import UserRidePage from "./pages/UserDrive";
import UserProfilePage from "./pages/UserProfile";
import EditUserProfilePage from "./Component/EditUserprofile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const Navbar = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/user")) {
    return <Navbar2 />;
  } else if (
    location.pathname.startsWith("/driver") ||
    location.pathname.startsWith("/Driver")
  ) {
    return <DriverNavbar />;
  }
  return null; // No navbar for other routes
};

const App = () => {
  // Custom hook to determine the navbar based on the route

  return (
    <SocketProvider>
   
        {/* Conditionally render the appropriate navbar */}
        <Navbar />
        <Routes>
          <Route path="/send-otp" element={<Sendotp />} />
          <Route path="/userhome" element={<UserHome />} />
          <Route path="/userlogin" element={<LoginPage />} />
          <Route path="/usersignup" element={<Signup />} />
          <Route path="/driverregister" element={<DriverRegistrationForm />} />
          <Route path="/Aboutus" element={<AboutUs />} />
          <Route path="/ratings" element={<RatingPage />} />
        
          <Route path="/driverlogin" element={<DriverLogin />} />
          <Route path="/driverdashboard" element={<DriverDashboard />} />
          <Route path="/userbookdrive" element={<BookDrive />} />
         
          <Route path="/driver/drive/:bookingId" element={<DrivePage />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
     
          <Route path="/" element={<Home />} />
          <Route path="/user/:bookingId" element={<UserRidePage />} />
          <Route path="/driverprofile" element={<ProfilePage />} />
       
<Route path="/userprofile" element={<UserProfilePage/>}/>
         
          <Route path="/BookingPage" element={<BookingPage />} />
        
          <Route path="/driveredit-profile" element={<EditProfilePage />} />
          <Route path="/useredit-profile" element={<EditUserProfilePage/>} />
          <Route path="/admin/login" element={<AdminLogin/>} />
        <Route path="/admin" element={<AdminDashboard/>} />

        </Routes>
 
    </SocketProvider>
  );
};

export default App;
