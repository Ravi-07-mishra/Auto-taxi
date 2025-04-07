const User = require('../Models/Usermodel');
const Driver = require('../Models/drivermodel');
const Booking = require('../Models/Booking');

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [users, drivers, bookings, revenue] = await Promise.all([
      User.countDocuments(),
      Driver.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        drivers,
        bookings,
        revenue: revenue[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: err.message
    });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: err.message
    });
  }
};

// Get All Drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password').lean();
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching drivers',
      error: err.message
    });
  }
};

// Get Recent Bookings
exports.getRecentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('driver', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent bookings',
      error: err.message
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's bookings
    await Booking.deleteMany({ user: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User and associated bookings deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: err.message
    });
  }
};

// Delete Driver
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Remove driver from bookings
    await Booking.updateMany(
      { driver: req.params.id },
      { $unset: { driver: 1 }, status: 'Cancelled' }
    );

    res.status(200).json({
      success: true,
      message: 'Driver deleted and bookings updated'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting driver',
      error: err.message
    });
  }
};