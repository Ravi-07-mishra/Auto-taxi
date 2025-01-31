import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Sendotp = () => {
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message || "Failed to send OTP. Please try again.");
      } else {
        toast.success("OTP sent successfully!", { id: "send-otp" });
        navigate("/usersignup");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error(error);
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: 'url("homepage.jpg")' }}
    >
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-8 py-4">
        {/* Logo */}
        <img src="/logo.png" alt="Company Logo" className="h-12" />

        {/* Sign-in Button */}
        <button
          onClick={() => navigate("/userlogin")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-6 py-2 rounded-lg shadow-lg"
        >
          Sign In
        </button>
      </div>

      {/* Main Content */}
      <div
        className="flex flex-col justify-center items-center h-full text-center px-4"
        style={{ fontFamily: "Work Sans, sans-serif" }}
      >
        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-bold mb-4" style={{ fontWeight: "bold" }}>
          Start Saving Money by Registering for <span className="text-green-400">AutoDrive</span>
        </h1>

        {/* Additional Text Below Heading */}
        <p className="text-lg text-gray-200 mb-8">
          Start with a negligible platform fee and save more on every drive.
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md p-6 rounded-lg shadow-xl backdrop-blur-lg">
          <div className="relative mb-6">
            {/* Email Input */}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email Address"
              className="w-full p-3 pl-10 rounded-lg border border-gray-700 bg-transparent text-white focus:outline-none focus:border-blue-500 placeholder-gray-400"
            />
            
            {/* Email Icon */}
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 16"
              fill="currentColor"
            >
              <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
              <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
            </svg>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg rounded-lg transition-all duration-300"
          >
            Send OTP
          </button>
          {error && (
            <p className="text-red-500 font-medium mt-4">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Sendotp;
