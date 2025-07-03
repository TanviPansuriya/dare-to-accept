const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const registerUser = require('../utils/registerUser');
require('dotenv').config();

exports.signupUser = async (req, res) => { 
  
  const { name, email, password } = req.body;
  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }
    // Create a new user
    const { user, token } = await registerUser({ name, email, password });

    console.log('User signed up successfully:', user);

    res.status(201).json({ message: 'Signup successful', user, token });
  } catch (error) {
    console.error('Error signing up user:', error);
    // You can throw the error to be handled by the caller
    throw error;
  }
};
