const Seat = require("../models/Seat");
const Flight = require("../models/Flight");

// Default cabin when a flight was created before seat generation existed
const DEFAULT_CABIN = {
  totalRows: 20,
  columns: "ABCDEFGHJ",
  firstClassRows: 4,
  businessRows: 6,
};

function sortSeats(seats) {
  return seats.sort((a, b) => {
    const rowA = parseInt(a.seatNumber, 10) || 0;
    const rowB = parseInt(b.seatNumber, 10) || 0;
    if (rowA !== rowB) return rowA - rowB;
    const letterA = String(a.seatNumber).replace(/^\d+/, "");
    const letterB = String(b.seatNumber).replace(/^\d+/, "");
    return letterA.localeCompare(letterB);
  });
}

async function ensureSeatsForFlight(flightId) {
  const existing = await Seat.find({ flightId });
  if (existing.length > 0) return existing;

  const seatsToCreate = [];
  const { totalRows, columns, firstClassRows, businessRows } = DEFAULT_CABIN;

  for (let row = 1; row <= totalRows; row++) {
    let classType = "Economy";
    if (row <= firstClassRows) {
      classType = "First";
    } else if (row <= firstClassRows + businessRows) {
      classType = "Business";
    }

    for (const seatLetter of columns) {
      seatsToCreate.push({
        flightId,
        seatNumber: `${row}${seatLetter}`,
        classType,
        isBooked: false,
      });
    }
  }

  await Seat.insertMany(seatsToCreate);
  return Seat.find({ flightId });
}

module.exports.getAllSeats = async (req, res, next) => {
  try {
    const seats = await Seat.find();
    res.status(200).json({ success: true, data: seats });
  } catch (error) {
    next(error);
  }
};

module.exports.getSeatsByFlightId = async (req, res, next) => {
  try {
    const { flightId } = req.params;

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found.",
      });
    }

    const seats = sortSeats(await ensureSeatsForFlight(flightId));

    res.status(200).json({
      success: true,
      data: seats,
      flight: {
        _id: flight._id,
        flightNumber: flight.flightNumber,
        basePrice: flight.basePrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getSeatById = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }
    res.status(200).json({ success: true, data: seat });
  } catch (error) {
    next(error);
  }
};

module.exports.confirmSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) {
      return res.status(404).json({ success: false, message: 'Seat not found' });
    }
    if (seat.isConfirmed) {
      return res.status(400).json({ success: false, message: 'Seat is already confirmed' });
    }
    
    seat.isConfirmed = true;
    seat.userId = req.body.userId || null;
    await seat.save();

    res.status(200).json({ success: true, message: 'Seat confirmed successfully', data: seat });
  } catch (error) {
    next(error);
  }
};
