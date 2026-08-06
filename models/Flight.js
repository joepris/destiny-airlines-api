const mongoose = require('mongoose');

//Flight Number ID ideas DY, DN, DS para sa destiny airlines
// Same flightNumber may repeat on different departure dates (same destination).
const flightSchema = new mongoose.Schema({
    flightNumber: {
        type: String,
        required: [true, 'Flight Number is Required']
    },
    origin: {
        city: {
            type: String,
            required: [true, 'Origin City is Required']
        },
        code: {
            type: String,
            required: [true, 'Origin Code is Required'],
            uppercase: true,
            maxlength: 3
        }
    },
    destination: {
        city: {
            type: String,
            required: [true, 'Destination City is Required']
        },
        code: {
            type: String,
            required: [true, 'Destination Code is Required'],
            uppercase: true,
            maxlength: 3
        }
    },
    departure: {
        date: {
            type: Date,
            required: [true, 'Departure Date is Required']
        },
        time: {
            type: String,
            required: [true, 'Departure Time is Required']
        }
    },
    arrival: {
        date: {
            type: Date,
            required: [true, 'Arrival Date is Required']
        },
        time: {
            type: String,
            required: [true, 'Arrival Time is Required']
        }
    },
    //based on Osaka price for reference
    basePrice: {
        First: {
            type: Number,
            default: 65000
        },
        Business: {
            type: Number,
            default: 45000
        },
        Economy: {
            type: Number,
            default: 6500
        }
    },
    status: {
        type: String,
        enum: ['scheduled', 'boarding', 'departed', 'cancelled', 'delayed'],
        default: 'scheduled'
    },
    image: {
        type: String
    }
}, { timestamps: true });

// One schedule per flight number per calendar departure day
flightSchema.index(
    { flightNumber: 1, 'departure.date': 1 },
    { unique: true }
);

module.exports = mongoose.model('Flight', flightSchema);
