import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import React Router's navigate

const Sendotp = () => {
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const navigate = useNavigate(); // Initialize navigate

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Email:', email);  // Log the email to verify it's being set correctly
        setError(null); // Clear any previous errors
    
        try {
            const response = await fetch('http://localhost:3000/api/user/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await response.json();
            if (!response.ok) {
                setError(json.message || 'Failed to send OTP. Please try again.');
            } else {
                alert('OTP sent successfully!');
                navigate('/signup'); // Redirect to OTP page
            }
        } catch (error) {
            setError('Something went wrong. Please try again.');
            console.error('Error details:', error); // Log the error details
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <h3>Send OTP</h3>
            <label htmlFor="email">Email</label>
            <input
                type="email"
                value={email}
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit">Send OTP</button>
            {error && <p>{error}</p>}
        </form>
    );
};

export default Sendotp;
