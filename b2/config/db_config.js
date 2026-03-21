// Initializing Prisma Client
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = prisma;