const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyPayment,
} = require("../controllers/paymentController");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Student initiates checkout → backend creates Razorpay order
// Returns: { orderId, amount, currency, keyId }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/create-order", createRazorpayOrder);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Called after Razorpay checkout modal closes with success
// Verifies HMAC SHA256 signature, then creates Order + Payment records
// Returns: { success, tokenNumber, order, payment }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/verify", verifyPayment);

module.exports = router;
