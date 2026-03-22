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


    // password strength validation
    if (password.length < 6) {
        logger.error('Login error: Password must be at least 6 characters long');
        return next(new AppError('Password must be at least 6 characters long', 400));
    }

    next();
}


// send otp middleware
const sendOtpMiddleware = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        logger.error('Send OTP error: Email is required');
        return next(new AppError('Email is required', 400));
    }

    next();
}


// verify otp middleware
const verifyOtpMiddleware = (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        logger.error('Verify OTP error: Email and OTP are required');
        return next(new AppError('Email and OTP are required', 400));
    }

    next();
}


// forgot password middleware
const forgotPasswordMiddleware = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        logger.error('Forgot Password error: Email is required');
        return next(new AppError('Email is required', 400));
    }

    next();
}


// reset password middleware
const resetPasswordMiddleware = (req, res, next) => {
    const { email, newPassword, confirmPassword } = req.body;


    if (!email || !newPassword || !confirmPassword) {
        logger.error('Reset Password error: Email, new password, and confirm password are required');
        return next(new AppError('Email, new password, and confirm password are required', 400));
    }

    if (newPassword !== confirmPassword) {
        logger.error('Reset Password error: New password and confirm password do not match');
        return next(new AppError('New password and confirm password do not match', 400));
    }


    // password strength validation
    if (newPassword.length < 6) {
        logger.error('Reset Password error: New password must be at least 6 characters long');
        return next(new AppError('New password must be at least 6 characters long', 400));
    }

    next();
}





























module.exports = {
    tokenMiddleware,
    loginMiddleware,
    sendOtpMiddleware,
    verifyOtpMiddleware,
    forgotPasswordMiddleware,
    resetPasswordMiddleware
}