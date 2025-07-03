const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  profileImage: { type: String, default: '' },
  status: { type: String, enum: ['active', 'out', 'disputed', 'winner', 'lost', 'pending'], default: 'active' },
  outAt: { type: Date },
  wonAt: { type: Date },
});



module.exports = mongoose.model('Participant', ParticipantSchema);