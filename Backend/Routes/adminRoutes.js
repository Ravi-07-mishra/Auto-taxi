// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Driver = require('../Models/drivermodel');
const bcrypt = require('bcryptjs');
const Booking = require('../Models/Bookingmodel');
const User = require('../Models/Usermodel');

// Admin credentials (use environment variables in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'password', 10);

// Token expiry settings (adjust as needed)
const TOKEN_EXPIRES = '1h';

// Helper function to generate a token
const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// ===== ADMIN AUTHENTICATION ===== //

// POST /admin/login – Authenticate admin and set a http‑only cookie
router.post('/login', async (req, res) => {
    
  const { username, password } = req.body;
  console.log(username,password);
  const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (username === ADMIN_USERNAME && isPasswordValid) {
    const payload = { role: 'admin' };
    const token = generateAccessToken(payload);
    // Set token in an http‑only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      // secure: true, // Uncomment this line when serving over HTTPS
      sameSite: 'Strict',
      maxAge: 3600000, // 1 hour in milliseconds
    });
    return res.json({ message: 'Login successful' });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// POST /admin/logout – Clear the admin token cookie
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ message: 'Logged out successfully' });
});

// ===== TOKEN VERIFICATION MIDDLEWARE ===== //

const verifyAdmin = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  });
};

// ===== DASHBOARD & ANALYTICS ===== //

// GET /admin/dashboard – Returns overall statistics
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const totalUsers = await User.countDocuments();
    res.json({
      totalDrivers,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// GET /admin/aggregated – Detailed aggregated data for charts (e.g., booking statuses)
router.get('/aggregated', verifyAdmin, async (req, res) => {
  try {
    const statuses = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json({ statuses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching aggregated data' });
  }
});

// ===== CRUD ENDPOINTS ===== //

// ----- Drivers CRUD ----- //

// UPDATE a driver by ID
router.put('/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updatedDriver });
  } catch (error) {
    res.status(500).json({ message: 'Error updating driver' });
  }
});

// DELETE a driver by ID
router.delete('/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting driver' });
  }
});

// GET all drivers
router.get('/drivers', verifyAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json({ data: drivers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

// ----- Bookings CRUD ----- //

// UPDATE a booking by ID
router.put('/bookings/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// DELETE a booking by ID
router.delete('/bookings/:id', verifyAdmin, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking' });
  }
});

// GET all bookings (with user and driver populated)
router.get('/bookings', verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user').populate('driver');
    res.json({ data: bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// ----- Users CRUD ----- //

// UPDATE a user by ID
router.put('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ data: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// DELETE a user by ID
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// GET all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
