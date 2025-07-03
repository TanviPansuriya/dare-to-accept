const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createCharity, getCharities, approveCharity, bulkCreateCharities } = require('../controllers/charityController');

// Create a new charity (challenge poster)
router.post('/', authMiddleware, createCharity);

// Get all charities (optionally filter by approval)
router.get('/', getCharities);

// Approve a charity (admin only)
router.put('/:charityId/approve', authMiddleware, async (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  return approveCharity(req, res);
});

// Bulk create charities
router.post('/bulk', authMiddleware, bulkCreateCharities);

module.exports = router;