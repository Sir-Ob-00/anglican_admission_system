// Importing necessary modules
const express = require('express');
const {  loginMiddleware } = require('../../middlewares/auth/auth_middleware');
const { logger } = require('../../utils/logger/logger');
const { loginController } = require('../../controllers/auth/auth_controller');

const router = express.Router();


// Login route
router.post('/login', loginMiddleware, loginController);


module.exports = router;