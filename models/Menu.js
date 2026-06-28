const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    // Canteen ownership — matches Canteen.name and Staff.assignedCanteen
    canteen: {
      type: String,
      required: true,
      trim: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup by canteen + availability
menuSchema.index({ canteen: 1, isAvailable: 1 });

module.exports = mongoose.model("Menu", menuSchema);
