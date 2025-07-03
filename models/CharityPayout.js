const mongoose = require('mongoose');

const CharityPayoutSchema = new mongoose.Schema({
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  charityName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'sorted', 'rejected'], default: 'pending' },
  bankDetails: {
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    routing_number: { type: String, required: false },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CharityPayout', CharityPayoutSchema);