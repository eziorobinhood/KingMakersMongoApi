const express = require('express');
const User = require('../models/userschema');
const bcrypt = require('bcryptjs');

const authRouter = express.Router();

authRouter.post('/user/signup', async (req, res) => {
  try {
    const { phnumber, name, password, dateofbirth, gender, occupation, upi_id, given_referral_code } = req.body;

    const existingUser = await User.findOne({ phnumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Notice: We pass the PLAIN password. The Schema will hash it for us!
    let user = new User({
      phnumber,
      name,
      password, 
      dateofbirth,
      gender,
      occupation,
      upi_id,
      given_referral_code,
      referral_code_generated: generateReferralCode(10)
    });

    user = await user.save();
    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

authRouter.delete('/user/delete', async (req, res) => {
  const phnumber = req.body.phnumber || req.query.phnumber;
  const user = await User.findOneAndDelete({ phnumber });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User deleted successfully' });
});

authRouter.post('/api/verify-otp', (req, res) => {
    // 1. Receive the automated URL sent from your React frontend
    const { user_json_url } = req.body;

    if (!user_json_url) {
        return res.status(400).json({ error: "Missing user_json_url" });
    }

    // 2. Your backend now fetches the actual user data from Phone.email
    https.get(user_json_url, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            try {
                const jsonData = JSON.parse(data);

                // 3. Extract the verified details
                const userData = {
                    countryCode: jsonData.user_country_code,
                    phoneNumber: jsonData.user_phone_number,
                    firstName: jsonData.user_first_name,
                    lastName: jsonData.user_last_name
                };

                console.log("Verified User:", userData);

                // 4. Handle your internal logic here (e.g., Save to DB or Create JWT)
                // res.cookie('token', 'your_generated_jwt_here'); 

                // Send success response back to React
                res.status(200).json({
                    success: true,
                    message: "Phone verified successfully",
                    user: userData
                });

            } catch (error) {
                res.status(500).json({ error: "Failed to parse user data" });
            }
        });

    }).on("error", (err) => {
        res.status(500).json({ error: "Request to Phone.email failed: " + err.message });
    });
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
            winner: leaderBoard[0], 
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


authRouter.post('/user/login', async (req, res) => {
  try {
    const { phnumber, password } = req.body;

    // 1. Find user by phone number
    const user = await User.findOne({ phnumber });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // 2. Compare input password with the stored hash
    if(user.password==null || user.password==undefined){
      return res.status(400).json({ error: 'Password not set for this user' });
    }

    if(user.password === password){
      return res.json({ message: 'Login successful', user });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // 3. Login success
    res.json({ message: 'Login successful', user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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