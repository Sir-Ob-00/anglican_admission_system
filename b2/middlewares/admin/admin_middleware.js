// importing necessary modules
const express = require('express');
const { logger } = require('../../utils/logger/logger');
const AppError = require('../../utils/errors/AppError');




// Admin Role middleware
const isAdminMiddleware = (req, res, next) => {

    // checking if the user role is admin
    if (req.user.role !== 'admin') {
        logger.error(`Unauthorized access attempt by user with role ${req.user.role}`);
        return next(new AppError('Unauthorized', 403));
    }

    next();
}



// Create User Middleware
const createUserMiddleware = (req, res, next) => {

    // checking if the required fields are present in the request body
    const { name, email, password, role, mfa_enabled } = req.body;

    if (!name || !email || !password || !role) {
        logger.error('Create user error: Missing required fields');
        return next(new AppError('Name, email, password, and role are required', 400));
    }

}




module.exports = {
    isAdminMiddleware,
    createUserMiddleware
}

