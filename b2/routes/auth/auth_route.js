// Importing necessary modules
const express = require('express');
const {  loginMiddleware, sendOtpMiddleware, verifyOtpMiddleware,
    forgotPasswordMiddleware, resetPasswordMiddleware  } = require('../../middlewares/auth/auth_middleware');
const { logger } = require('../../utils/logger/logger');
const { loginController, sendOtpController, verifyOtpController,
    resendOtpController, forgotPasswordController,
    resetPasswordController  } = require('../../controllers/auth/auth_controller');

const router = express.Router();


// Login route
router.post('/login', loginMiddleware, loginController);

// Send OTP route
router.post('/send-otp', sendOtpMiddleware, sendOtpController);

// Verify OTP route
router.post('/verify-otp', verifyOtpMiddleware, verifyOtpController);

// Resend OTP route
router.post('/resend-otp', sendOtpMiddleware, resendOtpController);

// Forgot Password route
router.post('/forgot-password', forgotPasswordMiddleware, forgotPasswordController);

// Reset Password route
router.post('/reset-password', resetPasswordMiddleware, resetPasswordController);


module.exports = router;