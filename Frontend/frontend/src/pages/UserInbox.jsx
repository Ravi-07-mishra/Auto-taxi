import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Context/userContext';
import { Avatar, TextField, Button, Typography, Box, Paper, Container } from '@mui/material';
import { Check, DoneAll } from '@mui/icons-material';
import '../Css/Inbox.css';

const UserInbox = () => {
    const { bookingId } = useParams();
    const { user } = useAuth();
    const [chat, setChat] = useState([]);
    const [message, setMessage] = useState('');
    const [seenMessages, setSeenMessages] = useState({});
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/chat/${bookingId}`);
                const json = await response.json();
                setChat(json);
            } catch (error) {
                console.error('Error fetching chat history:', error);
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

        if (user && user._id) {
            const newMessage = {
                bookingId,
                senderId: user._id,
                message,
                senderModel: 'User',
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
            userId: user._id,
        });
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Inbox of Booking {bookingId}
                </Typography>
                <Box
                    sx={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        mb: 3,
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {chat.map((chatMessage) => (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                p: 2,
                                borderRadius: 1,
                                bgcolor: chatMessage.senderModel.toLowerCase() === 'user' ? 'primary.light' : 'secondary.light',
                            }}
                            key={chatMessage._id}
                            onMouseEnter={() => handleSeen(chatMessage._id)}
                        >
                            <Avatar sx={{ mr: 2 }}>
                                {chatMessage.senderModel === 'User' ? 'U' : 'D'}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1">
                                    <strong>{chatMessage.senderModel}:</strong> {chatMessage.message}
                                </Typography>
                            </Box>
                            <Box sx={{ ml: 2 }}>
                                {chatMessage.seenBy?.includes(user?._id) ? (
                                    <DoneAll sx={{ color: 'blue' }} />
                                ) : (
                                    <Check sx={{ color: 'gray' }} />
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        variant="outlined"
                        fullWidth
                        label="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage(e.target.value);
                            }
                        }}
                    />
                    <Button variant="contained" color="primary" onClick={() => sendMessage(message)}>
                        Send
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default UserInbox;
