const Challenge = require('../models/Challenge');

// exports.createChallenge = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       goal,
//       milestones,
//       urgencyTag,
//       category,
//       location,
//       image,
//       galleryImages,
//       linkToCharity,
//       videoUrl,
//       visibility
//     } = req.body;

//     const challenge = new Challenge({
//       title,
//       description,
//       goal,
//       milestones,
//       urgencyTag,
//       category,
//       location,
//       image,
//       galleryImages,
//       linkToCharity,
//       videoUrl,
//       visibility,
//       owner: req.user._id
//     });

//     await challenge.save();
//     res.status(201).json(challenge);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Error creating challenge', error });
//   }
// };


exports.createChallenge = async (req, res) => {
  try {
    const data = {
      ...req.body,
      owner: req.user._id
    };

    // Minimal required fields check
    if (!data) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const challenge = new Challenge(data);
    await challenge.save();

    res.status(201).json({ message: 'Challenge created successfully', data: challenge });
  } catch (error) {
    res.status(500).json({ message: 'Error creating challenge', error: error.message });
  }
};
