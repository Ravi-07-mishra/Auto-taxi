import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Use backend URL from env variable
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use API_BASE instead of hardcoded URL
      await axios.post(
        `${API_BASE}/admin/login`,
        { username, password },
        { withCredentials: true }
      );
      navigate('/admin');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-gray-900 to-black">
      <form
        onSubmit={handleSubmit}
        className="bg-black bg-opacity-70 p-8 md:p-12 rounded-lg shadow-xl max-w-md w-full"
      >
        <h2 className="text-4xl text-white mb-6 text-center font-extrabold tracking-wide">
          Admin Login
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 rounded-md border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#cbe557] focus:ring-opacity-50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-md border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#cbe557] focus:ring-opacity-50"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#cbe557] text-black p-4 rounded-md font-semibold hover:bg-[#b8d93e] transition duration-200 mt-6"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
