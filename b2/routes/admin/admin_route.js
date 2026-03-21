// Importing necessary modules
const express = require('express');
const { isAdminMiddleware, createUserMiddleware } = require('../../middlewares/admin/admin_middleware');
const { tokenMiddleware } = require('../../middlewares/auth/auth_middleware');
const { createUserController } = require('../../controllers/admin/admin_controller');

const router = express.Router();

router.post('/users', tokenMiddleware, isAdminMiddleware, createUserMiddleware, createUserController);


module.exports = router;