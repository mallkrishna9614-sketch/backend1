const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["staff"],
      default: "staff",
    },

    // The canteen this staff member is permanently assigned to.
    // This value is embedded in their JWT — never trusted from request body.
    assignedCanteen: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookup by canteen
staffSchema.index({ assignedCanteen: 1 });

module.exports = mongoose.model("Staff", staffSchema);
