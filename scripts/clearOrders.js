/**
 * Database Cleanup Script — Clear Test/Demo Orders
 * ────────────────────────────────────────────────
 * Deletes all documents in the Orders and Payments collections.
 * Run using: node scripts/clearOrders.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Order = require("../backend/models/Order");
const Payment = require("../models/Payment");

async function clearOrders() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the environment or .env file.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully.");

    // 1. Clear Orders collection
    console.log("Clearing Orders collection...");
    const orderDelete = await Order.deleteMany({});
    console.log(`🧹 Deleted ${orderDelete.deletedCount} orders from the Orders collection.`);

    // 2. Clear Payments collection
    console.log("Clearing Payments collection...");
    const paymentDelete = await Payment.deleteMany({});
    console.log(`🧹 Deleted ${paymentDelete.deletedCount} payments from the Payments collection.`);

    console.log("\n✅ Database cleanup complete! Started with a clean slate.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    process.exit(1);
  }
}

clearOrders();
