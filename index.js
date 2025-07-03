require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const campaignRoutes = require('./routes/campaigns');
const donationRoutes = require('./routes/donations');
const commentRoutes = require('./routes/comments');
const updateRoutes = require('./routes/updates');
const adminRoutes = require('./routes/admin');
const dareFeaturesRoutes = require('./routes/dareFeatures');
const urgentSupportRoutes = require('./routes/urgentSupport');
const challengeParticipationController = require('./routes/challengeParticipation');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cors = require('cors');
const mediaRoutes = require('./routes/media');
const webhookRoutes = require('./routes/stripeWebhook');
const reportRoutes = require('./routes/report');
const contactRoutes = require('./routes/contactus');
const campaignWithdrawalRoutes = require('./routes/capaignwithdrawal');


//Cron Jobs
const cronJobs = require('./cronJobs'); 
const app = express();

// Connect to the database
connectDB();

// Start cron jobs
cronJobs;

// Middleware
app.use(express.json());

const allowedOrigins = ['https://daretoaccept.com', 'https://www.daretoaccept.com', 'https://dare-to-accept-eight.vercel.app', 'https://www.dare-to-accept-eight.vercel.app', 'http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/donations', donationRoutes);
app.use('/comments', commentRoutes);
app.use('/updates', updateRoutes);
app.use('/admin', adminRoutes);
app.use('/dare-features', dareFeaturesRoutes);
app.use('/urgent-support', urgentSupportRoutes);
app.use('/api/challenges', require('./routes/challenge'));
app.use('/challenges', challengeParticipationController);
app.use('/withdrawals', require('./routes/withdrawals'));
app.use('/charities', require('./routes/charities'));
app.use('/media', mediaRoutes);
app.use('/participants', require('./routes/participant'));
app.use('/api/stripe', webhookRoutes);
app.use('/reports', reportRoutes);
app.use('/contact', contactRoutes);
app.use('/campaign-withdrawal', campaignWithdrawalRoutes);

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));