const express = require("express");

const router = express.Router();

const {

    getOrders,

    createOrder,

    updateOrderStatus

} = require("../controllers/orderController");

// GET ORDERS
router.get("/", getOrders);

// CREATE ORDER
router.post("/", createOrder);

// UPDATE STATUS
router.put("/:id", updateOrderStatus);

module.exports = router;