const Challenge = require('../models/Challenge');
const Participant = require('../models/Participant');
const Vote = require('../models/Vote');
const { handleWinnerPayout } = require('../controllers/challengeParticipationController');

exports.transitionToDispute = async (challenge) => {
  const now = new Date();
  challenge.status = 'Dispute';
  challenge.votingStartedAt = now;
  challenge.votingEndsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  await challenge.save();

  await Participant.updateMany(
    { challenge: challenge._id, status: 'active' },
    { $set: { status: 'disputed' } }
  );
};

exports.completeVoting = async (challenge) => {
  const votes = await Vote.find({ challenge: challenge._id }).populate('participant', 'user');
  const voteCounts = {};

  votes.forEach((vote) => {
    const participantId = vote.participant._id.toString();
    voteCounts[participantId] = (voteCounts[participantId] || 0) + 1;
  });

  const winnerId = Object.keys(voteCounts).reduce((a, b) => (voteCounts[a] > voteCounts[b] ? a : b), null);
  if (!winnerId) throw new Error('No votes found for challenge');

  const winner = await Participant.findById(winnerId);
  await handleWinnerPayout(challenge._id, winner.user);

  challenge.status = 'Completed';
  await challenge.save();

  await Participant.updateMany(
    { challenge: challenge._id },
    { $set: { status: 'lost' } }
  );
  await Participant.updateOne(
    { challenge: challenge._id, user: winner.user },
    { $set: { status: 'winner', wonAt: new Date() } }
  );
};