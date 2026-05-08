const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
    },

    registrationNumber: {
      type: String,
      required: true,
    },

    canteen: {
      type: String,
      required: true,
    },

    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    pickupSlot: {
      type: String,
      required: true,
    },

    orderType: {
      type: String,
      enum: ["Takeaway", "Dine-In"],
      default: "Takeaway",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Paid",
    },

    orderStatus: {
      type: String,
      enum: ["Preparing", "Ready", "Completed"],
      default: "Preparing",
    },

    tokenNumber: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);