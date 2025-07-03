const express = require('express');
const Comment = require('../models/Comment');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Add a comment
router.post(
  '/:campaignId',
  authMiddleware,
  [
    check('text', 'Comment text is required').notEmpty(),
    check('campaignId', 'Invalid campaign ID').isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    try {
      const comment = new Comment({
        campaign: req.params.campaignId,
        user: req.user._id,
        text,
      });
      await comment.save();
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: 'Error adding comment', error });
    }
  }
);

// Get comments for a campaign
router.get('/:campaignId', async (req, res) => {
  try {
    const comments = await Comment.find({ campaign: req.params.campaignId }).populate('user', 'name');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error });
  }
});

module.exports = router;