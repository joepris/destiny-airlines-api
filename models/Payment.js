const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking ID is Required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is Required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is Required']
    },
    method: {
        type: String,
        enum: ['card', 'gcash', 'maya', 'bank', 'miles'],
        required: [true, 'Payment Method is Required']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    receiptNumber: {
        type: String,
        required: [true, 'Receipt Number is Required'],
        unique: true,
        uppercase: true
    },
    paidAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
