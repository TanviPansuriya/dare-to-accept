const express = require('express');
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { processWithdrawal } = require('../controllers/withdrawalController');
const CharityPayout = require('../models/CharityPayout');

const router = express.Router();

// Existing POST route for processing withdrawals
router.post(
  '/',
  authMiddleware,
  [
    check('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
    check('charityId', 'Charity ID is required').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Delegate to the controller
    processWithdrawal(req, res, next);
  }
);

// New routes
router.get('/pending', async (req, res) => {
  try {
    const pendingPayouts = await CharityPayout.find({ status: 'pending' });
    res.json(pendingPayouts);
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    res.status(500).json({ message: 'Error fetching pending payouts', error });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['sorted', 'rejected'];

  try {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const payout = await CharityPayout.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    res.json({ message: 'Payout status updated successfully', payout });
  } catch (error) {
    console.error('Error updating payout status:', error);
    res.status(500).json({ message: 'Error updating payout status', error });
  }
});

module.exports = router;