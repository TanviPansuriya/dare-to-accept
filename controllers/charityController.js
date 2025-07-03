const Charity = require('../models/Charity');

// Create a new charity (by challenge poster)
exports.createCharity = async (req, res) => {
  try {
    const {
      name,
      charity_number,
      country,
      address,
      website,
      bank_details,
      stripe_integration
    } = req.body;

    const charity = new Charity({
      name,
      charity_number,
      country,
      address,
      website,
      bank_details,
      stripe_integration,
      createdBy: req.user._id,
      approved: false // Admin must approve
    });

    await charity.save();
    res.status(201).json({ message: 'Charity submitted for approval', charity });
  } catch (error) {
    res.status(500).json({ message: 'Error creating charity', error });
  }
};

// Get all charities (optionally only approved)
exports.getCharities = async (req, res) => {
  try {
    const { approved } = req.query;
    const filter = typeof approved === 'undefined' ? {} : { approved: approved === 'true' };
    const charities = await Charity.find(filter);
    res.json(charities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching charities', error });
  }
};

// Approve a charity (admin only)
exports.approveCharity = async (req, res) => {
  try {
    const { charityId } = req.params;
    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: 'Charity not found' });
    charity.approved = true;
    await charity.save();
    res.json({ message: 'Charity approved', charity });
  } catch (error) {
    res.status(500).json({ message: 'Error approving charity', error });
  }
};

// Update charity details (admin or charity poster)
exports.updateCharity = async (req, res) => {
  try {
    const { charityId } = req.params;
    const updates = req.body;

    const charity = await Charity.findByIdAndUpdate(charityId, updates, { new: true });
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    res.json({ message: 'Charity updated successfully', charity });
  } catch (error) {
    res.status(500).json({ message: 'Error updating charity', error });
  }
};

// Get a single charity by ID
exports.getCharityById = async (req, res) => {
  try {
    const { charityId } = req.params;

    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: 'Charity not found' });

    res.json(charity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching charity', error });
  }
};

// Bulk create charities (admin only)
exports.bulkCreateCharities = async (req, res) => {
  try {
    const { charities } = req.body;

    // Validate input
    if (!Array.isArray(charities) || charities.length === 0) {
      return res.status(400).json({ message: 'Invalid input: charities must be a non-empty array' });
    }

    // Add defaults for required fields
    const charitiesWithDefaults = charities.map((charity) => ({
      ...charity,
      createdBy: req.user._id,
      approved: false,
      stripe_integration: {
        status: charity.stripe_integration?.status || false, // Default to false if missing
        notes: charity.stripe_integration?.notes || '', // Default to an empty string if missing
      },
      bank_details: charity.bank_details.map((bank) => ({
        ...bank,
        purpose: bank.purpose || 'General Donations', // Default purpose if missing
      })),
    }));

    // Insert charities into the database
    const createdCharities = await Charity.insertMany(charitiesWithDefaults);

    // Return success response
    res.status(201).json({ message: 'Charities created successfully', charities: createdCharities });
  } catch (error) {
    console.error('Error creating charities:', error);
    res.status(500).json({ message: 'Error creating charities', error: error.message });
  }
};