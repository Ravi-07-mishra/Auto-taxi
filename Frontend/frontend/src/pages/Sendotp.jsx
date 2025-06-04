import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

/**
 * Sendotp
 *
 * - Collects user email and sends OTP via API.
 * - On success, navigates to usersignup with email in state.
 */
const Sendotp = () => {
  const API_BASE = import.meta.env.VITE_API_URL;
  if (!API_BASE) console.error("VITE_API_URL is not defined.");

  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
      toast.success("OTP sent successfully!", { id: "send-otp" });
      if (isMounted.current) navigate("/usersignup", { state: { email } });
    } catch (err) {
      if (!isMounted.current) return;
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 md:p-6 relative overflow-x-hidden" style={{ backgroundImage: "url('/bg1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-4 md:py-6 z-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold lowercase tracking-wider flex space-x-1 sm:space-x-2">
          {Array.from("auto-drive").map((letter, i) => (
            <span key={i} style={{ color: i % 2 === 0 ? "#cbe557" : "white" }}>{letter}</span>
          ))}
        </h1>
        <button onClick={() => navigate("/userlogin")} className="bg-[#cbe557] text-gray-900 font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-[#b8d93e] transition">
          Sign In
        </button>
      </div>
      <div className="w-full max-w-xs sm:max-w-md bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-700/30 relative z-10 transition hover:scale-[1.02] hover:shadow-3xl hover:bg-gray-800/60">
        <h1 className="text-2xl sm:text-4xl font-bold text-center text-white mb-4 animate-fade-in-down">
          Welcome to <span className="text-[#cbe557]">AutoDrive</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-300 text-center mb-6 animate-fade-in-up">
          Start saving money on every drive. Enter your email to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email Address"
              className="w-full p-3 pl-10 rounded-lg bg-gray-700/50 border border-gray-600/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cbe557] transition"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 16" fill="currentColor">
              <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
              <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
            </svg>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#cbe557] text-gray-900 font-bold rounded-full shadow-lg transition hover:bg-[#b8d93e] hover:scale-105 hover:shadow-xl">
            {loading ? "Sending..." : "Send OTP"}
          </button>
          {error && <p className="text-red-500 text-center font-medium mt-2 text-sm animate-fade-in">{error}</p>}
        </form>
      </div>
      <div className="absolute bottom-0 left-0 w-full text-center text-xs sm:text-sm text-gray-400 py-3 sm:py-4 z-20">
        <p>© 2023 AutoDrive. All rights reserved.</p>
      </div>
    </div>
  );
};
export default Sendotp;