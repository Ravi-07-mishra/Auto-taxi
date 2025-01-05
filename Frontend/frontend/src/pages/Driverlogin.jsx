import React, { useState } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { useDriverAuthContext } from '../hooks/usedriverauthContext';

const DriverLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [msg, setMsg] = useState('');
    const socket = useSocket();  // Access the socket instance
    const { dispatch } = useDriverAuthContext();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/api/driver/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to login');
            }

            const data = await response.json();
            setMsg('Login successful!');

            localStorage.setItem('driver', JSON.stringify(data));
            dispatch({ type: 'LOGIN', payload: data });

            // Send driver location once logged in
            sendDriverLocation(data.user.id);

            // Navigate after a delay (if necessary)
            setTimeout(() => navigate('/driverdashboard'), 500);
        } catch (error) {
            setMsg(error.message);
        }
    };

    const sendDriverLocation = (driverId) => {
        const sendLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const location = {
                            id: driverId,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };

                        if (socket?.connected) {
                            socket.emit('driverLocation', location);
                        } else {
                            console.error('Socket is not connected yet.');
                        }
                    },
                    (error) => console.error('Geolocation error:', error.message)
                );
            } else {
                console.error('Geolocation is not supported by this browser.');
            }
        };

        sendLocation();
        setInterval(() => sendLocation(), 10000); // Send location every 10 seconds
    };

    return (
        <div>
            <h2>Driver Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {msg && <p>{msg}</p>}
        </div>
    );
};

export default DriverLogin;
