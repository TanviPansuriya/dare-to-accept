const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');

// exports.createCampaign = async (req, res) => {
//   try {
//     console.log('Creating campaign with body:', req.body);
//     const {
//       title,
//       description,
//       goal,
//       creatorDeposit,
//       category,
//       location,
//       image,
//       visibility,
//       charity,
//       mode,
//       status, // Ensure status is included
//       endDate, // Ensure endDate is included
//       milestones,
//       urgencyTag,
//       videoUrl,
//       galleryImages,
//       linkToCharity,
//     } = req.body;

//     // Validate required fields
//     if (!status || !endDate) {
//       return res.status(400).json({ message: 'Status and endDate are required.' });
//     }

//     const campaign = new Campaign({
//       title,
//       description,
//       goal,
//       creatorDeposit,
//       category,
//       location,
//       image,
//       visibility,
//       charity: {
//         name: charity?.name,
//         contactEmail: charity?.contactEmail,
//         charityId: charity?.charityId,
//       },
//       mode,
//       status, // Assign status
//       endDate, // Assign endDate
//       milestones: milestones || [],
//       urgencyTag,
//       videoUrl,
//       galleryImages,
//       linkToCharity,
//       owner: req.user._id,
//     });

//     await campaign.save();
//     res.status(201).json(campaign);
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating campaign', error });
//   }
// };

exports.approveCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = 'approved';
    await campaign.save();

    res.status(200).json({ message: 'Campaign approved successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: 'Error approving campaign', error });
  }
};

// Get campaigns by status
exports.getCampaignsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    // Validate status
    if (!['pending', 'approved', 'dispute', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Fetch campaigns by status
    const campaigns = await Campaign.find({ status });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns by status', error });
  }
};