const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
  createdAt: { type: Date, default: Date.now },
  // endDate: {
  //   type: Date,
  //   default: function () {
  //     const created = this.createdAt || new Date();
  //     return new Date(created.getTime() + 48 * 60 * 60 * 1000);
  //   }
  // }
});

module.exports = mongoose.model('Vote', VoteSchema);