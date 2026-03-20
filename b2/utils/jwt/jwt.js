// importing necessary modules
const jwt = require('jsonwebtoken');
require('dotenv').config();
const AppError = require('../errors/AppError');


// function to generate a JWT token
const generateToken = (user) => {
    payload = {
        id: user.id,
        email: user.email,
        role: user.role
    }

    return jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    );
}



// function to verify a JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(
            token, 
            process.env.JWT_SECRET
        );

    } catch (err) {
        throw new AppError('Invalid token', 401);
    }

}

const extractToken = (req) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    return token;
}