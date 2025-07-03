const Participant = require('../models/Participant');
const Campaign = require('../models/Campaign');

exports.getAllParticipants = async (req, res) => {
  try {
    // Fetch all participants across all campaigns
    const participants = await Participant.find();
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants', error });
  }
};

exports.getParticipantsByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Validate campaign existence
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Fetch all participants associated with the campaign
    const participants = await Participant.find({ campaign: campaignId });
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants', error });
  }
};