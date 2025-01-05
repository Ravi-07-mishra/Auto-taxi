import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../hooks/UseAuthContext';

const LoginPage = () => {
    const { dispatch } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:3000/api/user/userlogin', { email, password });

            if (response.status === 200) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                dispatch({ type: 'LOGIN', payload: response.data.user });
                navigate('/userhome');
            } else {
                setError(response.data.msg || 'Unexpected error occurred.');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="fw-bold">Login</h2>
            {error && <p className="text-danger">{error}</p>}
            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label className="form-label">Email:</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password:</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
