"use client";

import { 
  DirectionsCar, 
  Payment, 
  Chat, 
  MonetizationOn, 
  Security, 
  Speed, 
  MailOutline, 
  Phone 
} from "@mui/icons-material";
import { motion } from "framer-motion";
import React from "react";
import BackgroundSlider from "../Component/BackgroundSlider";

// Background images for the slider
const backgroundImages = [
  "./bg1.jpg",
  "./bg2.jpg",
  "./bg3.jpg",
];

const Feature = ({ icon, title, description }) => (
  <motion.div
    className="p-6 sm:p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-lg flex flex-col items-center text-center transition-transform transform hover:scale-105 border border-white/30"
    whileHover={{ scale: 1.05 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="text-indigo-400 text-5xl sm:text-6xl mb-4">{icon}</div>
    <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">{title}</h3>
    <p className="text-sm sm:text-lg text-gray-200 mt-3">{description}</p>
  </motion.div>
);

const AboutUs = () => {
  return (
    <div className="relative text-white min-h-screen py-16 px-4 sm:px-8 md:px-16 overflow-hidden">
      {/* Background Slider + overlay */}
      <BackgroundSlider images={backgroundImages} interval={5000} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center px-2 sm:px-4">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-400 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            About Auto Drive
          </motion.h1>
          <motion.p
            className="mt-4 text-base sm:text-lg md:text-xl text-gray-300 drop-shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Revolutionizing the ride-sharing experience
          </motion.p>
        </div>

        {/* Mission Statements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2 sm:px-4">
          <motion.p
            className="text-gray-300 text-sm sm:text-base leading-relaxed bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-white/20"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Auto Drive is not just another ride-sharing platform. We're on a mission to create a fairer, more transparent ecosystem for both drivers and passengers. By leveraging cutting-edge technology and innovative business models, we're reshaping the future of urban transportation.
          </motion.p>
          <motion.p
            className="text-gray-300 text-sm sm:text-base leading-relaxed bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our platform is designed to reduce the gap between user payments and driver earnings, ensuring that hardworking drivers receive fair compensation for their services. With Auto Drive, you're not just getting a ride – you're supporting a more equitable transportation system.
          </motion.p>
        </div>

        {/* Features */}
        <div className="text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-400 mb-8"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            What Sets Us Apart
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-4">
            <Feature 
              icon={<DirectionsCar />} 
              title="Driver Subscriptions" 
              description="Our unique subscription model empowers drivers with steady income and benefits." 
            />
            <Feature 
              icon={<Payment />} 
              title="Direct Payments" 
              description="Users pay drivers directly, ensuring transparency and fair compensation." 
            />
            <Feature 
              icon={<MonetizationOn />} 
              title="Low Platform Fees" 
              description="We charge minimal fees, maximizing earnings for our drivers." 
            />
            <Feature 
              icon={<Chat />} 
              title="In-Ride Chat" 
              description="Our built-in chat feature enhances communication between drivers and passengers." 
            />
            <Feature 
              icon={<Security />} 
              title="Enhanced Safety" 
              description="Advanced safety features protect both drivers and passengers." 
            />
            <Feature 
              icon={<Speed />} 
              title="Efficient Matching" 
              description="Our smart algorithm ensures quick and efficient ride matching." 
            />
          </div>
        </div>

        {/* Call-to-Action */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg p-8 sm:p-12 rounded-3xl shadow-xl text-center border border-white/20 px-4 sm:px-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Join the Auto Drive Revolution
          </h2>
          <p className="text-gray-300 mt-4 sm:mt-6 text-sm sm:text-base md:text-lg">
            Whether you're a passenger looking for fair and transparent rides, or a driver seeking better opportunities, Auto Drive is here for you. Join us in creating a more equitable transportation ecosystem.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <motion.button
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-medium transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Download App
            </motion.button>
            <motion.button
              className="border-2 border-indigo-500 hover:bg-indigo-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-medium transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Become a Driver
            </motion.button>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="text-center bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-white/20 max-w-2xl mx-auto px-4 sm:px-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
            Contact Us
          </h3>
          <p className="text-gray-400 flex items-center justify-center gap-2 mt-3 text-sm sm:text-base">
            <MailOutline className="text-indigo-400" /> support@autodrive.com
          </p>
          <p className="text-gray-400 flex items-center justify-center gap-2 mt-2 text-sm sm:text-base">
            <Phone className="text-indigo-400" /> (555) 123-4567
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
