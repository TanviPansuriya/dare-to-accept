const cron = require('node-cron');
const Challenge = require('./models/Campaign');
const Participant = require('./models/Participant');
const { transitionToDispute, completeVoting } = require('./services/challengeService');
const { handleWinnerPayout } = require('./controllers/challengeParticipationController'); // Import handleWinnerPayout

// Cron Job 1: Run daily at 12:00 AM
cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date();
    const challenges = await Challenge.find({ endDate: { $lte: today }, status: 'active' });

    for (const challenge of challenges) {
      const activeParticipants = await Participant.find({ challenge: challenge._id, status: 'active' });

      if (activeParticipants.length === 1) {
        const winner = activeParticipants[0];
        await handleWinnerPayout(challenge._id, winner.user);

        challenge.status = 'Completed';
        await challenge.save();

        await Participant.updateOne(
          { challenge: challenge._id, user: winner.user },
          { $set: { status: 'winner', wonAt: new Date() } }
        );
      } else if (activeParticipants.length > 1) {
        await transitionToDispute(challenge);
      }
    }
  } catch (error) {
    console.error('Error in daily challenge lifecycle cron job:', error);
  }
});

// Cron Job 2: Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({ status: 'dispute' });

    for (const challenge of challenges) {
      // Ensure votingStartedAt is defined
      if (!challenge.votingStartedAt) {
        console.error(`Challenge ${challenge._id} is missing votingStartedAt`);
        continue; // Skip this challenge
      }

      // Calculate voting end time dynamically
      const votingEndsAt = new Date(challenge.votingStartedAt.getTime() + 48 * 60 * 60 * 1000);

      if (votingEndsAt <= now) {
        await completeVoting(challenge);
      }
    }
  } catch (error) {
    console.error('Error in dispute resolution cron job:', error);
  }
});