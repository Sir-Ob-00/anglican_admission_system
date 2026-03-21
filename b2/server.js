// importing necessary modules
const express = require('express');
const cors = require('cors');
const { logger } = require('./utils/logger/logger');
const { customError } = require('./utils/errors/custom_error');
const dotenv = require('dotenv');

// importing routes
const authRoutes = require('./routes/auth/auth_route');
const adminRoutes = require('./routes/admin/admin_route');


// loading environment variables from .env file
dotenv.config();

// creating an instance of express
const app = express();

// port number
const PORT = process.env.PORT || 3000;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(
    {
        origin: '*', // allow requests from this origin
        methods: ['*'], // allow these HTTP methods
        allowedHeaders: ['*'], // allow these headers
        credentials: true // allow credentials
    }
));


// routes
// api base route extension
const apiBaseRoute = '/api/v1';

// auth routes
app.use(`${apiBaseRoute}/auth`, authRoutes);

// Admin Routes
app.use(`${apiBaseRoute}/admin`, adminRoutes);










// error handling middleware
app.use(customError);


// starting the server
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
});