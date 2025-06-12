const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Driver = require('../Models/drivermodel');
const { createToken } = require('../utiils/token-manager'); // Use the same token creator if applicable
const { DRIVER_COOKIE_NAME } = require('../utiils/constants');

passport.use(
  'driver-google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
callbackURL: 'https://auto-taxi-1.onrender.com/api/driver/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if a driver exists with the email provided by Google
        let driver = await Driver.findOne({ email: profile.emails[0].value });
        if (!driver) {
          // Create a new driver record if none exists
          driver = await Driver.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            password: "", // No password needed for Google login
          });
        }
        return done(null, driver);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Optional: if you use sessions, you can serialize/deserialize
passport.serializeUser((driver, done) => {
  done(null, driver.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const driver = await Driver.findById(id);
    done(null, driver);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
