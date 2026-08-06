const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema({
    seatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat'
    },
    seatNumber: {
        type: String,
        required: true
    },
    seatClass: {
        type: String,
        enum: ['First', 'Business', 'Economy'],
        required: true
    },
    fee: {
        type: Number,
        default: 0
    }
}, { _id: false });

const bookingPassengerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    mobileNo: {
        type: String
    },
    dateOfBirth: {
        type: String
    },
    nationality: {
        type: String
    },
    passportNo: {
        type: String
    }
}, { _id: false });

const bookingServiceSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    lineTotal: {
        type: Number,
        default: 0
    }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    bookingRef: {
        type: String,
        required: [true, 'Booking Reference is Required'],
        unique: true,
        uppercase: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is Required']
    },
    flightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: [true, 'Flight ID is Required']
    },
    seats: {
        type: [bookingSeatSchema],
        default: []
    },
    passengers: {
        type: [bookingPassengerSchema],
        default: []
    },
    services: {
        type: [bookingServiceSchema],
        default: []
    },
    class: {
        type: String,
        enum: ['First', 'Business', 'Economy'],
        required: [true, 'Class is Required']
    },
    seatFee: {
        type: Number,
        default: 0
    },
    taxes: {
        type: Number,
        default: 0
    },
    servicesTotal: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Price is Required']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
