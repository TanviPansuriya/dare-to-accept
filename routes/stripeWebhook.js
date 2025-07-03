// routes/stripeWebhook.js
const express = require('express');
const Challenge = require('../models/Challenge');
const Donation = require('../models/DonationSchema');
const Participant = require('../models/Participant');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Raw body for Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.metadata?.type === 'join_challenge') {
      const { challengeId, userId, amount } = session.metadata;

      try {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) return;

        // Prevent duplicates
        const existingParticipant = await Participant.findOne({ challenge: challengeId, user: userId });
        if (existingParticipant) return;

        // Save donation
        const donation = new Donation({
          user: userId,
          campaign: challengeId,
          amount: parseFloat(amount),
        });
        await donation.save();

        // Add participant
        const participant = new Participant({
          challenge: challengeId,
          user: userId,
          status: 'active',
        });
        await participant.save();

        challenge.participants.push(participant._id);
        challenge.raised += parseFloat(amount);
        await challenge.save();

        console.log(`✅ Challenge joined: user ${userId} in challenge ${challengeId}`);
      } catch (error) {
        console.error('Error processing challenge join in webhook:', error);
      }
    }
  }

  res.status(200).send();
});

module.exports = router;