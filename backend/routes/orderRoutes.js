const express = require("express");

const {
  createOrder,
  getOrders,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/create", createOrder);

router.get("/", getOrders);

module.exports = router;