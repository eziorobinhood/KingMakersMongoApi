const express = require('express');
const User = require('../models/userschema');

const authRouter = express.Router();

authRouter.post('/user/signup', async (req, res) => {
  // Signup logic here
  const { phnumber, name, dateofbirth, gender, occupation, upi_id } = req.body;
  const existingUser = await User.findOne({phnumber});
  if(existingUser){
    return res.status(400).json({ error: 'User with this phone number already exists' });
  }

  let user = new User({
    phnumber,
    name,
    dateofbirth,
    gender,
    occupation,
    upi_id
  });
  user = await user.save();
  res.json({user});
});


authRouter.get('/user/login', async (req, res) => {
  // Login logic here
  const phnumber = req.body.phnumber || req.query.phnumber;
  const existingUser = await User.findOne({phnumber});
    if(!existingUser){
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Login successful', user: existingUser });  
});


module.exports = authRouter;