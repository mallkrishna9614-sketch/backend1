const mongoose = require("mongoose");

/**
 * Payment record — persisted after successful Razorpay signature verification.
 *
 * IMPORTANT: A Payment document is ONLY created when the HMAC signature is valid.
 * The razorpayOrderId field has a unique index to prevent duplicate processing.
 */
const paymentSchema = new mongoose.Schema(
  {
    // Razorpay-issued IDs returned after checkout
    razorpayPaymentId: {
      type: String,
      required: true,
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate payment processing
      trim: true,
    },

    // HMAC SHA256 signature — stored for audit trail
    razorpaySignature: {
      type: String,
      required: true,
    },

    // Amount in rupees (NOT paise — convert before display)
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Student details
    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Target canteen
    canteen: {
      type: String,
      required: true,
      trim: true,
    },

    // Cart snapshot at time of payment
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    // Payment status
    status: {
      type: String,
      enum: ["Paid", "Failed"],
      default: "Paid",
    },

    // Reference to the Order document created after verification
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for fast lookup by registration number (student payment history)
paymentSchema.index({ registrationNumber: 1, createdAt: -1 });
// Index for canteen-scoped payment queries
paymentSchema.index({ canteen: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
