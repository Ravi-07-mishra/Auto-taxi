import { Button, Typography, Box } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSendSharp } from "react-icons/io5";
import toast from 'react-hot-toast';

const Sendotp = () => {
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

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
                toast.success("Otp sent Successfully", {id: "send-otp"})
                navigate('/signup');
            }
        } catch (error) {
            setError('Something went wrong. Please try again.');
            console.error(error);
        }
    };

    return (
        <Box
            className="main-container"
            sx={{
                width: '400px',
                margin: 'auto',
                marginTop: '2rem',
                padding: '2rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // More transparent background
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)', // Frosted glass effect
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'white',
                transition: 'all 0.3s ease', // Smooth transition
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slightly darker on hover
                    transform: 'scale(1.02)', // Subtle zoom on hover
                },
            }}
        >
            <form onSubmit={handleSubmit}>
                <Typography variant='h4' textAlign={"center"} padding={2} fontWeight={600}>
                    Send OTP
                </Typography>
                <Typography htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email
                </Typography>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg
                            className="w-5 h-5 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 16"
                        >
                            <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                            <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                        </svg>
                    </div>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Enter your email"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outlined"
                    sx={{
                        px: 2,
                        py: 1,
                        mt: 2,
                        width: "250px",
                        borderRadius: 2,
                        bgcolor: "#f3f3f3",
                        ":hover": {
                            bgcolor: "white",
                            color: "black",
                        },
                    }}
                    endIcon={<IoSendSharp />}
                >
                    Send OTP
                </Button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
        </Box>
    );
};

export default Sendotp;
