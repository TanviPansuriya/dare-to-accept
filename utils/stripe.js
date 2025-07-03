const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount, currency = 'usd') => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
  });
};

module.exports = { createPaymentIntent };