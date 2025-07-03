const CharityPayout = require('../models/CharityPayout');
const Charity = require('../models/Charity');

async function processCharityPayout(charityId, amount) {
  try {
    console.log(`Processing payout for charityId: ${charityId}`); // Debug log

    // Fetch the charity from the database
    const charity = await Charity.findById(charityId);
    if (!charity) {
      console.error(`Charity not found for ID: ${charityId}`); // Debug log
      throw new Error('Charity not found');
    }

    // Extract bank details
    const bankDetails = charity.bank_details[0];
    if (!bankDetails) {
      throw new Error('Bank details not found for the charity');
    }

    // Create a new CharityPayout document
    const charityPayout = new CharityPayout({
      charity: charity._id,
      charityName: charity.name,
      amount,
      status: 'pending',
      bankDetails: {
        bank_name: bankDetails.bank_name,
        account_number: bankDetails.account_number,
        routing_number: bankDetails.routing_number,
      },
      createdAt: new Date(),
    });

    // Save the payout request to the database
    await charityPayout.save();

    return {
      message: 'Withdrawal request saved as pending',
    };
  } catch (error) {
    console.error('Error processing charity payout:', error);
    throw new Error('Failed to process charity payout');
  }
}

module.exports = { processCharityPayout };