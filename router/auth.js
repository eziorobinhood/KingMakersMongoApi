const express = require('express');
const User = require('../models/userschema');

const authRouter = express.Router();

authRouter.post('/user/signup', async (req, res) => {
  // Signup logic here
  const { phnumber, name, dateofbirth, gender, occupation, upi_id, given_referral_code } = req.body;
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
    upi_id,
    given_referral_code,
    referral_code_generated: generateReferralCode(10)
  });
  user = await user.save();
  res.json({user});
});

authRouter.get('/referral-leaderboard', async (req, res) => {
    try {
        // 1. Fetch all users from the database
        const allUsers = await User.find({});

        // 2. Create a map to store how many times each "generated code" was used
        // Key: the referral code, Value: count of users who used it
        const referralCounts = {};
        
        allUsers.forEach(user => {
            const usedCode = user.given_referral_code;
            if (usedCode && usedCode !== 'None') {
                referralCounts[usedCode] = (referralCounts[usedCode] || 0) + 1;
            }
        });

        // 3. Map the counts back to the original owners (the "Starters")
        const leaderBoard = allUsers.map(user => {
            const myCode = user.referral_code_generated;
            return {
                name: user.name,
                phone: user.phnumber,
                myReferralCode: myCode,
                totalReferrals: referralCounts[myCode] || 0 // How many people used THIS user's code
            };
        });

        // 4. Sort by highest referrals to find who gets the reward
        leaderBoard.sort((a, b) => b.totalReferrals - a.totalReferrals);

        res.status(200).json({
            status: "success",
            winner: leaderBoard[0], // Sri Shreya will be here with a count of 2
            fullList: leaderBoard
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

authRouter.get('/allusers', async (req, res) => {
  // Fetch all users logic here
  const users = await User.find();
  res.json({ users });
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


authRouter.post('/user/updatepayment', async (req, res) => {
  // Update payment details logic here
  const { upi_id, investedamount } = req.body;
  const user = await User.findOneAndUpdate(
    { upi_id },
    { $set: { investedamount } },
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ error: 'Enter valid UPI id' });
  }
  res.json({ message: 'Payment details updated successfully', user });
});


function generateReferralCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  for (let i = 0; i < length; i++) {
    referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return referralCode;
}

module.exports = authRouter;