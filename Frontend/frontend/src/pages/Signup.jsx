import React, { useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation for accessing state
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/UseAuthContext';
const Signup = () => {
    const {dispatch} = useAuthContext();
    const location = useLocation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState(location.state?.email || ''); // Pre-fill email
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
const navigate = useNavigate();
const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        const response = await fetch('/api/user/usersignup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, otp }),
        });

        const json = await response.json();
        if (!response.ok) {
            setError(json.error);
        } else {
            // Save the user data correctly
            localStorage.setItem('user', JSON.stringify(json));
            dispatch({ type: 'LOGIN', payload: json.user });

            navigate('/userdashboard');
            alert('Signup successful!');
        }
    } catch (error) {
        setError('Something went wrong. Please try again.');
        console.error(error);
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
