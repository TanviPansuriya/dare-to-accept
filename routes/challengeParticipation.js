const express = require('express');
const router = express.Router();

const { 
  joinChallenge,
  admitDefeat,
  disputeResult,
  confirmWinner,
  voteForWinner,
  getVotingStatus
} = require('../controllers/challengeParticipationController');

const authMiddleware = require('../middleware/authMiddleware');

// Join a challenge
router.post('/:challengeId/join', authMiddleware, joinChallenge);

// Admit defeat ("I'm Out")
router.post('/:challengeId/participants/:participantId/out', authMiddleware, admitDefeat);

// Dispute result (trigger voting)
router.post('/:challengeId/participants/:participantId/dispute', authMiddleware, disputeResult);

// Confirm winner (creator only)
router.post('/:challengeId/confirm-winner', authMiddleware, confirmWinner);

// Public voting for winner
router.post('/:challengeId/vote', authMiddleware, voteForWinner);

// Get voting status (timer, votes, etc.)
router.get('/:challengeId/voting-status', getVotingStatus);

module.exports = router;