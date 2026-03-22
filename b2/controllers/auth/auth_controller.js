// importing necessary modules
const prisma = require('../../config/db_config');
const { generateToken } = require('../../utils/jwt/jwt');
const AppError = require('../../utils/errors/AppError');
const argon2 = require('argon2');
const { logger } = require('../../utils/logger/logger');
const { sendEmail } = require('../../utils/mail/email');


// login controller
const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });


        if (!user) {
            next(new AppError('Invalid email', 401));           
        }

        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            logger.error(`Login error: Invalid password for email ${email}`);
            
            next(new AppError('Invalid password', 401));
            
        }

        const token = generateToken(user);

        // excluding password from the user object before sending the response
        delete user.password;

        logger.info(`Login successful for email ${email}`);
        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'login',
                timestamp: new Date()
            }
        });

        res.status(200).json({
            "success": true,
            "message": "Login successful",
            "token": token,
            "user": user
        });
        
    } catch (err) {
        logger.error('Login error:', err);
        next(new AppError('Login failed', 401));
    }
};



// sending otp for mfa controller
const sendOtpController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            next(new AppError('Invalid email', 401));
        }

        // generate a 6 digit otp
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // save the otp in the database with an expiry time of 5 minutes
        await prisma.otp.create({
            data: {
                email: user.email,
                code: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
            }
        });

        // send the otp to the user's email
        // using the email utility function to send the email
        
        await sendEmail(user.email, 'Your OTP Code', `Your OTP code is ${otp}. It will expire in 5 minutes.`);

        logger.info(`OTP sent successfully to email ${email}`);

        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'send_otp',
                timestamp: new Date()
            }
        });

        res.status(200).json({
            "success": true,
            "message": "OTP sent successfully"
        });

    } catch (err) {
        logger.error('Send OTP error:', err);
        next(new AppError('Failed to send OTP', 500));
    }

};



// verify otp controller
const verifyOtpController = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await prisma.otp.findFirst({
            where: {
                email: email,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!otpRecord || otpRecord.code !== otp ) {
            logger.error(`Verify OTP error: Invalid OTP for email ${email}`);
            next(new AppError('Invalid OTP', 401));
            
        }

        if (otpRecord.expiresAt < new Date()) {
            logger.error(`Verify OTP error: OTP expired for email ${email}`);
            next(new AppError('OTP expired', 401));
            
        }

        logger.info(`OTP verified successfully for email ${email}`);

        // getting the user details
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'verify_otp',
                timestamp: new Date()
            }
        });


        // deleting the otp record from the database after successful verification
        await prisma.otp.deleteMany({
            where: { email: otpRecord.email }
        });

        res.status(200).json({
            "success": true,
            "message": "OTP verified successfully"
        });

    } catch (err) {
        logger.error('Verify OTP error:', err);
        next(new AppError('Failed to verify OTP', 500));
    }

};



// resend otp controller
const resendOtpController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            next(new AppError('Invalid email', 401));
            
        }

        
        // checking if the createdAt of the last otp record is less than 1 minute ago before allowing to resend otp
        const lastOtpRecord = await prisma.otp.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });

        if (lastOtpRecord && lastOtpRecord.createdAt > new Date(Date.now() - 60 * 1000)) {
            next(new AppError('Please wait at least 1 minute before resending OTP', 429));

        }

        // deleting any existing otp records for the email before generating a new one
        await prisma.otp.deleteMany({
            where: { email }
        });

       
        // generate a 6 digit otp
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // save the otp in the database with an expiry time of 5 minutes
        await prisma.otp.create({
            data: {
                email: user.email,
                code: otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
            }
        });

        // send the otp to the user's email
        // using the email utility function to send the email
        
        await sendEmail(user.email, 'Your OTP Code', `Your OTP code is ${otp}. It will expire in 5 minutes.`);

        logger.info(`OTP sent successfully to email ${email}`);

        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'resend_otp',
                timestamp: new Date()
            }
        });

        res.status(200).json({
            "success": true,
            "message": "OTP sent successfully"
        });

    } catch (err) {
        logger.error('Resend OTP error:', err);
        next(new AppError('Failed to resend OTP', 500));
    }
};




// forgot password controller
const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            next(new AppError('Invalid email', 401));
        }

        // logging the forgot password request
        logger.info(`Forgot password request received for email ${email}`);

        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'forgot_password',
                timestamp: new Date()
            }
        });

        // send a password reset link to the user's email
        // using the email utility function to send the email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${email}`;
        await sendEmail(user.email, 'Password Reset Request', `Click the following link to reset your password: ${resetLink}`);

        res.status(200).json({
            "success": true,
            "message": "Password reset link sent successfully"
        });

    } catch (err) {
        logger.error('Forgot password error:', err);
        next(new AppError('Failed to send password reset link', 500));
    }

};



// reset password controller
const resetPasswordController = async (req, res, next) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            next(new AppError('Invalid email', 401));
        }

        if (newPassword !== confirmPassword) {
            next(new AppError('Passwords do not match', 400));
        }

        // hashing the new password and updating it in the database
        const hashedPassword = await argon2.hash(newPassword);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        logger.info(`Password reset successful for email ${email}`);

        // inserting data into the activity log
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'reset_password',
                timestamp: new Date()
            }
        });

        res.status(200).json({
            "success": true,
            "message": "Password reset successful"
        });

    } catch (err) {
        logger.error('Reset password error:', err);
        next(new AppError('Failed to reset password', 500));
    }
};













































module.exports = {
    loginController,
    sendOtpController,
    verifyOtpController,
    resendOtpController,
    forgotPasswordController,
    resetPasswordController
}
