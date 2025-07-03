const { processCharityPayout } = require('./withdrawal');
const Campaign = require('../models/Campaign');

exports.processWithdrawal = async (req, res, next) => {
  const { amount, charityId, challengeId } = req.body;

  try {
    // Use processCharityPayout for consistent payout logic
    const result = await processCharityPayout(charityId, amount);

    // Update the campaign to indicate a withdrawal request has been placed
    if (challengeId) {
      await Campaign.findByIdAndUpdate(
        challengeId,
        { isWithdrawalRequested: true },
        { new: true }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    next(error);
  }
};