const express = require('express');
const Update = require('../models/Update');
const Campaign = require('../models/Campaign');
const Participant = require('../models/Participant'); // Import the Participant model
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Add an update - only campaign owner or participants can add updates
router.post('/:campaignId', authMiddleware, async (req, res) => {
  const { title, content, images, videos } = req.body; // Accept media links from the request body
  try {
    // Check if the campaign exists
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Check if the user is either the campaign owner or a participant
    const isOwner = campaign.owner.toString() === req.user._id.toString();
    const isParticipant = await Participant.findOne({
      challenge: req.params.campaignId,
      user: req.user._id,
    });

    if (!isOwner && !isParticipant) {
      return res.status(403).json({ message: 'Unauthorized - only participants or the campaign owner can post updates' });
    }

    // Create and save the update
    const update = new Update({
      campaign: req.params.campaignId,
      title,
      content,
      createdBy: req.user._id, // Track who created the update
      images: images || [], // Save image links
      videos: videos || [], // Save video links
    });
    await update.save();
    console.log('Update added:', update);
    res.status(201).json(update);
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({ message: 'Error adding update', error });
  }
});

// Get updates for a campaign
router.get('/:campaignId', async (req, res) => {
  try {
    const updates = await Update.find({ campaign: req.params.campaignId });
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching updates', error });
  }
});

module.exports = router;