import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { Avatar, TextField, Button, Typography, Box } from '@mui/material'; 
import { Check, DoneAll } from '@mui/icons-material'; 
import { useDriverAuth } from '../Context/driverContext';

const DriverInbox = () => {
    const { bookingId } = useParams();
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState('');
    const [seenMessages, setSeenMessages] = useState({});
    const [loading, setLoading] = useState(true); // Added loading state
    const socketRef = useRef(null);
    const { driver } = useDriverAuth();

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/chat/${bookingId}`);
                const json = await response.json();
                setChat(json);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setLoading(false); // Set loading to false once fetching is done
            }
        };

        fetchChatHistory();
    }, [bookingId]);

    useEffect(() => {
        socketRef.current = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;
        socket.on('connect', () => {
            socket.emit('joinRoom', bookingId);
        });

        socket.on('newMessage', (message) => {
            setChat((prev) => [...prev, message]);
        });

        socket.on('messageSeen', ({ messageId, userId, seenBy }) => {
            setSeenMessages((prev) => ({
                ...prev,
                [messageId]: userId,
            }));
            setChat((prevChat) => 
                prevChat.map((msg) => 
                    msg._id === messageId ? { ...msg, seenBy } : msg
                )
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [bookingId]);

    const sendMessage = (message) => {
        if (!message.trim()) return;

        if (driver?._id) {
            const newMessage = {
                bookingId,
                senderId: driver._id,
                message,
                senderModel: 'Driver',
            };
            socketRef.current.emit('sendMessage', newMessage);
            setChat((prev) => [...prev, newMessage]);
            setMessage('');
        }
    };

    const handleSeen = (messageId) => {
        socketRef.current.emit('markMessageAsSeen', {
            bookingId,
            messageId,
            userId: driver._id,
        });
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '600px', margin: 'auto', paddingTop: 20, marginTop: 4 }}>
            <Box sx={{ backgroundColor: 'background.paper', padding: 3, borderRadius: 2, boxShadow: 2, maxHeight: '60vh', overflowY: 'auto' }}>
                {loading ? (
                    <Typography variant="h6" sx={{ textAlign: 'center' }}>Loading chat...</Typography> // Show loading text or spinner
                ) : chat.length === 0 ? (
                    <Typography variant="h6" sx={{ textAlign: 'center' }}>No messages yet</Typography> // Show message if no chat
                ) : (
                    chat.map((chatMessage) => (
                        <Box
                            key={chatMessage._id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                paddingBottom: 2,
                                marginBottom: 2,
                                borderBottom: '1px solid #e0e0e0',
                                ':last-child': { borderBottom: 'none' },
                            }}
                            onMouseEnter={() => handleSeen(chatMessage._id)}
                        >
                            <Avatar sx={{ marginRight: 2, backgroundColor: chatMessage.senderModel === 'Driver' ? 'blue' : 'green' }}>
                                {chatMessage.senderModel === 'Driver' ? 'D' : 'C'}
                            </Avatar>

                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1" sx={{ color: 'text.primary' }}>
                                    <strong>{chatMessage.senderModel}:</strong> {chatMessage.message}
                                </Typography>
                            </Box>

                            <Box>
                                {chatMessage.seenBy?.includes(driver?._id) ? (
                                    <DoneAll sx={{ color: 'blue' }} />
                                ) : (
                                    <Check sx={{ color: 'gray' }} />
                                )}
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                <TextField
                    label="Type your message..."
                    fullWidth
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage(e.target.value);
                        }
                    }}
                    variant="outlined"
                    sx={{
                        marginRight: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 4,
                            padding: '6px 12px',
                            backgroundColor: '#f5f5f5',
                        },
                    }}
                />
                <Button variant="contained" color="primary" onClick={() => sendMessage(message)} sx={{ height: '100%', padding: '10px 16px', borderRadius: 4, textTransform: 'none' }}>
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default DriverInbox;
