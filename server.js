const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// ─── ROUTES ───────────────────────────────────────────────────────────────────
const authRoutes = require("./backend/routes/authRoutes");       // Student auth
const orderRoutes = require("./backend/routes/orderRoutes");     // Student orders
const staffRoutes = require("./backend/routes/staffRoutes");     // Staff (protected)
const publicMenuRoutes = require("./backend/routes/publicMenuRoutes"); // Public menu + canteens

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── MONGODB CONNECTION ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

// ─── STUDENT ROUTES (unchanged) ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

// ─── STAFF ROUTES (all protected via JWT middleware in staffRoutes.js) ─────────
app.use("/api/staff", staffRoutes);

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
// GET /api/menu?canteen=Coffee Day   → public student-facing menu
// GET /api/canteens                  → list all canteens + status
app.use("/api", publicMenuRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("LPU Canteen Backend Running — Multi-Canteen v2.0");
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});