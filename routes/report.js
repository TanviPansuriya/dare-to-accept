const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Report = require('../models/Report');

// Create a report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { campaign, reason, details } = req.body;
    const reporter = req.user._id;
    const report = new Report({ campaign, reporter, reason, details });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report', error });
  }
});

// Get all reports (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().populate('campaign reporter');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error });
  }
});

// Get a single report
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('campaign reporter');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error });
  }
});

// Update a report
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { reason, details, status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { reason, details, status },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error updating report', error });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report', error });
  }
});

module.exports = router;