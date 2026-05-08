const Order = require("../models/Order");

// GET ALL ORDERS
const getOrders = async (req, res) => {

    try {

        const orders =
            await Order.find()
            .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// CREATE ORDER
const createOrder = async (req, res) => {

    try {

        const newOrder =
            new Order(req.body);

        const savedOrder =
            await newOrder.save();

        res.status(201).json(savedOrder);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// UPDATE ORDER STATUS
const updateOrderStatus =
async (req, res) => {

    try {

        const { status } = req.body;

        const updatedOrder =
            await Order.findByIdAndUpdate(

                req.params.id,

                { status },

                { new: true }

            );

        res.json(updatedOrder);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

module.exports = {

    getOrders,

    createOrder,

    updateOrderStatus

};