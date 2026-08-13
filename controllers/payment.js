const Payment = require('../models/Payment');
const { addFrequentFlyerPoints } = require("./user");

const VALID_PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

function generateRef(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
}

module.exports.getAllPayments = (req, res, next) => {

    return Payment.find()
    .then(result => res.status(200).send(result))
    .catch(next);
}

async function createPayment({ bookingId, userId, amount, method, session }) {
    const receiptNumber = generateRef("RCT");
    const paidAt = new Date();

    const [payment] = await Payment.create([{
        bookingId,
        userId,
        amount,
        method,
        status: "completed",
        receiptNumber,
        paidAt
    }], { session });

    if (method !== "miles") {
        await addFrequentFlyerPoints(userId, amount);
    }

    return payment;
}

module.exports.createPayment = createPayment;

module.exports.changePaymentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!VALID_PAYMENT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Use one of: ${VALID_PAYMENT_STATUSES.join(", ")}`
            });
        }

        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.status = status;
        if (status === 'completed' && !payment.paidAt) {
            payment.paidAt = new Date();
        }
        await payment.save();

        res.status(200).json({ success: true, message: 'Payment status updated successfully', data: payment });
    } catch (error) {
        next(error);
    }
}
