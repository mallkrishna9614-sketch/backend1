const express = require("express");
const router = express.Router();

const { verifyToken, requireStaff } = require("../../middleware/authMiddleware");

const { loginStaff, getStaffProfile } = require("../controllers/staffAuthController");

const {
  getActiveOrders,
  getOrderHistory,
  updateOrderStatus,
  getDashboardStats,
} = require("../controllers/staffOrderController");

const {
  getStaffMenu,
  updateMenuItem,
  addMenuItem,
} = require("../controllers/menuController");

const {
  updateStoreStatus,
  getStoreStatus,
} = require("../controllers/storeController");

// ─── AUTH (no middleware on login) ────────────────────────────────────────────
router.post("/auth/login", loginStaff);
router.get("/auth/me", verifyToken, requireStaff, getStaffProfile);

// ─── ORDERS (protected) ───────────────────────────────────────────────────────
// GET  /api/staff/orders           → Active orders for staff's canteen only
// PUT  /api/staff/orders/:id/status → Update status (403 if wrong canteen)
// GET  /api/staff/history          → Completed orders (paginated)
// GET  /api/staff/dashboard        → Stats scoped to staff's canteen
router.get("/orders", verifyToken, requireStaff, getActiveOrders);
router.put("/orders/:id/status", verifyToken, requireStaff, updateOrderStatus);
router.get("/history", verifyToken, requireStaff, getOrderHistory);
router.get("/dashboard", verifyToken, requireStaff, getDashboardStats);

// ─── MENU (protected) ────────────────────────────────────────────────────────
// GET  /api/staff/menu       → Full menu for staff's canteen
// POST /api/staff/menu       → Add new item (canteen set from JWT)
// PUT  /api/staff/menu/:id   → Update item (403 if wrong canteen)
router.get("/menu", verifyToken, requireStaff, getStaffMenu);
router.post("/menu", verifyToken, requireStaff, addMenuItem);
router.put("/menu/:id", verifyToken, requireStaff, updateMenuItem);

// ─── STORE CONTROLS (protected) ───────────────────────────────────────────────
// GET  /api/staff/store/status  → Get own store's status
// PUT  /api/staff/store/status  → Open/Close/Busy (only own store)
router.get("/store/status", verifyToken, requireStaff, getStoreStatus);
router.put("/store/status", verifyToken, requireStaff, updateStoreStatus);

module.exports = router;
