// the error middleware will catch any error thrown in the application and send a response to the client with the error message and status code
const AppError = require('./AppError');
require('dotenv').config();

const customError = (err, req, res, next) => {
    // if the error is an instance of AppError, send the error message and status code to the client
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
    isOperational = err.isOperational || false;

    // Error response object
    const errorResponse = {
        "success": false,
        status: statusCode,
        message: message,
        isOperational: isOperational
    };

    // checking if the node environment is development or production and sending the error response accordingly
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);

};

module.exports = { customError };