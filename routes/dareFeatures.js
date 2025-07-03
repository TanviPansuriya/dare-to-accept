const express = require('express');
const Campaign = require('../models/Campaign');

const router = express.Router();

// Add a dare suggestion
router.post('/:campaignId/dare', async (req, res) => {
  const { dare } = req.body;
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.milestones.push(dare);
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error adding dare', error });
  }
});

module.exports = router;
