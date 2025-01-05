const mongoose = require('mongoose');

const connectDB = (url) => {
    return mongoose.connect(url, {
        useNewUrlParser: true,
        
        useUnifiedTopology: true,
        // Ensures the new server discovery engine is used
    });
};

module.exports = connectDB;