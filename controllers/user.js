const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports.getProfile = (req, res, next) => {
    return User.findById(req.user.id)
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send(result);
    })
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
    return User.findById(req.params.id)
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "User not found" });
        }
        return res.status(200).send(result);
    })
    .catch(next);
};

module.exports.getAllUsers = (req, res, next) => {
    return User.find()
    .then(result => res.status(200).send(result))
    .catch(next);
};

module.exports.updateProfile = async (req, res, next) => {

    const userId = req.user.id;

    const { firstName, lastName, mobileNo } = req.body;

    User.findByIdAndUpdate(userId, { firstName, lastName, mobileNo }, { new: true })
    .then(updatedUser => res.status(200).send(updatedUser))
    .catch(next); 
}

module.exports.addFrequentFlyerPoints = async (userId, price) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    // base fare = (price - tax) * 5 per dollar spent is 5 points
    const pointsComputed = Math.round(price * 0.88 * 5);
    user.frequentFlyerPoints += pointsComputed;
    await user.save();
};