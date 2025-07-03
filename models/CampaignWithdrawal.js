const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CampaignWithdrawalSchema = new Schema({
    campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    bankDetails: {
        bank_name: { type: String, required: true },
        account_name: { type: String, required: true },
        account_number: { type: String, required: true },
        routing_number: { type: String, required: false },
        iBAN: { type: String, required: false }, 
    },
    status: {
        type: String,
        enum: ['pending', 'Approved', 'rejected', 'sorted'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('CampaignWithdrawal', CampaignWithdrawalSchema);