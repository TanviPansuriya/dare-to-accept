const Challenge = require('../models/Campaign');
const Participant = require('../models/Participant');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Donation = require('../models/DonationSchema');
const { createPaymentIntent } = require('../utils/stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Campaign = require('../models/Campaign');
const Charity = require('../models/Charity');
const { processCharityPayout } = require('./withdrawal');

// Join a challenge
exports.joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user._id;
    const { amount, paymentMethodId } = req.body; // amount and Stripe payment method

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.status !== 'approved') return res.status(400).json({ message: 'Challenge not open for joining' });

    // Validate participant status
    if (await isParticipant(challengeId, userId)) {
      return res.status(400).json({ message: 'Already joined' });
    }

    // Process payment via Stripe
    const paymentIntent = await createPaymentIntent(amount * 100, 'usd');

    // // Save donation record
    // const donation = new Donation({
    //   user: userId,
    //   campaign: challengeId,
    //   amount,
    // });
    // await donation.save();

    // Add participant
    const participant = new Participant({ challenge: challengeId, user: userId, status: 'active', userName: req.user.name, profileImage: req.user.profileImage });
    await participant.save();

    // challenge.raised = Number(challenge.raised) + Number(amount);
    // await challenge.save();

    res.status(201).json({ message: 'Joined challenge', participant, paymentIntentClientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: 'Error joining challenge', error });
    console.error('Error joining challenge:', error);
  }
};

// Admit defeat ("I'm Out")
exports.admitDefeat = async (req, res) => {
  try {
    const { challengeId, participantId } = req.params;
    const userId = req.user._id;

    const participant = await Participant.findById(participantId);
    if (!participant || participant.challenge.toString() !== challengeId) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    if (participant.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not your participant record' });
    }
    if (participant.status !== 'active') {
      return res.status(400).json({ message: 'Cannot admit defeat in current status' });
    }

    participant.status = 'out';
    participant.outAt = new Date();
    await participant.save();

    // Check if only one participant remains
    const activeCount = await Participant.countDocuments({ challenge: challengeId, status: 'active' });
    if (activeCount === 1) {
      // Auto-win logic
      const winner = await Participant.findOne({ challenge: challengeId, status: 'active' });
      await handleWinnerPayout(challengeId, winner.user);
    }

    res.json({ message: "You've admitted defeat", participant });
  } catch (error) {
    res.status(500).json({ message: 'Error admitting defeat', error });
  }
};

// Dispute result (trigger voting)
exports.disputeResult = async (req, res) => {
  try {
    const { challengeId, participantId } = req.params;
    const userId = req.user._id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const participant = await Participant.findById(participantId);
    if (!participant || participant.user.toString() !== userId.toString()) {
      console.error('Participant not found or not authorized');
      return res.status(404).json({ message: 'Participant not found or not authorized' });
    }

    if (challenge.status !== 'completed' && challenge.status !== 'dispute') {
      challenge.status = 'dispute';
      challenge.votingStartedAt = new Date();
      challenge.votingEndsAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
      await challenge.save();
    }

    participant.status = 'dispute';
    await participant.save();

    console.log(`Dispute triggered for challenge ${challengeId} by participant ${participantId}`);
    // Notify participants and users (optional, e.g., via WebSocket or email)
    res.json({ message: 'Dispute triggered, voting started', challenge });
  } catch (error) {
    console.error('Error triggering dispute:', error);
    res.status(500).json({ message: 'Error triggering dispute', error });
  }
};

// Confirm winner (creator only)
exports.confirmWinner = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { winnerParticipantId } = req.body;
    const userId = req.user._id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only creator can confirm winner' });
    }

    const winner = await Participant.findById(winnerParticipantId);
    if (!winner || winner.challenge.toString() !== challengeId) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    await handleWinnerPayout(challengeId, winner.user);

    res.json({ message: 'Winner confirmed and payout processed', winner });
  } catch (error) {
    console.error('Error confirming winner:', error);
    res.status(500).json({ message: 'Error confirming winner', error });
  }
};

// Public voting for winner
exports.voteForWinner = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { votedParticipantId } = req.body;
    const userId = req.user._id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge || challenge.status !== 'dispute') {
      return res.status(400).json({ message: 'Voting not open' });
    }

    // One vote per user per challenge
    const existingVote = await Vote.findOne({ challenge: challengeId, user: userId });
    if (existingVote) {
      return res.status(400).json({ message: 'Already voted' });
    }

    const participant = await Participant.findById(votedParticipantId);
    if (!participant || participant.challenge.toString() !== challengeId) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const vote = new Vote({ challenge: challengeId, user: userId, participant: votedParticipantId });
    await vote.save();

    res.json({ message: 'Vote recorded', vote });
  } catch (error) {
    res.status(500).json({ message: 'Error voting', error });
  }
};

// Get voting status (timer, votes, etc.)
exports.getVotingStatus = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const now = new Date();
    let votingOpen = false;
    let timeLeft = 0;
    if (challenge.status === 'dispute' && challenge.votingEndsAt) {
      votingOpen = now < challenge.votingEndsAt;
      timeLeft = Math.max(0, challenge.votingEndsAt - now);
    }

    const votes = await Vote.find({ challenge: challengeId }).populate('participant', 'user');
    const voteCounts = {};
    votes.forEach(v => {
      const pid = v.participant._id.toString();
      voteCounts[pid] = (voteCounts[pid] || 0) + 1;
    });

    res.json({
      votingOpen,
      timeLeftMs: timeLeft,
      voteCounts,
      endsAt: challenge.votingEndsAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching voting status', error });
  }
};

// Helper: Handle payout and status updates
async function handleWinnerPayout(challengeId, winnerUserId) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  // Mark challenge as completed
  challenge.status = 'completed';
  challenge.winner = winnerUserId;
  await challenge.save();

  // Mark winner participant
  await Participant.updateMany(
    { challenge: challengeId },
    { $set: { status: 'lost' } }
  );
  await Participant.updateOne(
    { challenge: challengeId, user: winnerUserId },
    { $set: { status: 'winner', wonAt: new Date() } }
  );

  // Payout to charity (minus 8%)
  const payoutAmount = Math.floor(challenge.raised * 0.92); // Amount in dollars

  // Use processCharityPayout to handle Stripe Connect account creation and payout
  if (!challenge.linkToCharity) {
    throw new Error('No charity set for this challenge');
  }

  const charity = await Charity.findById(challenge.linkToCharity);
  if (!charity) {
    throw new Error('Charity not found for this challenge');
  }

  await processCharityPayout(charity._id, payoutAmount);
}

exports.getParticipantsByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Validate campaign existence
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Fetch participants associated with the campaign
    const participants = await Participant.find({ campaign: campaignId });
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants', error });
  }
};

exports.getAllParticipants = async (req, res) => {
  try {
    // Fetch all participants across all campaigns
    const participants = await Participant.find();
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching participants', error });
  }
};

async function isParticipant(challengeId, userId) {
  const participant = await Participant.findOne({ challenge: challengeId, user: userId });
  return !!participant; // Returns true if the user is already a participant
}