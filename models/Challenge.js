// const mongoose = require('mongoose');

// const ChallengeSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   goal: { type: Number, required: true },
//   milestones: [{ type: String }],
//   urgencyTag: { type: String },
//   category: { type: String },
//   location: { type: String },
//   image: { type: String },
//   galleryImages: [{ type: String }],
//   linkToCharity: { type: Boolean, default: false },
//   videoUrl: { type: String },
//   visibility: { type: String, enum: ['public', 'private'], default: 'public' },
//   owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   createdAt: { type: Date, default: Date.now },
//   // Add more fields as needed
// });

// module.exports = mongoose.model('Challenge', ChallengeSchema);


const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },
  location: { type: String },
  endDate: { type: Date },
  mode: { type: String },
  goal: { type: Number, required: true },
  raised: { type: Number, default: 0 },
  creatorDeposit: { type: Number },
  milestones: [{ type: String }],
  urgencyTag: { type: String },
  status: { type: String, default: 'pending' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  linkToCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  charityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
  charity: { charityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' }, },
  videoUrl: { type: String },
  notificationMessage: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  image: { type: String },
  galleryImages: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Challenge', ChallengeSchema);

// {
//   "title": "Consequuntur unde vi",
//   "category": "BusinessVsBusinessChallenge",
//   "subcategory": "MostFundsRaisedForCharity",
//   "location": "Quia illo quidem mod",
//   "endDate": "2011-02-16",
//   "image": "https://res.cloudinary.com/djdvsrjzs/image/upload/v1751522584/uploads/avyts2jutnrhul0so8zj.png",
//   "galleryImages": [
//       "https://res.cloudinary.com/djdvsrjzs/image/upload/v1751522587/uploads/irg1nmwqp2qhgdcjpuks.png"
//   ],
//   "videoUrl": "",
//   "visibility": "public",
//   "linkToCharity": "6857e0980fe93675a63d0b1f",
//   "charity": {
//       "charityId": "6857e0980fe93675a63d0b1f"
//   },
//   "charityId": "6857e0980fe93675a63d0b1f",
//   "description": "Aut quasi voluptate ",
//   "mode": "who-dares",
//   "goal": 49,
//   "raised": 0,
//   "milestones": [],
//   "urgencyTag": "BusinessVsBusinessChallenge",
//   "status": "pending",
//   "createdAt": "2025-07-03T06:03:07.598Z",
//   "participants": [
//       "Olusanyatomiwa97@gmail.com",
//       "akoredesalaudeen54@gmail.com"
//   ],
//   "notificationMessage": ""
// }






//     title: "",
//     description: "",
//     category: "",
//     subcategory: "",
//     location: "",
//     endDate: null,
//     mode: "who-dares",
//     goal: null,
//     raised: null,
//     creatorDeposit: null,
//     milestones: [],
//     urgencyTag: "",
//     visibility: "public",
//     linkToCharity: [],
//     charityId: "",
//     charity: "",
//     videoUrl: "",
//     challengeTargets: [],
//     notificationMessage: "",