const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/authMiddleware');
const { signupUser } = require('../controllers/auth');

router.post('/signup', signupUser);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log(token);

    // Send email (configure transporter for your SMTP)
    const transporter = nodemailer.createTransport({
      // Example for Gmail, replace with your SMTP config
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });     

    const resetUrl = `https://www.daretoaccept.com/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetUrl}`,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email', error });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error });
  }
})

// Update user profile (name, profile image, etc.)
router.put('/update/me', authMiddleware, async (req, res) => {
  try {
    const { name, profileImage, ...otherFields } = req.body;

    // Prevent email update
    if ('email' in req.body) {
      return res.status(400).json({ message: 'Email cannot be updated.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, profileImage, ...otherFields },
      { new: true }
    ).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

// Change password (requires authentication)
router.put('/me/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error });
  }
});

module.exports = router;