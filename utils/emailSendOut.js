require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async ({ subject, to, html }) => {
     const transporter = nodemailer.createTransport({
        // Example for Gmail, replace with your SMTP config
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    await transporter.sendMail({
        to,
        subject,
        html,
    });
}

exports.sendEmailnotification = async ({ participantData, heading, content }) => {
    try {
        const { user, name, email, profileImage, type } = participantData;

        if (!email) {
            throw new Error('Email is required to send notification');
        }

        // Send the email using your preferred email service
        await sendEmail({
            to: email,
            subject: heading,
            html: content,
            from: process.env.EMAIL_User,
        });

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email notification');
    }
}