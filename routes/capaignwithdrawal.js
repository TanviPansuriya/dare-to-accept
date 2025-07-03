const express = require('express');
const router = express.Router();
const { processCharityPayout } = require('../controllers/withdrawalController');
const authMiddleware = require('../middleware/authMiddleware');
const Campaign = require('../models/Campaign');
const CampaignWithdrawal = require('../models/CampaignWithdrawal');

// Route to process campaign withdrawal for creator
router.post(
  '/',
  authMiddleware,
  async (req, res) => {
    const { amount, campaignId, bankDetails } = req.body;
    try {
      // Validate required fields
      if (!amount || !campaignId) {
        return res.status(400).json({ message: 'Amount and campaignId are required' });
      }

      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check if the user is the owner of the campaign
      if (campaign.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to withdraw from this campaign' });
      }

      // Calculate amount to be withdrawn after deducting platform fees of 8%
      const platformFee = amount * 0.08;
      const amountAfterFee = amount - platformFee;

      // Create a new withdrawal record
      const newWithdrawal = await CampaignWithdrawal.create({
        campaignName: campaign.name,
        description: campaign.description,
        owner: campaign.owner,
        amount: amountAfterFee,
        bankDetails: bankDetails || null,
        status: 'pending',
        campaignId,
      });

      // Save the updated campaign status
      campaign.status = 'completed';
      await campaign.save();

      res.status(201).json({
        message: 'Withdrawal request submitted successfully',
        withdrawal: newWithdrawal
      });
    } catch (error) {
      console.error('Error processing campaign withdrawal:', error);
      res.status(500).json({ message: 'Error processing campaign withdrawal', error });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const withdrawals = await CampaignWithdrawal.find()
    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({ message: 'No withdrawal requests found' }); 
    }
    
    // Return the list of withdrawals
    res.status(200).json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ message: 'Error fetching withdrawals', error });
  }
});

router.put('/update-withdrawal-request', async (req, res) => {
  const { withdrawalId, status } = req.body; 
  try {
    // Validate required fields
    if (!withdrawalId || !status) {
      return res.status(400).json({ message: 'Withdrawal ID and status are required' });
    }

    // Find the withdrawal request
    const withdrawal = await CampaignWithdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    // Update the status of the withdrawal request
    withdrawal.status = status;
    await withdrawal.save();

    res.status(200).json({
      message: 'Withdrawal request updated successfully',
      withdrawal
    });

  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    res.status(500).json({ message: 'Error updating withdrawal request', error });
  }
});


module.exports = router;
