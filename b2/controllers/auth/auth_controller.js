// importing necessary modules
const prisma = require('../../config/db_config');
const { generateToken } = require('../../utils/jwt/jwt');
const AppError = require('../../utils/errors/AppError');
const argon2 = require('argon2');
const { logger } = require('../../utils/logger/logger');


// login controller
const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email }
        });


        if (!user) {
            throw new AppError('Invalid email', 401);
        }

        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            logger.error(`Login error: Invalid password for email ${email}`);
            
            throw new AppError('Invalid password', 401);
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









module.exports = {
    loginController
}
