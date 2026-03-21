// importing necessary modules
const winston = require('winston');

// configuring winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.timestamp(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If we're not in production then log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// exporting the logger
module.exports = { logger };