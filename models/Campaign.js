const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mode: { type: String, enum: ['who-dares', 'help-me-through'], required: true },
  creatorDeposit: { type: Number, required: true, default: 0 },
  milestones: [{ type: String }],
  urgencyTag: { type: String },
  goal: { type: Number, required: true },
  category: { type: String },
  subCategory: { type: String },
  location: { type: String },
  image: { type: String },
  galleryImages: [{ type: String }],
  linkToCharity: { type: String },
  charity: {
    name: { type: String },
    contactEmail: { type: String },
    charityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
  },
  ownerStripeAccountId: { type: String },
  paidOut: { type: Boolean, default: false },
  paidOutAt: { type: Date },
  videoUrl: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  raised: { type: Number, default: 0 },
  donors: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, default: 0 }
    }
  ],
  isWithdrawalRequested: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastDonation: {
    amount: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donationType: { type: String, enum: ['one-time', 'monthly'] },
    createdAt: { type: Date }
  },
  daysLeft: {
    type: Number,
    default: function () {
      if (!this.endDate) return null;
      const now = new Date();
      const end = new Date(this.endDate);
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
  },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'dispute'], }, // Required
  endDate: { type: Date},
});

module.exports = mongoose.model('Campaign', CampaignSchema);