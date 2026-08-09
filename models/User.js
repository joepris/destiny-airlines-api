const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First Name is Required']
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is Required']
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    mobileNo: {
        type: String,
        required: [true, 'Mobile Number is Required']
    },
    isFrequentFlyer: {
        type: Boolean,
        default: false
    },
    frequentFlyerPoints: {
        type: Number,
        default: 0
    },
    memberSince: {
        type: Date,
        default: Date.now
    },
    securityQuestions: [{
        question: {
            type: String,
            required: false
        },
        answer: {
            type: String,
            required: false
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
