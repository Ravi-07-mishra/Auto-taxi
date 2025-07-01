import {
  DirectionsCar,
  Payment,
  Chat,
  MonetizationOn,
  Security,
  Speed,
  MailOutline,
  Phone,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import React from "react";
import { useNavigate } from "react-router-dom";
import BackgroundSlider from "../Component/BackgroundSlider";

const backgroundImages = ["./bg1.jpg", "./bg2.jpg", "./bg3.jpg"];

const Feature = ({ icon, title, description }) => (
  <motion.div
    className="p-6 sm:p-8 bg-white/20 backdrop-blur-lg rounded-3xl shadow-lg flex flex-col items-center text-center transition-transform hover:scale-105 border border-white/30"
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
  const navigate = useNavigate();

  return (
    <div className="relative text-white min-h-screen py-16 px-4 sm:px-8 md:px-16 overflow-hidden">
      <BackgroundSlider images={backgroundImages} interval={5000} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <header className="text-center px-2 sm:px-4">
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
            Redefining your ride-sharing experience.
          </motion.p>
        </header>

        {/* Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2 sm:px-4">
          <motion.p
            className="text-gray-300 text-sm sm:text-base leading-relaxed bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-white/20"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Auto Drive is more than just another ride-sharing platform. We're building a fair, transparent, and driver-first ecosystem using modern tech and innovative business models to transform urban commuting.
          </motion.p>
          <motion.p
            className="text-gray-300 text-sm sm:text-base leading-relaxed bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our goal is to bridge the gap between rider payments and driver earnings. At Auto Drive, every ride supports a more equitable and driver-empowered transportation system.
          </motion.p>
        </section>

        {/* Features */}
        <section className="text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-400 mb-8"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            What Makes Us Different
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-2 sm:px-4">
            <Feature icon={<DirectionsCar />} title="Driver Subscriptions" description="Our unique subscription model gives drivers income stability and benefits." />
            <Feature icon={<Payment />} title="Direct Payments" description="Passengers pay drivers directly, ensuring fair and transparent transactions." />
            <Feature icon={<MonetizationOn />} title="Low Platform Fees" description="We keep platform fees minimal to maximize driver earnings." />
            <Feature icon={<Chat />} title="In-Ride Chat" description="Built-in chat makes driver-passenger coordination smooth and safe." />
            <Feature icon={<Security />} title="Enhanced Safety" description="Safety-first policies and tech protect all stakeholders." />
            <Feature icon={<Speed />} title="Efficient Matching" description="Smart matching ensures quick and accurate ride connections." />
          </div>
        </section>

        {/* CTA */}
        <motion.section
          className="bg-white/10 backdrop-blur-lg p-8 sm:p-12 rounded-3xl shadow-xl text-center border border-white/20 px-4 sm:px-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Join the Auto Drive Movement
          </h2>
          <p className="text-gray-300 mt-4 sm:mt-6 text-sm sm:text-base md:text-lg">
            Whether you're a passenger or driver, you're part of a revolution to make transportation fair, safe, and transparent.
          </p>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <motion.button
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all flex items-center"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/driverregister")}
            >
              <DirectionsCar className="mr-2" />
              Become a Driver
            </motion.button>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.footer
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
        </motion.footer>
      </div>
    </div>
  );
};

export default AboutUs;