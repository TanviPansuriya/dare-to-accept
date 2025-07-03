const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all participants for a specific campaign
router.get('/campaigns/:campaignId/participants', authMiddleware , participantController.getParticipantsByCampaign);

// Get all participants across all campaigns
router.get('/participants', participantController.getAllParticipants);

module.exports = router;