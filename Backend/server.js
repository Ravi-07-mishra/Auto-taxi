const express = require('express');
const connectDB = require('./connectDB/connectDB');
const path = require('path')
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const axios = require('axios'); // Make sure this line is added

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
app.use("/uploads", express.static(path.join(__dirname, "utiils/uploads")))

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
app.get("/api/geocode", async (req, res) => {
    const { query } = req.query; // Get the query parameter (e.g., "Berlin")
    const OPEN_CAGE_API_KEY = "a5c124e481d04249a8586ad2b15a817b"; // Your OpenCage API key
    
    try {
      const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
        params: {
          q: query,
          key: OPEN_CAGE_API_KEY,
        }
      });
      res.json(response.data); // Forward the data from OpenCage to the frontend
    } catch (error) {
      console.error("Error fetching geocoding data:", error);
      res.status(500).json({ error: "Failed to fetch geocoding data" });
    }
  });
  app.get('/directions', async (req, res) => {
    const { start, end } = req.query;
    const apiKey = process.env.ORS_API_KEY;  // Make sure this key is valid
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
  
    try {
      const response = await axios.get(url, {
        params: {
          api_key: apiKey,
          start: start, // Longitude, Latitude
          end: end,     // Longitude, Latitude
        },
      });
  
      console.log('ORS API Response:', response.data);  // Log the response data to help with debugging
  
      res.json(response.data);  // Return response data back to the frontend
    } catch (error) {
      console.error("Error fetching route from ORS:", error.message);  // Log the error
      // Check for specific ORS API errors
      if (error.response) {
        console.error("ORS API Response:", error.response.data);
        return res.status(500).json({ error: error.response.data });
      } else {
        return res.status(500).json({ error: 'Failed to fetch route from ORS' });
      }
    }
  });
  
// Socket.io event handling
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Emit all driver locations to the client when a new socket connects
    socket.emit('updateLocations', driverLocations);
    socket.emit('testEvent', { message: 'Hello from server!' });

    // Handle driver location updates
    socket.on('driverLocation', async (data) => {
        if (!data || typeof data.id !== 'string' || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
            console.error('Invalid driver location data:', data);
            return;
        }
    
        // Validate lat and lng ranges
        if (Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) {
            console.error('Invalid lat/lng values:', { lat: data.lat, lng: data.lng });
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
    const notification = await Notification.create({
        userId: user._id,
        type: 'acceptance',
        message: `You booking #${bookingId} has been accepted. Price ${price}`,
    })

            console.log('Booking accepted:', booking);
            console.log("Emitting bookingAccepted notification to user's socket ID:", user.socketId);
            io.to(user.socketId).emit('newNotification', notification);
            
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
            const notification = await Notification.create({
                userId: user._id,
                type: 'decline',
                message: `Your booking #${bookingId} has been declined.`,
            });
            console.log("Emitting bookingDeclined notification to user's socket ID:", user.socketId);
            if (user.socketId && io.sockets.sockets.get(user.socketId)) {
                io.to(user.socketId).emit('newNotification', notification);
            } else {
                console.log(`User ${user._id} is not connected via socket.`);
            }
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
            if (!message || typeof message !== 'string' || message.trim() === '') {
                return socket.emit('chatError', 'Message content cannot be empty.');
            }
    
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.status !== 'Accepted') {
                return socket.emit('chatError', 'Chat is only allowed for accepted bookings.');
            }
    
            let chat = await Chat.findOne({ booking: bookingId });
            if (!chat) {
                chat = new Chat({ booking: bookingId, messages: [] });
            }
    
            const chatMessage = {
                sender: senderId,
                senderModel,
                text: message.trim(),
                timestamp: new Date(),
                seenBy: [],
            };
    
            chat.messages.push(chatMessage);
            await chat.save();
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
