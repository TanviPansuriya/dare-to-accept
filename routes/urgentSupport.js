const express = require('express');
const Campaign = require('../models/Campaign');
const router = express.Router();

// Add urgency tag to a campaign
router.post('/:campaignId/urgency', async (req, res, next) => {
  const { urgencyTag } = req.body;
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.urgencyTag = urgencyTag;
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
});

// Add celebration graphic
router.post('/:campaignId/celebration', async (req, res) => {
  const { graphicUrl } = req.body;
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.celebrationGraphic = graphicUrl;
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error adding celebration graphic', error });
  }
});

module.exports = router;