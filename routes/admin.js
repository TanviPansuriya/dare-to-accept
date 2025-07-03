const express = require('express');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Donation = require('../models/DonationSchema');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Middleware to check admin privileges
const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply both middlewares to all admin routes
router.use(authMiddleware, adminMiddleware);

// Get all campaigns (admin view)
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns', error });
  }
});

// Suspend a campaign
router.put('/campaigns/:id/suspend', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    campaign.suspended = true;
    await campaign.save();
    res.json({ message: 'Campaign suspended' });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending campaign', error });
  }
});

// Get total campaigns, challenges, users, and donations
router.get('/totals', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const totalChallenges = await Campaign.countDocuments({ mode: 'who-dares' });
    const totalUsers = await User.countDocuments();
    const totalDonations = await Donation.countDocuments();
    res.json({
      totalCampaigns,
      totalChallenges,
      totalUsers,
      totalDonations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching totals', error });
  }
});

module.exports = router;