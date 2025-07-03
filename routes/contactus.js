const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { fullName, email, inquiryType, subject, message } = req.body;

  if (!fullName || !email || !inquiryType || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Configure your transporter (use your real SMTP credentials in production)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${fullName}" <${email}>`,
      to: 'contact@daretoaccept.com',
      subject: `[Contact Form] ${subject} (${inquiryType})`,
      text: `
Full Name: ${fullName}
Email: ${email}
Nature of Inquiry: ${inquiryType}
Subject: ${subject}

Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Your message has been sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message.', error });
  }
});

module.exports = router;