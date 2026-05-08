const Order = require("../models/Order");
const updateOrderStatus = async (
    req,
    res
) => {

    try {

        const order =
            await Order.findByIdAndUpdate(

                req.params.id,

                {
                    orderStatus:
                        req.body.orderStatus
                },

                {
                    new: true
                }
            );

        res.status(200).json(order);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const createOrder = async (req, res) => {
  try {

    const {
      studentName,
      registrationNumber,
      canteen,
      items,
      totalAmount,
      pickupSlot,
      orderType,
    } = req.body;

    const tokenNumber =
      "LPU" + Math.floor(1000 + Math.random() * 9000);

    const order = await Order.create({
      studentName,
      registrationNumber,
      canteen,
      items,
      totalAmount,
      pickupSlot,
      orderType,
      tokenNumber,
    });

    res.status(201).json({
      message: "Order Placed Successfully",
      tokenNumber,
      order,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const getOrders = async (req, res) => {

  try {

    const orders = await Order.find().sort({
      createdAt: -1,
    });

    res.status(200).json(orders);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

module.exports = {
  createOrder,
  getOrders,
};
module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus
};