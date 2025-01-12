import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/userContext';

const Signup = () => {
    const { signup } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState(location.state?.email || '');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await signup(name, email, password, otp);
            alert('Signup successful!');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
                        <div className="bg-white bg-opacity-70 p-8 rounded-lg shadow-lg w-full max-w-md">

            <form
                className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
                onSubmit={handleSubmit}
            >
                <h3 className="text-2xl font-bold mb-6 text-gray-700 text-center">
                    Sign Up
                </h3>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    value={name}
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    OTP
                </label>
                <input
                    type="text"
                    value={otp}
                    id="otp"
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full p-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full p-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                >
                    {isLoading ? 'Signing up...' : 'Signup'}
                </button>
                {error && (
                    <p className="text-red-500 text-sm mt-4">
                        {error}
                    </p>
                )}
            </form>
            </div>
        </div>
    );
};

export default Signup;
