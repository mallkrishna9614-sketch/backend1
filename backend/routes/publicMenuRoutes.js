const express = require("express");
const router = express.Router();

const { getPublicMenu } = require("../controllers/menuController");
const { getPublicCanteens } = require("../controllers/storeController");

// GET /api/menu?canteen=Coffee Day
// Public endpoint — no auth required — used by student-facing app
router.get("/", getPublicMenu);

// GET /api/canteens
// Returns all registered canteens with open/busy status
router.get("/canteens", getPublicCanteens);

module.exports = router;
