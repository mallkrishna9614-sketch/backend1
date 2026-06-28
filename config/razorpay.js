const Razorpay = require("razorpay");

let razorpayInstance = null;

/**
 * Returns the initialized Razorpay singleton instance.
 * Lazy initialized to prevent server startup crashes if environment variables
 * are not set at deployment time.
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from environment variables.");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
};

module.exports = {
  getRazorpayInstance
};
