const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phnumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  dateofbirth: { type: String, required: true },
  gender: { type: String, required: true },
  occupation: { type: String, required: true },
  upi_id: { type: String, required: true, unique: true },
  investedamount: { type: Number, default: 0 },
  given_referral_code: { type: String,},
  referral_code_generated: { type: String, unique: true }
});

const User = mongoose.model('User', userSchema);
module.exports = User;