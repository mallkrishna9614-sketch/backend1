const express = require("express");
const router = express.Router();

const { getPublicMenu } = require("../controllers/menuController");
const { getPublicCanteens } = require("../controllers/storeController");

// GET /api/menu/:canteen  (New path-parameter endpoint)
// GET /api/menu           (Query param ?canteen=...)
// GET /                   (Backward compatibility query param ?canteen=...)
// Public endpoints — no auth required — used by student-facing app
router.get("/menu/:canteen", getPublicMenu);
router.get("/menu", getPublicMenu);
router.get("/", getPublicMenu);

// GET /api/canteens
// Returns all registered canteens with open/busy status
router.get("/canteens", getPublicCanteens);

module.exports = router;
