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
    const orderData = { ...req.body };

    // Ensure both total and totalAmount are populated
    if (orderData.totalAmount !== undefined && orderData.total === undefined) {
      orderData.total = orderData.totalAmount;
    } else if (orderData.total !== undefined && orderData.totalAmount === undefined) {
      orderData.totalAmount = orderData.total;
    }

    // Default status values
    if (!orderData.paymentStatus) {
      orderData.paymentStatus = "Paid";
    }
    if (!orderData.orderStatus) {
      orderData.orderStatus = "Pending";
    }

    // Generate token number if missing
    if (!orderData.tokenNumber) {
      const canteenVal = orderData.canteen || "GEN";
      const prefix = canteenVal
        .replace(/\s+/g, "")
        .substring(0, 3)
        .toUpperCase();
      const timestamp = Date.now().toString().slice(-5);
      orderData.tokenNumber = `TKN-${prefix}-${timestamp}`;
    }

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // Requirement 6: backend logging when creating an order
    console.log("NEW ORDER");
    console.log("Canteen:");
    console.log(savedOrder.canteen);

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