const Order = require("../models/Order");

// GET ALL ORDERS (student-facing — returns all orders by registrationNumber if provided)
const getOrders = async (req, res) => {
  try {
    const filter = {};

    // Allow students to filter their own orders by registration number
    if (req.query.registrationNumber) {
      filter.registrationNumber = req.query.registrationNumber;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE ORDER (student-facing)
const createOrder = async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE ORDER STATUS — FIX: was using { status } but schema field is { orderStatus }
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus }, // FIX: was { status } — schema field is orderStatus
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
};