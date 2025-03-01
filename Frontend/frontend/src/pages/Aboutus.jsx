"use client";

import { DirectionsCar, Payment, Chat, MonetizationOn, Security, Speed, MailOutline, Phone } from "@mui/icons-material";
import { motion } from "framer-motion";
import React from "react";
import BackgroundSlider from "../Component/BackgroundSlider"; // Import the BackgroundSlider component

// Background images for the slider
const backgroundImages = [
  "./bg1.jpg",
  "./bg2.jpg",
  "./bg3.jpg",
];

const Feature = ({ icon, title, description }) => (
  <motion.div
    className="p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col items-center text-center transition-all hover:scale-105 hover:shadow-3xl border border-white/20"
    whileHover={{ scale: 1.05 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="text-indigo-400 text-6xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold text-white mt-4">{title}</h3>
    <p className="text-gray-300 mt-3 text-lg">{description}</p>
  </motion.div>
);

const AboutUs = () => {
  return (
    <div className="relative text-white min-h-screen py-20 px-8 overflow-hidden">
      {/* Background Slider */}
      <BackgroundSlider images={backgroundImages} interval={5000} />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.h1
          className="text-6xl font-extrabold text-indigo-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          About Auto Drive
        </motion.h1>
        <motion.p
          className="text-xl text-gray-300 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Revolutionizing the ride-sharing experience
        </motion.p>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto mt-12 grid md:grid-cols-2 gap-12">
        <motion.p
          className="text-gray-300 text-lg leading-relaxed bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Auto Drive is not just another ride-sharing platform. We're on a mission to create a fairer, more transparent ecosystem for both drivers and passengers. By leveraging cutting-edge technology and innovative business models, we're reshaping the future of urban transportation.
        </motion.p>
        <motion.p
          className="text-gray-300 text-lg leading-relaxed bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Our platform is designed to reduce the gap between user payments and driver earnings, ensuring that hardworking drivers receive fair compensation for their services. With Auto Drive, you're not just getting a ride – you're supporting a more equitable transportation system.
        </motion.p>
      </div>

      <motion.h2
        className="relative z-10 text-4xl font-bold text-center text-indigo-400 mt-20"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        What Sets Us Apart
      </motion.h2>
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10 mt-12 max-w-6xl mx-auto">
        <Feature icon={<DirectionsCar />} title="Driver Subscriptions" description="Our unique subscription model empowers drivers with steady income and benefits." />
        <Feature icon={<Payment />} title="Direct Payments" description="Users pay drivers directly, ensuring transparency and fair compensation." />
        <Feature icon={<MonetizationOn />} title="Low Platform Fees" description="We charge minimal fees, maximizing earnings for our drivers." />
        <Feature icon={<Chat />} title="In-Ride Chat" description="Our built-in chat feature enhances communication between drivers and passengers." />
        <Feature icon={<Security />} title="Enhanced Safety" description="Advanced safety features protect both drivers and passengers." />
        <Feature icon={<Speed />} title="Efficient Matching" description="Our smart algorithm ensures quick and efficient ride matching." />
      </div>

      <motion.div
        className="relative z-10 bg-white/10 backdrop-blur-md p-12 rounded-3xl shadow-xl text-center mt-20 max-w-5xl mx-auto border border-white/20"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold text-white">Join the Auto Drive Revolution</h2>
        <p className="text-gray-300 mt-6 text-lg">
          Whether you're a passenger looking for fair and transparent rides, or a driver seeking better opportunities, Auto Drive is here for you. Join us in creating a more equitable transportation ecosystem.
        </p>
        <div className="mt-8 flex justify-center gap-6">
          <motion.button
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-medium transition-all hover:scale-105"
            whileHover={{ scale: 1.05 }}
          >
            Download App
          </motion.button>
          <motion.button
            className="border-2 border-indigo-500 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-xl font-medium transition-all hover:scale-105"
            whileHover={{ scale: 1.05 }}
          >
            Become a Driver
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 text-center mt-16 bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h3 className="text-2xl font-semibold text-white">Contact Us</h3>
        <p className="text-gray-400 flex items-center justify-center gap-2 mt-4">
          <MailOutline className="text-indigo-400" /> support@autodrive.com
        </p>
        <p className="text-gray-400 flex items-center justify-center gap-2 mt-2">
          <Phone className="text-indigo-400" /> (555) 123-4567
        </p>
      </motion.div>
    </div>
  );
};

export default AboutUs;