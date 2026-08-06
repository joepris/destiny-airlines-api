const Flight = require("../models/Flight");
const Seat = require('../models/Seat');

function startOfUtcDay(value) {
    const d = new Date(value);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function nextUtcDay(value) {
    const d = startOfUtcDay(value);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
}

module.exports.getAllFlights = (req, res, next) => {
    return Flight.find()
        .then((flights) => res.status(200).send(flights))
        .catch(next);
};

module.exports.getFlightById = (req, res, next) => {
    return Flight.findById(req.params.id)
        .then((flight) => {
            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: "Flight not found.",
                });
            }
            return res.status(200).send(flight);
        })
        .catch(next);
};



module.exports.createFlight = async (req, res, next) => {
    try {
        const {
            flightNumber,
            origin,
            destination,
            departure,
            arrival,
            basePrice,
            image, // URL String
            totalRows,
            columnsPerCount,
            aislePositions,
            firstClassRows,
            businessRows,
            economyRows
        } = req.body;

        const code = String(flightNumber || "").trim();
        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Flight number is required."
            });
        }

        if (!departure?.date) {
            return res.status(400).json({
                success: false,
                message: "Departure date is required."
            });
        }

        const destCode = String(destination?.code || "").trim().toUpperCase();
        const departureDay = startOfUtcDay(departure.date);
        const departureDayEnd = nextUtcDay(departure.date);

        const existingWithCode = await Flight.find({ flightNumber: code });

        if (existingWithCode.length > 0) {
            const route = existingWithCode[0];

            // Same flight code must keep the same destination
            if (route.destination.code !== destCode) {
                return res.status(400).json({
                    success: false,
                    message: `Flight ${code} already operates to ${route.destination.city} (${route.destination.code}). New schedules must use the same destination.`
                });
            }

            // Same flight code cannot share a departure date
            const sameDayFlight = existingWithCode.find((flight) => {
                const day = startOfUtcDay(flight.departure.date);
                return day.getTime() === departureDay.getTime();
            });

            if (sameDayFlight) {
                return res.status(409).json({
                    success: false,
                    message: `Flight ${code} already exists for departure date ${departureDay.toISOString().slice(0, 10)}. Use a different date.`
                });
            }
        } else {
            const sameDay = await Flight.findOne({
                flightNumber: code,
                "departure.date": { $gte: departureDay, $lt: departureDayEnd }
            });
            if (sameDay) {
                return res.status(409).json({
                    success: false,
                    message: `Flight ${code} already exists for that departure date.`
                });
            }
        }

        if (Number(firstClassRows) + Number(businessRows) + Number(economyRows) !== Number(totalRows)) {
            return res.status(400).json({ 
                success: false,
                message: "Sum of class rows must equal total rows." 
            });
        }


        if (Number(firstClassRows) + Number(businessRows) + Number(economyRows) !== Number(totalRows)) {
            return res.status(400).json({ 
                message: "Sum of class rows must equal total rows." 
            });
        }

        const newFlight = new Flight({
            flightNumber: code,
            origin,
            destination,
            departure: {
                ...departure,
                date: departureDay
            },
            arrival,
            basePrice,
            image
        });
        const savedFlight = await newFlight.save();
        const seatsToCreate = [];
        // Skip I (aviation convention — avoids confusion with 1)
        const alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

        for (let row = 1; row <= totalRows; row++) {
            let classType = 'Economy';
            if (row <= firstClassRows) {
                classType = 'First';
            } else if (row <= (Number(firstClassRows) + Number(businessRows))) {
                classType = 'Business';
            }

            for (let col = 0; col < columnsPerCount; col++) {
                const seatLetter = alphabet[col];
                if (!seatLetter) break;
                const seatNumber = `${row}${seatLetter}`;

                seatsToCreate.push({
                    flightId: savedFlight._id,
                    seatNumber,
                    classType,
                    isBooked: false
                });
            }
        }

        await Seat.insertMany(seatsToCreate);

        res.status(201).json({
            success: true,
            message: "Flight and seats successfully configured.",
            flight: savedFlight,
            seatsGenerated: seatsToCreate.length
        });

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A flight with this number and departure date already exists."
            });
        }
        next(error); 
    }
};


module.exports.updateFlight = async (req, res, next) => {
    try {
        const flightId = req.params.id;

        const updatedFlight = await Flight.findByIdAndUpdate(
            flightId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedFlight) {
            return res.status(404).json({
                success: false,
                message: "Flight not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Flight updated successfully.",
            flight: updatedFlight
        });
    } catch (error) {
        next(error);
    }
};

module.exports.deleteFlight = async (req, res, next) => {
    try {
        const flightId = req.params.id;

        const deletedFlight = await Flight.findByIdAndDelete(flightId);

        if (!deletedFlight) {
            return res.status(404).json({
                success: false,
                message: "Flight not found."
            });
        }

        await Seat.deleteMany({ flightId: flightId });

        return res.status(200).json({
            success: true,
            message: "Flight and associated seats deleted successfully.",
            flight: deletedFlight
        });
    } catch (error) {
        next(error);
    }
};