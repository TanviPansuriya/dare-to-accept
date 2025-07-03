const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  images: [
    {
      link: { type: String },
    },
  ],
  videos: [
    {
      link: { type: String }, 
    },
  ],
});

module.exports = mongoose.model('Update', UpdateSchema);