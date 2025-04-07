const jwt = require('jsonwebtoken');
const { COOKIE_NAME, DRIVER_COOKIE_NAME } = require('../utiils/constants');

const createToken = (id, email, expiresIn) => {
    const payload = { id, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
    });
    return token;
};

const verifyToken = async (req, res, next) => {
    try {
        const token = req.signedCookies[COOKIE_NAME];
        if (!token || token.trim() === "") {
            return res.status(401).json({ message: "Token not received" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("JWT Verification Error:", err.message);
                return res.status(401).json({ message: "Token expired or invalid" });
            }
            console.log("Token verification successful");
            res.locals.jwtData = decoded;
            next();
        });
    } catch (error) {
        console.error("Token verification error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const verifyDriverToken = async (req, res, next) => {
    try {
        const token = req.signedCookies[DRIVER_COOKIE_NAME];
        if (!token || token.trim() === "") {
            return res.status(401).json({ message: "Token not received" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("JWT Verification Error:", err.message);
                return res.status(401).json({ message: "Token expired or invalid" });
            }
            console.log("Token verification successful");
            res.locals.jwtDriverData = decoded;
            
            next();
        });
    } catch (error) {
        console.error("Token verification error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { createToken, verifyToken, verifyDriverToken };
