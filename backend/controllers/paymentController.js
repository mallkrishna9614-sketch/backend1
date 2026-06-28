const crypto = require("crypto");
const { getRazorpayInstance } = require("../../config/razorpay");
const Payment = require("../../models/Payment");
const Order = require("../models/Order");

// ─── HELPER: Generate token number ───────────────────────────────────────────
const generateToken = (canteen) => {
  const prefix = canteen
    .replace(/\s+/g, "")
    .substring(0, 3)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-5);
  return `TKN-${prefix}-${timestamp}`;
};

// ─── HELPER: Validate required fields ────────────────────────────────────────
const validateCreateOrderBody = (body) => {
  const { studentName, registrationNumber, canteen, amount, items, pickupSlot, orderType } = body;

  if (!studentName || typeof studentName !== "string" || studentName.trim() === "") {
    return "studentName is required";
  }
  if (!registrationNumber || typeof registrationNumber !== "string" || registrationNumber.trim() === "") {
    return "registrationNumber is required";
  }
  if (!canteen || typeof canteen !== "string" || canteen.trim() === "") {
    return "canteen is required";
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return "amount must be a positive number (in rupees)";
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return "items must be a non-empty array";
  }
  if (!pickupSlot || typeof pickupSlot !== "string" || pickupSlot.trim() === "") {
    return "pickupSlot is required";
  }
  return null; // No error
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order and returns credentials to the frontend.
// NEVER exposes RAZORPAY_KEY_SECRET.
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = async (req, res) => {
  try {
    const { studentName, registrationNumber, canteen, amount, items, pickupSlot, orderType } = req.body;

    // ── Validate input ──────────────────────────────────────────────────────
    const validationError = validateCreateOrderBody(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // ── Amount sanity check (must be integer rupees, max ₹50,000) ───────────
    if (!Number.isInteger(amount) && Math.round(amount * 100) !== amount * 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid rupee value (up to 2 decimal places)",
      });
    }

    // ── Create Razorpay order ───────────────────────────────────────────────
    // Razorpay expects amount in paise (₹1 = 100 paise)
    const receipt = `rcpt_${registrationNumber}_${Date.now()}`;

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert rupees → paise
      currency: "INR",
      receipt,
      notes: {
        studentName,
        registrationNumber,
        canteen,
      },
    });

    // ── Return only safe fields — NEVER include key_secret ──────────────────
    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,          // rzp_order_XXXXXXXXXX
      amount: razorpayOrder.amount,        // In paise
      currency: razorpayOrder.currency,    // "INR"
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to share with frontend
    });
  } catch (error) {
    console.error("[Razorpay] create-order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay HMAC SHA256 signature.
// Creates Payment + Order records ONLY after successful verification.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    // Ensure Razorpay configuration is valid
    getRazorpayInstance();

    const {
      // Razorpay callback fields
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,

      // Order data (needed to create the order post-verification)
      studentName,
      registrationNumber,
      canteen,
      amount,
      items,
      pickupSlot,
      orderType,
    } = req.body;

    // ── Validate required Razorpay fields ───────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields: razorpay_payment_id, razorpay_order_id, razorpay_signature",
      });
    }

    // ── Validate order data fields ──────────────────────────────────────────
    if (!studentName || !registrationNumber || !canteen || !amount || !items || !pickupSlot) {
      return res.status(400).json({
        success: false,
        message: "Missing required order fields",
      });
    }

    // ── HMAC SHA256 Signature Verification ─────────────────────────────────
    // Razorpay specification: sign = HMAC(key_secret, orderId + "|" + paymentId)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!isSignatureValid) {
      console.warn("[Razorpay] Invalid signature attempt:", {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature",
      });
    }

    // ── Duplicate Payment Guard ─────────────────────────────────────────────
    const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: "Payment already processed for this order",
        orderId: existingPayment.orderId,
      });
    }

    // ── Amount validation (cross-check frontend vs actual paise) ───────────
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount validation failed: amount must be a positive number",
      });
    }

    // ── Generate token number ───────────────────────────────────────────────
    const tokenNumber = generateToken(canteen);

    // ─── Create Order document ───────────────────────────────────────────────
    const newOrder = new Order({
      studentName: studentName.trim(),
      registrationNumber: registrationNumber.trim(),
      canteen: canteen.trim(),
      items,
      totalAmount: amount,
      total: amount,
      pickupSlot: pickupSlot.trim(),
      orderType: orderType || "Takeaway",
      paymentStatus: "Paid",
      orderStatus: "Pending",
      tokenNumber,
    });

    const savedOrder = await newOrder.save();

    // Requirement 6: backend logging when creating an order
    console.log("NEW ORDER");
    console.log("Canteen:");
    console.log(savedOrder.canteen);

    // ── Create Payment record ───────────────────────────────────────────────
    const payment = new Payment({
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      amount,
      currency: "INR",
      studentName: studentName.trim(),
      registrationNumber: registrationNumber.trim(),
      canteen: canteen.trim(),
      items,
      status: "Paid",
      orderId: savedOrder._id,
    });

    await payment.save();

    console.log(`[Razorpay] Payment verified ✓ | Order: ${savedOrder._id} | Token: ${tokenNumber}`);

    return res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      tokenNumber,
      order: {
        _id: savedOrder._id,
        studentName: savedOrder.studentName,
        canteen: savedOrder.canteen,
        tokenNumber: savedOrder.tokenNumber,
        items: savedOrder.items,
        totalAmount: savedOrder.totalAmount,
        pickupSlot: savedOrder.pickupSlot,
        orderType: savedOrder.orderType,
        orderStatus: savedOrder.orderStatus,
        paymentStatus: savedOrder.paymentStatus,
        createdAt: savedOrder.createdAt,
      },
      payment: {
        _id: payment._id,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpayOrderId,
        status: payment.status,
        amount: payment.amount,
      },
    });
  } catch (error) {
    console.error("[Razorpay] verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed due to server error. Contact support.",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
};
