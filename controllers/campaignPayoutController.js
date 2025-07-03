const Campaign = require('../models/Campaign');
const Donation = require('../models/DonationSchema');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Payout logic for campaigns (help-me-through mode):
 * - Only allow payout if campaign goal is reached and not already paid out.
 * - Send funds (minus 8% platform fee) to campaign creator's Stripe account.
 * - Mark campaign as paid out.
 */
exports.payoutCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId).populate('owner');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Only allow payout for help-me-through campaigns
    if (campaign.mode !== 'help-me-through') {
      return res.status(400).json({ message: 'Payout only allowed for help-me-through campaigns' });
    }

    // Check if already paid out
    if (campaign.paidOut) {
      return res.status(400).json({ message: 'Campaign already paid out' });
    }

    // Check if goal is reached
    if (campaign.raised < campaign.goal) {
      return res.status(400).json({ message: 'Campaign goal not reached yet' });
    }

    // Check if creator has a Stripe account
    const creator = campaign.owner;
    if (!creator.stripeAccountId) {
      return res.status(400).json({ message: 'Campaign creator has no Stripe account set up' });
    }

    // Calculate payout amount (minus 8%)
    const payoutAmount = Math.floor(campaign.raised * 0.92 * 100); // in cents

    // Send payout to creator's Stripe account
    await stripe.transfers.create({
      amount: payoutAmount,
      currency: 'usd',
      destination: creator.stripeAccountId,
      description: `Payout for campaign "${campaign.title}"`,
    });

    // Mark campaign as paid out
    campaign.paidOut = true;
    campaign.paidOutAt = new Date();
    await campaign.save();

    res.json({ message: 'Payout successful', payoutAmount: payoutAmount / 100, currency: 'usd' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payout', error });
  }
};