const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { verify, verifyAdmin } = require("../auth");

router.get("/", verify, verifyAdmin, userController.getAllUsers);

router.get("/details", verify, userController.getProfile);

router.get("/:id", verify, verifyAdmin, userController.getUserById);

// router.post('/reset-password', verify, userController.resetPassword);

router.put('/update-profile', verify, userController.updateProfile);

module.exports = router;
