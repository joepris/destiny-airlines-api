const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post("/check-email", authController.checkEmailIfNotExist);

router.post("/register", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/logout", authController.logoutUser);

router.post("/forgot-password", authController.resetPassword);

module.exports = router;