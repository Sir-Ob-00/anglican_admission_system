// Authentication middleware
// importing necessary modules
const { verifyToken, extractToken } = require('../../utils/jwt/jwt');
const AppError = require('../../utils/errors/AppError');
const { logger } = require('../../utils/logger/logger');


// middleware function to authenticate the user
const tokenMiddleware = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw new AppError('No token provided', 401);
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        logger.error('Authentication error:', err);
        next(new AppError('Unauthorized', 401));
    }

}


// login middleware
const loginMiddleware = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        logger.error('Login error: Email and password are required');
        return next(new AppError('Email and password are required', 400));
    }

    next();
}




module.exports = {
    tokenMiddleware,
    loginMiddleware
}