const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    flightId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    seatNumber: { 
        type: String, 
        required: true 
    },
    classType: { 
        type: String, 
        enum: ['First', 'Business', 'Economy'], 
        required: true 
    },
    isBooked: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

seatSchema.index({ flightId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
