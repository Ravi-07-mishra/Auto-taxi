const express = require('express');
const connectDB = require('./connectDB/connectDB');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const cookieParser = require('cookie-parser');
const morgan = require('morgan')
const Chat = require('./Models/Chatmodel');
const ChatRouter = require('./Routes/Chat');
const Booking = require('./Models/Bookingmodel');
require('dotenv').config();
const UserRouter = require('./Routes/User');
const DriverRouter = require('./Routes/Driver');
const Driver = require('./Models/drivermodel');
const User = require('./Models/Usermodel');
const Paymentrouter = require('./Routes/payment');
// Create the HTTP server and pass the express app to it
const server = http.createServer(app);

// Initialize socket.io with CORS settings
const io = socketIo(server, {
    cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'], credentials: true, }, transports: ['websocket'],
    pingTimeout: 60000,  // Adjust as necessary
    pingInterval: 25000,
});
global.io = io; // Assigning io to global object

// Middleware Setup
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',  // The frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // Allow credentials (cookies)
}));

// API routes
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));
app.use('/api/user', UserRouter);
app.use('/api/driver', DriverRouter);
app.use('/api/chat', ChatRouter);
app.use('/api/payment', Paymentrouter);

const port = process.env.PORT || 3000;

let driverLocations = {}; // Store driver locations by ID

// Socket.io event handling
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Emit all driver locations to the client when a new socket connects
    socket.emit('updateLocations', driverLocations);
    socket.emit('testEvent', { message: 'Hello from server!' });

    // Handle driver location updates
    socket.on('driverLocation', async (data) => {
        if (!data || typeof data.id !== 'string' || !data.lat || !data.lng) {
            console.error('Invalid driver location data:', data);
            return;
        }
        console.log('Driver location received:', data);

        try {
            const driver = await Driver.findById(data.id);
            if (!driver) {
                console.log('Driver not found');
                return;
            }

            driver.location.lat = data.lat;
            driver.location.lng = data.lng;
            driver.socketId = socket.id;

            await driver.save();
            driverLocations[data.id] = { lat: data.lat, lng: data.lng };

            io.emit('updateLocations', driverLocations);
            console.log('Updated driver locations:', driverLocations);

        } catch (error) {
            console.error('Error updating driver location:', error);
        }
    });

    // Set user socket ID
    socket.on('setUserSocketId', async (userId) => {
        if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
          console.log('Invalid userId:', userId);
          return;
        }
      
        try {
          const user = await User.findById(userId);
          if (user) {
            user.socketId = socket.id;
            await user.save();
            console.log('User socket ID updated:', userId, socket.id);
          } else {
            console.log('User not found:', userId);
          }
        } catch (error) {
          console.error('Error updating user socketId:', error);
        }
    });

    // Handle booking acceptance
    socket.on('acceptBooking', async (data) => {
        try {
            console.log('Booking accepted')
            const { bookingId, price } = data;
            const booking = await Booking.findById(bookingId);
    
            if (!booking) {
                return socket.emit('bookingError', { msg: 'Booking not found' });
            }
    
            booking.status = 'Accepted';
            booking.price = price;
            await booking.save();
    console.log('User h benchod',booking.user)

            const user = await User.findById(booking.user)
            console.log("Emitting bookingAccepted to user socket ID:", user.socketId);
            io.to(user.socketId).emit('bookingAccepted', {
                msg: 'Your booking has been accepted. Proceed to payment.',
                bookingId: booking._id,
                price: booking.price,
                paymentPageUrl: `/payment/${booking._id}`,
            });
    
            console.log('Booking accepted:', booking);
        } catch (error) {
            console.log('Error accepting booking', error);
        }
    });
    

    // Handle booking decline
    socket.on('declineBooking', async (data) => {
        try {
            const { bookingId } = data;
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return socket.emit('bookingError', { msg: 'Booking not found.' });
            }
            booking.status = 'Declined';
            await booking.save();
            console.log('Driver declined the booking', bookingId);
        } catch (error) {
            console.log('Error declining booking', error);
        }
    });

    // Handle chat room joining
    socket.on('joinRoom', (bookingId) => {
        console.log(`User joined booking room: ${bookingId}`);
        socket.join(bookingId);
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
        const { bookingId, message, senderId, senderModel } = data;
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.status !== 'Accepted') {
                return socket.emit('chatError', 'Chat is only allowed for accepted bookings.');
            }

            const chatMessage = new Chat({
                booking: bookingId,
                sender: senderId,
                senderModel,
                message,
            });

            await chatMessage.save();
            console.log('Message saved to database:', chatMessage);

            if (io.sockets.adapter.rooms.has(bookingId)) {
                io.to(bookingId).emit('newMessage', chatMessage);
                console.log('Message emitted to room:', bookingId);
            } else {
                console.error('Socket is not part of the room:', bookingId);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('chatError', 'Failed to send message.');
        }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`User ${socket.id} disconnected. Reason: ${reason}`);
    });
});

// Start the server and connect to MongoDB
const start = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not defined in environment variables.');
        process.exit(1);
    }

    try {
        await connectDB(process.env.MONGO_URI);  // Connect to MongoDB
        console.log('Connected to MongoDB');
        server.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (error) {
        console.error(`Error connecting to the database: ${error.message}`);
        process.exit(1);
    }
};

start();
