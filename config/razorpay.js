const Razorpay = require("razorpay");

/**
 * Singleton Razorpay instance.
 * Initialized from environment variables — key secret is NEVER exposed to clients.
 *
 * Razorpay Test Mode keys start with: rzp_test_
 * Get them from: https://dashboard.razorpay.com → Settings → API Keys → Test Mode
 */
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
