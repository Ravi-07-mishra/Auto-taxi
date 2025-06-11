// server.js (or index.js / app.js)
const express = require("express");
const connectDB = require("./connectDB/connectDB");
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const http = require("http");
const app = express();
const socketIo = require("socket.io");
const passport = require("passport");
require("./controllers/googleauth");
require("./controllers/drivergoogleauth");
const adminRoutes = require("./Routes/adminRoutes");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const Chat = require("./Models/Chatmodel");
const ChatRouter = require("./Routes/Chat");
const Booking = require("./Models/Bookingmodel");
const UserRouter = require("./Routes/User");
const DriverRouter = require("./Routes/Driver");
const Driver = require("./Models/drivermodel");
const User = require("./Models/Usermodel");
const Paymentrouter = require("./Routes/payment");

// Create HTTP server
const server = http.createServer(app);

// ─── CORS CONFIGURATION ───────────────────────────────────────────
// Temporarily allow all origins for testing
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "utiils/uploads")));
app.get('/health', (req, res) => {
  res.send('OK');
});

// ─── SOCKET.IO INITIALIZATION ─────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: true,             // allow any origin
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});
global.io = io;

app.use(passport.initialize());

// ─── ROUTES ─────────────────────────────────────────────────────────
app.use("/api/user", UserRouter);
app.use("/api/driver", DriverRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/payment", Paymentrouter);
app.use("/api/admin", adminRoutes);

// Debug: List all endpoints on startup
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));

const port = process.env.PORT || 3000;

let driverLocations = {};

// ─── GEO CODING EXAMPLES ────────────────────────────────────────────
// Forward raw query to OpenCage (forward geocoding)
app.get("/api/geocode", async (req, res) => {
  const { query } = req.query;
  const OPEN_CAGE_API_KEY = process.env.OPEN_CAGE_API_KEY || "your-api-key-here";
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: { q: query, key: OPEN_CAGE_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    res.status(500).json({ error: "Failed to fetch geocoding data" });
  }
});

// Reverse geocoding
app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  const OPEN_CAGE_API_KEY = process.env.OPEN_CAGE_API_KEY || "your-api-key-here";
  if (!lat || !lon) {
    return res.status(400).json({ error: "Latitude and longitude are required." });
  }
  try {
    const response = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
      params: { key: OPEN_CAGE_API_KEY, q: `${lat},${lon}`, pretty: 1 },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching reverse geocoding data:", error);
    res.status(500).json({ error: "Failed to fetch reverse geocoding data" });
  }
});

// Directions via OpenRouteService
app.get("/directions", async (req, res) => {
  const { start, end } = req.query;
  const apiKey = process.env.ORS_API_KEY;
  if (!start || !end) {
    return res.status(400).json({ error: "Start and end parameters are required." });
  }
  try {
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const response = await axios.get(url, {
      params: { api_key: apiKey, start, end },
    });
    console.log("ORS Response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching route from ORS:", error.response || error.message);
    if (error.response) {
      return res.status(500).json({ error: error.response.data });
    }
    return res.status(500).json({ error: "Failed to fetch route from ORS" });
  }
});

// ─── SOCKET.IO EVENT HANDLING ───────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send existing driver locations on new connection
  socket.emit("updateLocations", driverLocations);
  socket.emit("testEvent", { message: "Hello from server!" });

  // Driver location update handler
  socket.on("driverLocation", async (data) => {
    if (
      !data ||
      typeof data.id !== "string" ||
      typeof data.lat !== "number" ||
      typeof data.lng !== "number"
    ) {
      console.error("Invalid driver location data:", data);
      return;
    }

    if (Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) {
      console.error("Invalid lat/lng values:", data);
      return;
    }

    console.log("Driver location received:", data);
    try {
      const driver = await Driver.findById(data.id);
      if (!driver) {
        console.log("Driver not found for ID:", data.id);
        return;
      }
      driver.location.lat = data.lat;
      driver.location.lng = data.lng;
      driver.socketId = socket.id;
      await driver.save();

      driverLocations[data.id] = { lat: data.lat, lng: data.lng };
      io.emit("updateLocations", driverLocations);
      console.log("Updated driver locations:", driverLocations);
    } catch (error) {
      console.error("Error updating driver location:", error);
    }
  });

  // Set user socket ID
  socket.on("setUserSocketId", async (userId) => {
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      console.error("Invalid userId:", userId);
      return;
    }
    try {
      const user = await User.findById(userId);
      if (user) {
        user.socketId = socket.id;
        await user.save();
        console.log("User socket ID updated:", userId, socket.id);
      } else {
        console.log("User not found:", userId);
      }
    } catch (error) {
      console.error("Error updating user socketId:", error);
    }
  });

  // Ride completed → notify user
  socket.on("rideCompleted", async (data) => {
    try {
      console.log('emitting to user');
      const { bookingId, paymentAmount } = data;
      const booking = await Booking.findById(bookingId).populate("user");
      if (!booking) {
        console.error("Booking not found:", bookingId);
        return;
      }
      io.to(booking.user.socketId).emit("RideCompletednowpay", {
        bookingId: booking._id,
        price: paymentAmount,
        paymentPageUrl: `/payment/${booking._id}`,
      });
      console.log("RideCompletednowpay event sent to user");
    } catch (error) {
      console.error("Error in rideCompleted handler:", error);
    }
  });

  // Accept booking → notify user
  socket.on("acceptBooking", async (data) => {
    try {
      const { bookingId } = data;
      console.log("Booking accepted:", bookingId);
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return socket.emit("bookingError", { msg: "Booking not found" });
      }
      booking.status = "Accepted";
      await booking.save();

      const user = await User.findById(booking.user);
      console.log("Emitting bookingAccepted to user socket:", user.socketId);
      io.to(user.socketId).emit("bookingAccepted", {
        msg: "Your booking has been accepted. Proceed to payment.",
        bookingId: booking._id,
        price: booking.price,
        paymentPageUrl: `/payment/${booking._id}`,
      });
      console.log("Booking accepted notification sent");
    } catch (error) {
      console.error("Error accepting booking:", error);
    }
  });

  // Decline booking → no direct user notification
  socket.on("declineBooking", async (data) => {
    try {
      const { bookingId } = data;
      console.log("Booking declined:", bookingId);
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return socket.emit("bookingError", { msg: "Booking not found." });
      }
      booking.status = "Declined";
      await booking.save();
    } catch (error) {
      console.error("Error declining booking:", error);
      socket.emit("bookingError", {
        msg: "Server error while declining booking.",
      });
    }
  });

  // Chat: join room & broadcast messages
  socket.on("joinRoom", (bookingId) => {
    console.log(`User joined booking room: ${bookingId}`);
    socket.join(bookingId);
  });
  socket.on("sendMessage", async (messageData) => {
    try {
      const { bookingId, message, senderId, senderModel, senderName } = messageData;
      let chat = await Chat.findOne({ booking: bookingId });
      if (!chat) {
        chat = new Chat({
          booking: bookingId,
          messages: [
            { sender: senderId, senderModel, senderName, text: message },
          ],
        });
      } else {
        chat.messages.push({
          sender: senderId,
          senderModel,
          senderName,
          text: message,
        });
      }
      await chat.save();
      io.to(bookingId).emit("newMessage", {
        sender: senderId,
        senderModel,
        senderName,
        text: message,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("chatError", "Failed to send message.");
    }
  });

  // Client disconnects
  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });
});

// ─── START SERVER & MONGODB ────────────────────────────────────────
const start = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not defined in .env");
    process.exit(1);
  }
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

start();
