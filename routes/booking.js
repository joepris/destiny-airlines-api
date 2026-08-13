const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking");
const { verify, verifyAdmin } = require("../auth");

router.get("/", verify, bookingController.getBookings);

router.post("/payment", verify, bookingController.createBookingWithPayment);

router.get("/all", verify, verifyAdmin, bookingController.getAllBookings);

router.get(
  "/flight/:flightId",
  verify,
  verifyAdmin,
  bookingController.getBookingsByFlightId,
);

router.get(
  "/user/:userId",
  verify,
  verifyAdmin,
  bookingController.getBookingsByUserId,
);

router.get("/:id", verify, bookingController.getBookingById);

router.patch("/:id/seats", verify, bookingController.changeBookingSeats);

router.patch("/:id", verify, bookingController.modifyBooking);

router.delete("/:id", verify, bookingController.cancelBooking);

router.get(
  "/admin/all",
  verify,
  verifyAdmin,
  bookingController.getBookingsByAdmin,
);

module.exports = router;
