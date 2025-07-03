const express = require('express');
const { createPaymentIntent } = require('../utils/stripe');
const Campaign = require('../models/Campaign');
const Donation = require('../models/DonationSchema');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');
require('dotenv').config();
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Create a donation (one-time)
router.post('/one-time', async (req, res) => {
  const { campaignId, amount } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // 1️⃣  Build the request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toString(),
          },
          description: campaign.title.substring(0, 127),
        },
      ],
      application_context: {
        brand_name: 'Dare to Accept',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/success?campaignId=${campaign._id}`, // no orderId yet
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      },
    });

    // 2️⃣  Create the order
    const order = await client.execute(request);

    // 3️⃣  Extract approval link + orderId
    const approvalUrl = order.result.links.find(
      (link) => link.rel === 'approve'
    )?.href;

    // Send both back so the front end knows the id
    res.json({ url: approvalUrl, orderId: order.result.id });
  } catch (error) {
    console.error('PayPal Order Error:', error);
    res
      .status(500)
      .json({ message: 'Error creating PayPal order', error: error.message });
  }
});


router.post('/paypal/capture', async (req, res) => {
  const { orderID } = req.body;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client.execute(request);

    // You can log or store capture.result in your database
    console.log("Payment Captured:", capture.result);

    res.json({ success: true, capture: capture.result });
  } catch (error) {
    console.error("PayPal Capture Error:", error);
    res.status(500).json({ success: false, message: "Failed to capture order", error: error.message });
  }
});


router.post('/saveCampaignDonorData', async (req, res) => {
  const { campaignId, userId, amount } = req.body;

  try {
    if (!campaignId || !userId || !amount) {
      return res.status(400).json({ message: 'Campaign ID, User ID, and amount are required' });
    }

    console.log('Saving donation data:', { campaignId, userId, amount });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Create and save the donation
    const donation = new Donation({
      user: userId,
      campaign: campaignId,
      amount
    });
    
    await donation.save();

    // Update raised amount
    campaign.raised = Number(campaign.raised) + Number(amount);

    // Update donor info
    const donorIndex = campaign.donors.findIndex(
      d => d.user.toString() === userId.toString()
    );

    if (donorIndex > -1) {
      // Donor exists, update amount
      campaign.donors[donorIndex].amount += Number(amount);
    } else {
      // Add new donor
      campaign.donors.push({
        user: new mongoose.Types.ObjectId(userId),
        amount: Number(amount)
      });
    }

    // Save campaign once
    await campaign.save();

    res.status(201).json({ message: 'Donation saved', donation });

  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).json({ message: 'Error saving donation', error });
  }
});

// Get all donors for a campaign with their total donated amount
router.get('/campaign/:campaignId/donors', async (req, res) => {
  try {
    const campaignId = req.params.campaignId;
    const campaign = await Campaign.findById(campaignId).populate('donors.user', 'name email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    res.json(campaign.donors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donors', error });
  }
});

module.exports = router;