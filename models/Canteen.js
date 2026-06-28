const mongoose = require("mongoose");

const canteenSchema = new mongoose.Schema(
  {
    // Canonical canteen name — must match Staff.assignedCanteen and Order.canteen exactly
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    // Store open/close control (staff can toggle via /api/staff/store/status)
    isOpen: {
      type: Boolean,
      default: true,
    },

    // Busy mode — students can see but ordering may be paused
    isBusy: {
      type: Boolean,
      default: false,
    },

    operatingHours: {
      open: {
        type: String,
        default: "08:00",
      },
      close: {
        type: String,
        default: "20:00",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Canteen", canteenSchema);
