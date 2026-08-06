const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight');
const { verify, verifyAdmin } = require("../auth");

router.get("/", flightController.getAllFlights);

router.get("/:id", flightController.getFlightById);

router.post("/", verify, verifyAdmin, flightController.createFlight);

router.patch("/:id", verify, verifyAdmin, flightController.updateFlight);

router.delete("/:id", verify, verifyAdmin, flightController.deleteFlight);

module.exports = router;