const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createChallenge } = require('../controllers/challengeCreationController');

// POST /api/challenges
router.post('/', authMiddleware, createChallenge);

module.exports = router;