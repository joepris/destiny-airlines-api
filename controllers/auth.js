const User = require("../models/User");
const auth = require("../auth");

function emailCheck(email, res) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).send({ message: "Invalid email format" });
    return false;
  }
  return email;
}

module.exports.checkEmailIfNotExist = (req, res, next) => {
  const email = emailCheck(req.body.email, res);
  if (!email) {
    return;
  }

  return User.find({ email })
    .then((result) => {
      if (result.length > 0) {
        return res.status(409).send({ message: "Email already registered" });
      }
      return res.status(200).send({ message: "No Duplicate Email Found" });
    })
    .catch(next);
};

module.exports.registerUser = (req, res, next) => {
  const { firstName, lastName, email: rawEmail, mobileNo, password } = req.body;

  const email = emailCheck(rawEmail, res);
  if (!email) {
    return;
  }

  if (!mobileNo || mobileNo.length !== 11) {
    return res.status(400).send({ message: "Mobile number is invalid" });
  }

  if (!password || password.length < 8) {
    return res
      .status(400)
      .send({ message: "Password must be atleast 8 characters long" });
  }

  return User.find({ email })
    .then((result) => {
      if (result.length > 0) {
        return res.status(409).send({ message: "Email already registered" });
      }

      let newUser = new User({
        firstName,
        lastName,
        email,
        mobileNo,
        password: bcrypt.hashSync(password, 10),
      });

      return newUser
        .save()
        .then((user) =>
          res.status(201).send({
            message: "User registered successfully",
            status: 201,
            user,
          }),
        )
        .catch(next);
    })
    .catch(next);
};

module.exports.loginUser = (req, res, next) => {
  const email = emailCheck(req.body.email, res);
  if (!email) {
    return;
  }

  return User.findOne({ email })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ message: "No email found" });
      }
      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        result.password,
      );
      if (isPasswordCorrect) {
        return res.status(200).send({
          message: "User logged in successfully",
          access: auth.createAccessToken(result),
          status: 200,
        });
      }
      return res.status(401).send({ message: "Incorrect email or password" });
    })
    .catch(next);
};

const bcrypt = require("bcrypt");

module.exports.resetPassword = async (req, res, next) => {
  const { newPassword } = req.body;
  const { id } = req.user;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  User.findByIdAndUpdate(id, { password: hashedPassword })
    .then((result) => {
      res.status(200).json({ message: "Password reset successfully" });
    })
    .catch(next);
};

module.exports.logoutUser = (req, res, next) => {};
