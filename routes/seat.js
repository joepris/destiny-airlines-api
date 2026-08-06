const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seat');
const { verify } = require("../auth");

router.get("/", seatController.getAllSeats);

router.get("/flight/:flightId", seatController.getSeatsByFlightId);

router.get("/:flightId/seats/hold", verify, seatController.getSeatById);

router.post("/:flightId/seats/confirm", verify, seatController.confirmSeat);

module.exports = router;