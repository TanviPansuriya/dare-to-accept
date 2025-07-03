const express = require('express');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/DonationSchema');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Get user profile with campaigns and donation history
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user info (excluding sensitive fields)
    const user = await User.findById(userId).select('-password');

    // Get all campaigns created by the user
    const campaigns = await Campaign.find({ owner: userId });

    // Get all donations made by the user, populate campaign info
    const donations = await Donation.find({ user: userId }).populate('campaign', 'title goal raised status');

    res.json({
      user,
      campaigns,
      donations           
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error });
  }
});

router.get('/all', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

module.exports = router;