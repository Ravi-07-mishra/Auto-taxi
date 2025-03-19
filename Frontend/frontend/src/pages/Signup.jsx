// Signup.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/userContext";
import GoogleSignInButton from "../Component/Googlesigninbutton"; // Import the Google button

const Signup = () => {
  const { signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signup(name, email, password, otp);
      alert("Signup successful!");
      navigate("/userhome"); // Redirect to user home after successful signup
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen relative"
      style={{
        backgroundImage: "url('/bg1.jpg')", // Replace with your image path
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Signup Form Container */}
      <div
        className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 relative z-10 border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      >
        {/* Logo */}
        <h1 className="text-2xl md:text-3xl font-extrabold lowercase tracking-wider shadow-md flex justify-center items-center gap-2 mb-6">
          {["a", "u", "t", "o", "-", "d", "r", "i", "v", "e"].map((letter, index) => (
            <span key={index} style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}>
              {letter}
            </span>
          ))}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-center text-white">Sign Up</h2>

          {error && (
            <div className="bg-red-100 text-red-700 border border-red-400 rounded p-3 text-sm">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cbe557] text-white placeholder-gray-300 transition-all duration-300 hover:border-[#cbe557]"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cbe557] text-white placeholder-gray-300 transition-all duration-300 hover:border-[#cbe557]"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cbe557] text-white placeholder-gray-300 transition-all duration-300 hover:border-[#cbe557]"
            />
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="otp">
              OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cbe557] text-white placeholder-gray-300 transition-all duration-300 hover:border-[#cbe557]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-[#cbe557] text-gray-900 rounded-lg hover:bg-[#b8d93e] focus:ring-2 focus:ring-[#cbe557] transition-all duration-300 hover:scale-105"
          >
            {isLoading ? "Signing up..." : "Signup"}
          </button>
        </form>

        {/* Divider */}
        <div className="text-center text-white my-4">OR</div>

        {/* Google Sign In Button */}
        <GoogleSignInButton />
      </div>
    </div>
  );
};

export default Signup;
