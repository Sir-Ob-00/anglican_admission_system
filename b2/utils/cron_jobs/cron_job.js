// Importing necessary modules
const cron = require('node-cron');
const { sendEmail } = require('../mail/email');
const prisma = require('../../config/db_config');
const AppError = require('../errors/AppError');