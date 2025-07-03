const mongoose = require('mongoose');

const BankDetailsSchema = new mongoose.Schema({
  bank_name: { type: String, required: true },
  branch: { type: String, required: false },
  account_name: { type: String, required: true },
  account_number: { type: String, required: true },
  sort_code: { type: String, required: false }, // UK only
  bsb: { type: String, required: false },       // AU only
  iban: { type: String, required: false },
  bic_swift: { type: String, required: false },
  routing_number: { type: String, required: false }, // US only
  account_type: { type: String, required: false },   // e.g., Checking, Savings
  reference: { type: String, required: false },
  purpose: { type: String, required: true }          // e.g., General Donations, Zakat, etc.
});

const CharitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  charity_number: { type: String, required: false },
  country: { type: String, required: true },
  address: { type: String, required: false },
  website: { type: String, required: true },
  bank_details: { type: [BankDetailsSchema], required: true },
  stripe_integration: {
    status: { type: Boolean, required: true },
    notes: { type: String, required: false }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Charity', CharitySchema);