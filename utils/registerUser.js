const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const registerUser = async ({ name, email, password }) => {
  // Create new user
  const user = new User({ name, email, password });
  await user.save();

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  // Send welcome email
  const transporter = nodemailer.createTransport({
    // Example for Gmail, replace with your SMTP config
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('Sending welcome email to:', user.email);
  await transporter.sendMail({
    to: email,
    subject: 'Welcome to Dare to Accept',
    html: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to Dare to Accept</title>
      </head>
      <body
        style="
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #007bff;
          color: #000;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            text-align: center;
          "
        >
          <img
            src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579370/Logo_1_gtmxnr.avif"
            alt="Dare to Accept Logo"
            style="max-width: 150px; margin-bottom: 10px"
          />

          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px">
            Welcome to Dare to Accept, ${name}!
          </h1>

          <img
            src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579394/charity-challenge-participants_lcsbwk.avif"
            alt="People running"
            style="width: 100%; height: auto; margin-bottom: 20px"
          />

          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px">
            You’re in. Let’s shake things up.
          </h2>

          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px">
      You just joined Dare to Accept — and trust us, it’s not your average platform.
    This is where the brave show up, and the driven stand out.

    Ready to begin? You’re exactly where you’re meant to be.
          </p>

          <a
            href="https://www.daretoaccept.com"
            style="
              display: inline-block;
              padding: 15px 25px;
              background-color: #007bff;
              color: #ffffff;
              text-decoration: none;
              border-radius: 10px;
              font-size: 18px;
              margin-top: 20px;
            "
          >
            Let’s Get started
          </a>
        </div>

        <div style="text-align: center; padding: 20px 0">
          <a href="#" style="margin: 0 10px">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
              alt="Facebook"
              width="30"
            />
          </a>
          <a href="#" style="margin: 0 10px">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/6/60/Twitter_Logo_as_of_2021.svg"
              alt="Twitter"
              width="30"
            />
          </a>
          <a href="#" style="margin: 0 10px">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
              alt="Instagram"
              width="30"
            />
          </a>
          <a href="#" style="margin: 0 10px">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_square_%282017%29.svg"
              alt="YouTube"
              width="30"
            />
          </a>
        </div>
      </body>
    </html>
    `
  });

  return { user, token };
};

module.exports = registerUser;
