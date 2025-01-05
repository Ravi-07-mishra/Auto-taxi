import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useDriverAuthContext } from '../hooks/usedriverauthContext';
import '../Css/Inbox.css';  // Import the CSS file

const DriverInbox = () => {
    const { bookingId } = useParams();
    const [chat, setChat] = useState([]);
    const socketRef = useRef(null);
    const { driver } = useDriverAuthContext();

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/chat/${bookingId}`);
                const json = await response.json(); // Await the JSON response
                console.log('Chat history:', json); // Log the chat history
                setChat(json);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        fetchChatHistory();
    }, [bookingId]);

    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        const socket = socketRef.current;
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('joinRoom', bookingId);  // Join the room using bookingId
        });

        socket.on('newMessage', (message) => {
            console.log('New message received:', message);
            setChat((prev) => [...prev, message]);
        });

        return () => {
            socket.disconnect();
        };
    }, [bookingId]);

    const sendMessage = (message) => {
        if (driver && driver.user && driver.user.id) {
            socketRef.current.emit('sendMessage', {
                bookingId,
                senderId: driver.user.id, // Ensure correct usage
                message,
                senderModel: 'Driver',
            });
        } else {
            console.error("Driver or driver user ID is undefined.");
        }
    };

    return (
        <div className="inbox-container">
            <h2>Inbox of Booking {bookingId}</h2>
            <div className="chat-box">
                {chat.map((chat) => (
                    <div className={`chat-message ${chat.senderModel.toLowerCase()}`} key={chat._id}>
                        <p>
                            <strong>{chat.senderModel}:</strong> {chat.message}
                        </p>
                    </div>
                ))}
            </div>
            <input
                type="text"
                className="chat-input"
                placeholder="Type your message"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        sendMessage(e.target.value);
                        e.target.value = '';  // Clear the input after sending
                    }
                }}
            />
        </div>
    );
};

export default DriverInbox;
