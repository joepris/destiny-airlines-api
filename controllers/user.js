const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports.getProfile = (req, res, next) => {
  return User.findById(req.user.id)
    .then((result) => {
      if (!result) {
        return res.status(404).send({ message: "User not found" });
      }
      return res.status(200).send(result);
    })
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
  return User.findById(req.params.id)
    .then((result) => {
      if (!result) {
        return res.status(404).send({ message: "User not found" });
      }
      return res.status(200).send(result);
    })
    .catch(next);
};

module.exports.getAllUsers = (req, res, next) => {
  const currentUser = req.user.id;
  return User.find()
    .then((users) => {
      const filtered = users.filter((user) => user._id !== currentUser);
      return res.status(200).send(filtered);
    })
    .catch(next);
};

module.exports.updateProfile = async (req, res, next) => {
  const userId = req.user.id;

  const { firstName, lastName, mobileNo } = req.body;

  User.findByIdAndUpdate(
    userId,
    { firstName, lastName, mobileNo },
    { new: true },
  )
    .then((updatedUser) => res.status(200).send(updatedUser))
    .catch(next);
};

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

module.exports.redeemFrequentFlyerPoints = async (userId, points, session) => {
  const query = User.findById(userId);
  if (session) query.session(session);

  const user = await query;
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const needed = Math.max(0, Math.round(Number(points) || 0));
  if (user.frequentFlyerPoints < needed) {
    const err = new Error("Not enough Destiny Guest Points for this booking.");
    err.statusCode = 400;
    throw err;
  }

  user.frequentFlyerPoints -= needed;
  await user.save(session ? { session } : undefined);
  return user.frequentFlyerPoints;
};

module.exports.getAllUsersByAdmin;
