// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Login endpoint sets the httpOnly cookie automatically
      await axios.post('http://localhost:3000/api/admin/login', { username, password }, { withCredentials: true });
      navigate('/admin');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-black bg-opacity-80 p-10 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-3xl text-white mb-6 text-center font-bold">Admin Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          className="w-full p-3 mb-4 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
          required
        />
        <button type="submit" className="w-full bg-[#cbe557] text-black p-3 rounded font-semibold hover:bg-[#b8d93e] transition duration-200">
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
