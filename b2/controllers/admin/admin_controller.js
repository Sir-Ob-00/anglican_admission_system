// Importing neceessary modules
const { logger } = require('../../utils/logger/logger');
const AppError = require('../../utils/errors/AppError');
const prisma = require('../../config/db_config');
const argon2 = require('argon2');




// Admin Create User Controller
const createUserController = async (req, res, next) => {
    try {
        const { name, email, password, role, mfa_enabled } = req.body;

        // checking if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            logger.error(`Create user error: User with email ${email} already exists`);
            next(new AppError('User with this email already exists', 400));
        }

        // hashing the password and creating the user
        const hashedPassword = await argon2.hash(password);

        // creating the user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                mfa_enabled
            }
        });

        // adding an entry to the activity log
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                action: `created user with email ${email}`,
                timestamp: new Date()
            }
        });


        // excluding password from the user object before sending the response
        delete newUser.password;

        logger.info(`User created successfully with email ${email}`);
        res.status(201).json({
            "success": true,
            "message": "User created successfully",
            "user": newUser
        });

    } catch (err) {
        logger.error('Create user error:', err);
        next(new AppError('Failed to create user', 500));
    }
};







module.exports = {
    createUserController
};