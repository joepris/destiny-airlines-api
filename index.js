const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const { errorHandler } = require("./auth");
require("dotenv").config();

const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const flightRoutes = require("./routes/flight");
const seatRoutes = require("./routes/seat");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");

const app = express();

const corsOptions = {
  origin: ['http://localhost:8000', "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors())

app.use(session({
  secret: process.env.CLIENT_SECRET,
  resave: false,
  saveUninitialized: false
}))

mongoose.connect(process.env.MONGODB_STRING);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", ()=> console.log("We're connected to the cloud database"));

app.use(express.json());
// app.use(express.urlencoded({extended:true}));

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/flights", flightRoutes);
app.use("/seats", seatRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use(errorHandler);

if(require.main == module){
  app.listen(process.env.PORT || 3000, () => console.log(`Server is running at port ${process.env.PORT || 3000}`));
}

module.exports = {app, mongoose}