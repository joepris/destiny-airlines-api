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
  const { firstName, lastName, email: rawEmail, mobileNo, password, securityQuestions } = req.body;

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

  if (!securityQuestions || securityQuestions.length < 2) {
    return res
      .status(400)
      .send({ message: "At least 2 security questions are required" });
  }

  return User.find({ email })
    .then((result) => {
      if (result.length > 0) {
        return res.status(409).send({ message: "Email already registered" });
      }

      const hashedSecurityQuestions = securityQuestions.map(sq => ({
        question: sq.question,
        answer: bcrypt.hashSync(sq.answer.toLowerCase().trim(), 10)
      }));

      let newUser = new User({
        firstName,
        lastName,
        email,
        mobileNo,
        password: bcrypt.hashSync(password, 10),
        securityQuestions: hashedSecurityQuestions
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

module.exports.getSecurityQuestions = async (req, res, next) => {
  try {
    const email = emailCheck(req.body.email, res);
    if (!email) {
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "No email found" });
    }

    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).send({ message: "No security questions set for this account" });
    }

    const questions = user.securityQuestions.map(sq => ({ question: sq.question }));
    return res.status(200).send({ questions });
  } catch (error) {
    next(error);
  }
};

module.exports.verifySecurityAnswers = async (req, res, next) => {
  try {
    const { email: rawEmail, answers } = req.body;
    
    const email = emailCheck(rawEmail, res);
    if (!email) {
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "No email found" });
    }

    if (!user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(400).send({ message: "No security questions set for this account" });
    }

    if (answers.length !== user.securityQuestions.length) {
      return res.status(400).send({ message: "All security questions must be answered" });
    }

    let allCorrect = true;
    for (let i = 0; i < answers.length; i++) {
      const isCorrect = bcrypt.compareSync(
        answers[i].toLowerCase().trim(),
        user.securityQuestions[i].answer
      );
      if (!isCorrect) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      const resetToken = auth.createAccessToken({ id: user._id, email: user.email, resetOnly: true });
      return res.status(200).send({ 
        message: "Security answers verified",
        resetToken 
      });
    } else {
      return res.status(401).send({ message: "Incorrect security answers" });
    }
  } catch (error) {
    next(error);
  }
};

module.exports.resetPasswordWithToken = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters long" });
    }

    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).send({ message: "Invalid or expired reset token" });
    }

    if (!decoded.resetOnly) {
      return res.status(401).send({ message: "Invalid reset token" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    return res.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

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
