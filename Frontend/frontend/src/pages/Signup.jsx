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
            // navigate('/userHome');
            alert('Signup successful!');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="signup" onSubmit={handleSubmit}>
            <h3>Sign Up</h3>
            <label htmlFor="name">Name</label>
            <input
                type="text"
                value={name}
                id="name"
                onChange={(e) => setName(e.target.value)}
                required
            />
            <label htmlFor="email">Email</label>
            <input
                type="email"
                value={email}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label htmlFor="password">Password</label>
            <input
                type="password"
                value={password}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <label htmlFor="otp">OTP</label>
            <input
                type="text"
                value={otp}
                id="otp"
                onChange={(e) => setOtp(e.target.value)}
                required
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Signing up...' : 'Signup'}
            </button>
            {error && <p>{error}</p>}
        </form>
    );
};

export default Signup;
