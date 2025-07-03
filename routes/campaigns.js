const express = require('express');
const Campaign = require('../models/Campaign');
const authMiddleware = require('../middleware/authMiddleware');
const registerUser = require('../utils/registerUser');
const User = require('../models/User');
const Donation = require('../models/DonationSchema');
const { payoutCampaign } = require('../controllers/campaignPayoutController');
const { getCampaignsByStatus } = require('../controllers/campaignController');
const Participant = require('../models/Participant');
const { sendEmailnotification } = require('../utils/emailSendOut');
const { signupUser } = require('../controllers/auth');
const router = express.Router();
const crypto = require('crypto');

// Create a new campaign
router.post('/', authMiddleware, async (req, res) => {
  try {
    let newUser;
    let createdUser;
    const {
      title,
      description,
      mode,
      goal,
      milestones,
      urgencyTag,
      category,
      subCategory,
      location,
      image,
      galleryImages,
      linkToCharity,
      videoUrl,
      visibility,
      status,
      endDate,
      participants,
    } = req.body;

    // Validate required fields
    if (!title || !description || !goal || !mode || !status || !endDate) {
      return res.status(400).json({ message: 'Title, description, goal, mode, status, and endDate are required' });
    }

    if (mode === 'who-dares' && participants && !Array.isArray(participants) && category !== 'GroupChallenge') {
      return res.status(400).json({ message: 'Participants must be an array' });
    }

    // First create and save the campaign
    const campaign = new Campaign({
      title,
      description,
      mode,
      goal,
      milestones,
      urgencyTag,
      category,
      subCategory,
      location,
      image,
      galleryImages,
      linkToCharity,
      videoUrl,
      visibility,
      owner: req.user._id,
      status,
      endDate,
    });

    await campaign.save();

    const resetUrl = `https://www.daretoaccept.com/who-dares/${campaign._id}`;

    // Add participants if any
    if (participants && participants.length > 0) {
      for (const participant of participants) {
        const { email } = participant;
        if (!email) continue;

        const user = await User.find({ email });

        // If user does not exist, create a new user
        const token = crypto.randomBytes(32).toString('hex');

        if (user.length === 0) {

          const { user: created, token: generatedToken } = await registerUser({
            name: participant.name || 'Anonymous',
            email,
            password: token,
          });

          createdUser = [created];
          newUser = true;
        }

        const participantData = {
          user: user.length > 0 ? user[0]._id : createdUser[0]._id,
          name: participant.name || 'Anonymous',
          email: email,
          profileImage: participant.profileImage || '',
          password: createdUser ? createdUser[0].password : token, // Use the created user's password or a generated token
        };

        // Notify the participant
        if (newUser) {
          await sendEmailnotification({
            participantData,
            heading: 'Dare To Accept, You have been added to a new campaign',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New User New Campaign Invite</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #007bff;
      font-family: Arial, sans-serif;
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
      <!-- Logo -->
      <img
        src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579370/Logo_1_gtmxnr.avif"
        alt="Dare to Accept Logo"
        style="max-width: 120px; margin-bottom: 20px"
      />
      <!-- Heading -->
      <h1 style="font-size: 22px; font-weight: bold; margin-bottom: 20px">
        You’ve just been added to a new campaign!
      </h1>
      <!-- Confetti Icon -->
      <img
        src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750580187/download__86_-removebg-preview_1_c2jm4g.png"
        alt="Confetti Celebration"
        style="width: 100px; height: auto; margin-bottom: 20px"
      />
      <!-- Body Text -->
      <p
        style="
          font-size: 16px;
          line-height: 1.6;
          color: #000000;
          margin-bottom: 10px;
        "
      >
        You’ve just been added to a new campaign!<br />
        You’ve been dared to accept: <strong>${title}</strong><br />
        Let’s see what you’re made of.
      </p>
      <p
        style="
          font-size: 15px;
          line-height: 1.6;
          color: #000000;
          margin-top: 20px;
        "
      >
        Use the credentials below to log in and join the challenge
      </p>
      <!-- Credentials -->
      <p
        style="
          font-size: 14px;
          line-height: 1.5;
          word-break: break-all;
          color: #000000;
        "
      >
        <strong>Email:</strong> ${participantData.email}<br />
        <strong>Password:</strong><br />
        ${participantData.password || 'Your Password'}
      </p>
      <!-- Button -->
      <a
        href="${resetUrl}"
        style="
          display: inline-block;
          margin-top: 30px;
          padding: 15px 30px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
        "
      >
        JOIN THE CHALLENGE NOW
      </a>
    </div>
    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0">
      <a href="#" style="margin: 0 10px">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg
"
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
          src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_square_%28
2017%29.svg"
          alt="YouTube"
          width="30"
        />
      </a>
    </div>
  </body>
</html>`,
            type: 'newUser',
          });
        } else {
          await sendEmailnotification({
            participantData,
            heading: 'You have been added to a new campaign',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You've been added to a new campaign!</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #007bff;
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
      <!-- Logo -->
      <img
        src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579370/Logo_1_gtmxnr.avif"
        alt="Dare to Accept Logo"
        style="max-width: 120px; margin-bottom: 20px"
      />
      <!-- Heading -->
      <h1
        style="
          font-size: 22px;
          color: #000000;
          font-weight: bold;
          margin-bottom: 20px;
        "
      >
        You’ve just been added to a new campaign!
      </h1>
      <!-- Confetti image -->
      <img
        src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750580187/download__86_-removebg-preview_1_c2jm4g.png"
        alt="Celebration Confetti"
        style="width: 100px; height: auto; margin-bottom: 20px"
      />
      <!-- Campaign text -->
      <p
        style="
          font-size: 16px;
          color: #000000;
          line-height: 1.6;
          margin: 0 0 10px;
        "
      >
        You’ve just been added to a new campaign!<br />
        You’ve been dared to accept: <strong>${title}</strong><br />
        Let’s see what you’re made of.
      </p>
      <!-- Instructions -->
      <p
        style="
          font-size: 15px;
          color: #000000;
          line-height: 1.6;
          margin: 20px 0 10px;
        "
      >
        Use the credentials below to log in and join the challenge
      </p>
      <!-- Email Info -->
      <p style="font-size: 15px; color: #000000; line-height: 1.6">
        <strong>Email:</strong> ${email}<br />
      </p>
      <!-- CTA Button -->
      <a
        href="${resetUrl}"
        style="
          display: inline-block;
          padding: 15px 30px;
          margin-top: 30px;
          background-color: #007bff;
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          text-decoration: none;
          border-radius: 10px;
        "
      >
        JOIN THE CHALLENGE NOW
      </a>
    </div>
    <!-- Footer Social Icons -->
    <div style="text-align: center; padding: 20px 0">
      <a href="#" style="margin: 0 10px">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg
"
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
          src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_square_%28
2017%29.svg"
          alt="YouTube"
          width="30"
        />
      </a>
    </div>
  </body>
</html>
`,
            type: 'existingUser',
          });
        }

        // Save participant record
        const newParticipant = new Participant({
          challenge: campaign._id,
          user: user.length > 0 ? user[0]._id : createdUser[0]._id,
          status: 'pending',
          userName: participantData.name,
          profileImage: participantData.profileImage
        });

        await newParticipant.save();
      }
    }

    //send notification to the campaign owner
    const campaignOwner = await User.findById(req.user._id);
    if (!campaignOwner) {
      return res.status(404).json({ message: 'Campaign owner not found' });
    }
    await sendEmailnotification({
      participantData: {
        user: campaignOwner._id,
        name: campaignOwner.name,
        email: campaignOwner.email,
      },
      heading: 'Dare To Accept, New Campaign Created',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Challenge Launch Email</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#ffffff; color:#000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background-color:#ffffff;">
    <tr>
      <td style="text-align:center; padding:20px;">
        <!-- Logo Heart -->
        <img src='https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579370/Logo_1_gtmxnr.avif' width="50" height="50" />
      </td>
    </tr>

    <tr>
      <td style="background:url('https://res.cloudinary.com/djdvsrjzs/image/upload/v1750902499/WhatsApp_Image_2025-06-26_at_02.24.55_9f8f0fc2_bjeyci.jpg') no-repeat center center; background-size:cover; height:200px; text-align:center; vertical-align:middle; color:white;">
        <h2 style="margin:0; font-size:24px; font-weight:bold;">YOUR CHALLENGE IS LIFE!</h2>
        <p style="font-size:16px;">TIME TO MAKE IT COUNT!</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px; text-align:center;">
        <p>Hi ${campaignOwner.name}, Congratulations! 🎉<br>
        You’ve just launched a new Campaign on DareToAccept.com and it’s officially live!</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px;">
        <table width="100%" cellpadding="10" cellspacing="0" border="1" style="border-collapse:collapse; text-align:left;">
          <tr><th colspan="2" style="text-align:center;">Campaign DETAILS</th></tr>
          <tr><td>Title:</td><td>${campaign.title}</td></tr>
          <tr><td>Goal:</td><td>${campaign.goal}</td></tr>
          <tr><td>End Date:</td><td>${Campaign.endDate}</td></tr>
        </table>
        <div style="text-align:center; margin-top:20px;">
          <a href="${resetUrl}" style="background-color:black; color:white; padding:10px 20px; text-decoration:none; border-radius:4px;">View Your Challenge</a>
        </div>
      </td>
    </tr>

    <tr>
      <td style="background-color:#d7f4f2; padding:20px; text-align:center;">
        <h3 style="margin:0 0 20px 0; color:#2b7a78;">NOW! IT’S TIME TO GET THE WORD OUT</h3>
        <table width="100%" cellpadding="10" cellspacing="0">
          <tr>
            <td style="text-align:center;">
              <!-- Share Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.02-4.11c.53.5 1.23.81 2.01.81 1.66 0 3-1.34 3-3S19.66 2 18 2s-3 1.34-3 3c0 .24.04.47.09.7L8.07 9.81C7.53 9.31 6.84 9 6.05 9 4.39 9 3.05 10.34 3.05 12s1.34 3 3 3c.79 0 1.48-.31 2.02-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
              <p>Share your challenge</p>
            </td>
            <td style="text-align:center;">
              <!-- Fire Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.243 2 7 5.029 7 8.5c0 1.912.86 3.63 2.218 4.714a5.51 5.51 0 00-.646 1.886C8.2 17.905 10.099 20 12.5 20s4.3-2.095 3.928-4.9c-.128-.96-.498-1.85-1.088-2.598A6.87 6.87 0 0017 8.5C17 5.029 14.757 2 12 2z"/></svg>
              <p>Dare with your friend!</p>
            </td>
            <td style="text-align:center;">
              <!-- Impact Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-1.85 0-3.536-.63-4.9-1.688l9.213-9.212C19.37 8.464 20 10.15 20 12c0 4.418-3.582 8-8 8zm-8-8c0-4.418 3.582-8 8-8 1.85 0 3.536.63 4.9 1.688L7.687 15.9C4.63 14.536 4 12.85 4 12z"/></svg>
              <p>Make a real impact.</p>
            </td>
          </tr>
        </table>
        <p style="font-size:14px; color:#555;">Remember: one bold move can change everything for you or for someone else!</p>
      </td>
    </tr>

    <tr>
      <td style="text-align:center; padding:20px;">
        <p style="margin-bottom:10px; font-weight:bold;">Ready to see who dares to accept?</p>
        <a href="#" style="background-color:black; color:white; padding:10px 20px; text-decoration:none; border-radius:4px;">View Your Challenge</a>
      </td>
    </tr>

    <tr>
      <td style="text-align:center; padding:20px;">
        <!-- Social Icons -->
        <a href="#" style="margin:0 5px;">
          <!-- TikTok -->
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1.92 5.36c.48.35.97.63 1.52.84V11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4c.14 0 .28.01.42.03v1.98c-.14-.02-.28-.03-.42-.03-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V6.86z"/></svg>
        </a>
        <a href="#" style="margin:0 5px;">
          <!-- YouTube -->
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6zm12-3c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"/></svg>
        </a>
        <a href="#" style="margin:0 5px;">
          <!-- Instagram -->
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2C4.79 2 3 3.79 3 6v12c0 2.21 1.79 4 4 4h10c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4H7zm5 4a5 5 0 110 10 5 5 0 010-10zm6.5-.5a1 1 0 110 2 1 1 0 010-2zM12 9a3 3 0 100 6 3 3 0 000-6z"/></svg>
        </a>
        <a href="#" style="margin:0 5px;">
          <!-- Facebook -->
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 5 3.66 9.13 8.44 9.88v-7H8v-3h2.44V9.5c0-2.42 1.45-3.76 3.66-3.76 1.06 0 2.17.19 2.17.19v2.4h-1.22c-1.2 0-1.57.75-1.57 1.52V12h2.67l-.43 3h-2.24v7C18.34 21.13 22 17 22 12z"/></svg>
        </a>
        <p style="font-size:12px; color:#888; margin-top:10px;"><a href="#" style="color:#888; text-decoration:underline;">unsubscribe</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (campaign.status === 'approved') {
      await sendEmailnotification({
        participantData: {
          name: "Cary G",
          email: "contact@daretoaccept.com",
        },
        heading: 'New Campaign Notification',
        content: `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Campaign Notification</title>
</head>

<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f6f8;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; text-align: center;">

    <!-- Logo -->
    <img src="https://res.cloudinary.com/djdvsrjzs/image/upload/v1750579370/Logo_1_gtmxnr.avif" alt="Dare to Accept Logo" style="height: 100px; margin-bottom: 30px;">

    <!-- Title -->
    <h2 style="font-size: 24px; color: #000; margin: 0 0 10px;">New Campaign</h2>

    <!-- Message -->
    <p style="font-size: 16px; color: #000; margin: 0 0 20px;">Hi Cary G,</p>
    <p style="font-size: 16px; color: #000; margin: 0 0 30px;">
      A new campaign has just been created. Would you like to check it out?
    </p>

    <!-- CTA Button -->
    <a href="${resetUrl}" style="display: inline-block; padding: 12px 25px; border: 2px solid #000; text-decoration: none; font-weight: bold; color: #000; border-radius: 4px;">CHECK CAMPAIGN</a>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px 10px; font-size: 12px; color: #555;">
    <!-- Social Icons -->
    <div style="margin-bottom: 10px;">
      <!-- Facebook -->
      <a href="#" style="margin: 0 10px;">
        <svg width="24" height="24" fill="black" viewBox="0 0 24 24">
          <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12z"/>
        </svg>
      </a>
      <!-- X (formerly Twitter) -->
      <a href="#" style="margin: 0 10px;">
        <svg width="24" height="24" fill="black" viewBox="0 0 24 24">
          <path d="M20.15 3H17.4l-4.28 6.32L8.74 3H3.5l6.67 9.64L3 21h2.77l5.03-7.43L15.5 21h5.2l-7.3-10.45L20.15 3z"/>
        </svg>
      </a>
      <!-- Instagram -->
      <a href="#" style="margin: 0 10px;">
        <svg width="24" height="24" fill="black" viewBox="0 0 24 24">
          <path d="M7 2C4.8 2 3 3.8 3 6v12c0 2.2 1.8 4 4 4h10c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4H7zm0 2h10c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
        </svg>
      </a>
    </div>

    <!-- Footer Text -->
    <p style="margin: 5px 0;">© 2025 Dare To Accept</p>
    <p><a href="#" style="color: #000; text-decoration: underline;">Unsubscribe here</a></p>
  </div>
</body>

</html>`,
      });
    };

    // success response
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error });
  }
});


// Helper to calculate days left
function getDaysLeft(endDate) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// get campaigns with pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const campaigns = await Campaign.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('owner', 'name email');
    // Add daysLeft to each campaign
    const campaignsWithDaysLeft = campaigns.map(c => ({
      ...c.toObject(),
      daysLeft: getDaysLeft(c.endDate)
    }));
    const total = await Campaign.countDocuments();
    res.json({ campaigns: campaignsWithDaysLeft, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns', error });
  }
});

// Get a campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('owner', 'name email');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    const campaignObj = campaign.toObject();
    campaignObj.daysLeft = getDaysLeft(campaign.endDate);
    res.json(campaignObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaign', error });
  }
});

// Get campaigns by mode
router.get('/mode/:mode', async (req, res) => {
  try {
    const { mode } = req.params;
    const campaigns = await Campaign.find({ mode, status: 'approved' });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns by mode', error });
  }
});

// Update a campaign
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    Object.assign(campaign, req.body);

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Error updating campaign', error });
  }
});



// Delete a campaign
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // if (campaign.owner.toString() !== req.user._id.toString()  && !req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      message: 'Error deleting campaign',
      error: error.message || error.toString(),
    });
  }
});


// Get total campaigns, challenges, users, and donations
router.get('/totals', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments();
    const totalChallenges = await Campaign.countDocuments({ mode: 'who-dares' });
    const totalUsers = await User.countDocuments();
    const totalDonations = await Donation.countDocuments();
    res.json({
      totalCampaigns,
      totalChallenges,
      totalUsers,
      totalDonations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching totals', error });
  }
});

// Get all deposits/donations for a campaign or challenge
router.get('/:id/donations', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const donations = await Donation.find({ campaign: campaign._id }).populate('user', 'name email');
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error });
  }
});

// Payout endpoint for campaigns (admin or campaign owner)
router.post('/:campaignId/payout', authMiddleware, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Only campaign owner or admin can trigger payout
    if (
      campaign.owner.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delegate to controller
    return payoutCampaign(req, res);
  } catch (error) {
    next(error);
  }
});

// GET /campaigns/status/:status
router.get('/status/:status', getCampaignsByStatus);

// Get campaigns by status
exports.getCampaignsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    // Validate status
    if (!['pending', 'approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Fetch campaigns by status
    const campaigns = await Campaign.find({ status });
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns by status', error });
  }
};

// router.delete('/:id', authMiddleware, async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
//     console.log('Campaign to delete:', campaign);
//     if (!campaign) {
//       return res.status(404).json({ message: 'Campaign not found' });
//     }
//     if (campaign.owner.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }
//     await campaign.remove();
//     console.log('Campaign deleted successfully');
//     res.json({ message: 'Campaign deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting campaign:', error);
//     res.status(500).json({ message: 'Error deleting campaign', error });
//   }
// })

module.exports = router;
