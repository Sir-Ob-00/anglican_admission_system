// Authentication middleware
// importing necessary modules
const { verifyToken, extractToken } = require('../../utils/jwt/jwt');
const AppError = require('../../utils/errors/AppError');


// middleware function to authenticate the user
const authMiddleware = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw new AppError('No token provided', 401);
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        next(new AppError('Unauthorized', 401));
    }

}