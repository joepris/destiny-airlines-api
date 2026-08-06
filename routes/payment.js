const express = require("express");
const router = express.Router();
const paymentController = require('../controllers/payment');
const { verify, verifyAdmin } = require("../auth");

router.get("/", verify, verifyAdmin, paymentController.getAllPayments);

router.post("/pay-booking/:bookingId", verify, paymentController.createPayment);

router.patch("/change-status/:id", verify, verifyAdmin, paymentController.changePaymentStatus);

module.exports = router;