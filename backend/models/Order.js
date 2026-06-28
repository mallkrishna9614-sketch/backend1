const mongoose = require("mongoose");

// Full order lifecycle as defined in the system spec
const ORDER_STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "Completed",
];

// Active statuses — shown on the live dashboard
const ACTIVE_STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
];

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

    // Determines which canteen staff can see this order.
    // Must match Staff.assignedCanteen exactly.
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
      enum: ORDER_STATUSES,
      default: "Pending",
    },

    tokenNumber: {
      type: String,
      required: true,
    },

    // Set when order transitions to "Completed" — used in history queries
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient canteen-scoped filtered queries
orderSchema.index({ canteen: 1, orderStatus: 1, createdAt: -1 });

// Export status arrays so controllers can import them
orderSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;
orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = mongoose.model("Order", orderSchema);