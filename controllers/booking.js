const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Seat = require("../models/Seat");
const Flight = require("../models/Flight");
const { createPayment } = require("./payment");

const VALID_PAYMENT_METHODS = ["card", "gcash", "maya", "bank", "miles"];
const VALID_SEAT_CLASSES = ["First", "Business", "Economy"];

function generateRef(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
}

function normalizeSeatClass(value) {
    if (!value) return "Economy";
    const match = VALID_SEAT_CLASSES.find(
        (c) => c.toLowerCase() === String(value).toLowerCase()
    );
    return match || "Economy";
}

function resolveCabinClass(seats) {
    const rank = { First: 3, Business: 2, Economy: 1 };
    let best = "Economy";
    for (const seat of seats) {
        const seatClass = normalizeSeatClass(seat.seatClass);
        if ((rank[seatClass] || 0) > (rank[best] || 0)) {
            best = seatClass;
        }
    }
    return best;
}

module.exports.getBookings = (req, res, next) => {
  return Booking.find({ userId: req.user.id })
    .populate('flightId')
    .then((bookings) => {
      if (bookings) {
        res.status(200).send({ bookings: bookings, status: 200 });
      } else {
        res
          .status(200)
          .send({ message: "No bookings were made yet", status: 200 });
      }
    })
    .catch((err) => res.status(500).send(err));
};

module.exports.getBookingById = (req, res, next) => {
    const bookingId = req.params.id || req.params.bookingId;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).send({ message: "Invalid booking ID", status: 400 });
    }

    return Booking.findById(bookingId)
        .populate('flightId')
        .then((booking) => {
            if (booking) {
                res.status(200).send({ booking: booking, status: 200 });
            } else {
                res.status(404).send({ message: "Booking not found", status: 404 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

module.exports.getAllBookings = (req, res, next) => {
    return Booking.find({})
        .populate('flightId')
        .then((bookings) => {
            if (bookings && bookings.length > 0) {
                res.status(200).send({ bookings: bookings, status: 200 });
            } else {
                res.status(200).send({ message: "No bookings found", status: 200 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

module.exports.getBookingsByFlightId = (req, res, next) => {
    const flightId = req.params.flightId;

    if (!mongoose.Types.ObjectId.isValid(flightId)) {
        return res.status(400).send({ message: "Invalid flight ID", status: 400 });
    }

    return Booking.find({ flightId: flightId })
        .populate('flightId')
        .then((bookings) => {
            if (bookings && bookings.length > 0) {
                res.status(200).send({ bookings: bookings, status: 200 });
            } else {
                res.status(200).send({ message: "No bookings found for this flight", status: 200 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

module.exports.getBookingsByUserId = (req, res, next) => {
    const userId = req.params.userId || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid user ID", status: 400 });
    }

    return Booking.find({ userId: userId })
        .populate('flightId')
        .then((bookings) => {
            if (bookings && bookings.length > 0) {
                res.status(200).send({ bookings: bookings, status: 200 });
            } else {
                res.status(200).send({ message: "No bookings found for this user", status: 200 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

async function createBooking({ userId, flightId, formattedSeats, seatObjectIds, formattedPassengers, formattedServices, seatFare, taxes, servicesTotal, total, session }) {
    if (seatObjectIds.length > 0) {
        const dbSeats = await Seat.find({ _id: { $in: seatObjectIds }, flightId }).session(session);
        if (dbSeats.length !== seatObjectIds.length) {
            throw new Error("One or more seats do not belong to this flight.");
        }

        const alreadyBooked = dbSeats.filter((s) => s.isBooked);
        if (alreadyBooked.length > 0) {
            throw new Error(`Seat(s) already booked: ${alreadyBooked.map((s) => s.seatNumber).join(", ")}`);
        }

        await Seat.updateMany(
            { _id: { $in: seatObjectIds } },
            { $set: { isBooked: true } },
            { session }
        );
    }

    const bookingRef = generateRef("BK");

    const [booking] = await Booking.create([{
        bookingRef,
        userId,
        flightId,
        seats: formattedSeats,
        passengers: formattedPassengers,
        services: formattedServices,
        class: resolveCabinClass(formattedSeats),
        seatFee: Number(seatFare ?? 0),
        taxes: Number(taxes ?? 0),
        servicesTotal: Number(servicesTotal ?? 0),
        price: total,
        status: "confirmed"
    }], { session });

    return booking;
}

module.exports.getBookingsByUserId = (req, res, next) => {
    const userId = req.params.userId || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: "Invalid user ID", status: 400 });
    }

    return Booking.find({ userId: userId })
        .then((bookings) => {
            if (bookings && bookings.length > 0) {
                res.status(200).send({ bookings: bookings, status: 200 });
            } else {
                res.status(200).send({ message: "No bookings found for this user", status: 200 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

module.exports.createBookingWithPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            const err = new Error("User authentication required.");
            err.statusCode = 401;
            throw err;
        }

        const {
            paymentMethod, flight, selectedSeats = [], passengers = [],
            seatFare, taxes = 0, servicesTotal = 0, selectedServices = [], total
        } = req.body;

        if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
            const err = new Error("Invalid payment method.");
            err.statusCode = 400;
            throw err;
        }

        const flightId = flight?._id || flight?.id;
        if (!flightId || !mongoose.Types.ObjectId.isValid(flightId)) {
            const err = new Error("A valid flight ID is required.");
            err.statusCode = 400;
            throw err;
        }

        if (typeof total !== "number" || total < 0) {
            const err = new Error("A valid total amount is required.");
            err.statusCode = 400;
            throw err;
        }

        const existingFlight = await Flight.findById(flightId).session(session);
        if (!existingFlight) {
            const err = new Error("Flight not found.");
            err.statusCode = 404;
            throw err;
        }

        const formattedSeats = selectedSeats.map((seat) => ({
            seatId: seat.dbId && mongoose.Types.ObjectId.isValid(seat.dbId) ? seat.dbId : undefined,
            seatNumber: seat.seatNumber || seat.id || seat.number || "",
            seatClass: normalizeSeatClass(seat.seatClass || seat.classType),
            fee: Number(seat.price ?? seat.fee ?? 0)
        }));
        const seatObjectIds = formattedSeats.map((s) => s.seatId).filter(Boolean);

        const formattedPassengers = passengers.map((p) => ({
            firstName: p.firstName, lastName: p.lastName, email: p.email || ""
        }));

        const formattedServices = (selectedServices || []).map((service) => ({
            id: service.id, label: service.label, price: Number(service.price ?? 0)
        }));

        const savedBooking = await createBooking({
            userId: authUserId, flightId, formattedSeats, seatObjectIds,
            formattedPassengers, formattedServices, seatFare, taxes, servicesTotal, total, session
        });

        const savedPayment = await createPayment({
            bookingId: savedBooking._id, userId: authUserId, amount: total, method: paymentMethod, session
        });

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Booking and payment details saved successfully",
            data: { booking: savedBooking, payment: savedPayment }
        });

    } catch (error) {
        await session.abortTransaction();

        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.statusCode ? error.message : "Database transaction failed",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

module.exports.modifyBooking = (req, res, next) => {
    const bookingId = req.params.id || req.params.bookingId;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).send({ message: "Invalid booking ID", status: 400 });
    }

    return Booking.findByIdAndUpdate(
        bookingId,
        { $set: req.body },
        { new: true, runValidators: true }
    )
        .then((updatedBooking) => {
            if (updatedBooking) {
                res.status(200).send({
                    message: "Booking modified successfully",
                    booking: updatedBooking,
                    status: 200
                });
            } else {
                res.status(404).send({ message: "Booking not found", status: 404 });
            }
        })
        .catch((err) => res.status(500).send(err));
};

module.exports.cancelBooking = (req, res, next) => {
    const bookingId = req.params.id || req.params.bookingId;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).send({ message: "Invalid booking ID", status: 400 });
    }

    return Booking.findByIdAndUpdate(
        bookingId,
        { $set: { status: "cancelled" } },
        { new: true }
    )
        .then((booking) => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found", status: 404 });
            }

            // Extract seat IDs to unbook them
            const seatObjectIds = (booking.seats || [])
                .map((s) => s.seatId)
                .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

            if (seatObjectIds.length > 0) {
                return Seat.updateMany(
                    { _id: { $in: seatObjectIds } },
                    { $set: { isBooked: false } }
                ).then(() => {
                    return res.status(200).send({
                        message: "Booking cancelled successfully and seats released",
                        booking: booking,
                        status: 200
                    });
                });
            }

            return res.status(200).send({
                message: "Booking cancelled successfully",
                booking: booking,
                status: 200
            });
        })
        .catch((err) => res.status(500).send(err));
};
