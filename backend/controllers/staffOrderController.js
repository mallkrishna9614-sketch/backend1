const Order = require("../models/Order");

// Active statuses shown on the live dashboard
const ACTIVE_STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
];

// Valid status transitions — prevents random status jumps
const VALID_TRANSITIONS = {
  Pending: ["Accepted"],
  Accepted: ["Preparing"],
  Preparing: ["Ready for Pickup"],
  "Ready for Pickup": ["Picked Up"],
  "Picked Up": ["Completed"],
  Completed: [], // terminal state
};

/**
 * GET /api/staff/orders
 * Returns ONLY active (non-completed) orders for the logged-in staff's canteen.
 * Canteen comes from the verified JWT — never from request body.
 */
const getActiveOrders = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;

    const orders = await Order.find({
      canteen: assignedCanteen,
      orderStatus: { $in: ACTIVE_STATUSES },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/staff/history
 * Returns completed orders for the staff's canteen, newest first, paginated.
 * Query params: ?page=1&limit=20
 */
const getOrderHistory = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({
        canteen: assignedCanteen,
        orderStatus: "Completed",
      })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments({
        canteen: assignedCanteen,
        orderStatus: "Completed",
      }),
    ]);

    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/staff/orders/:id/status
 * Updates an order's status.
 *
 * Security:
 *  1. Verifies the order belongs to the staff's canteen — 403 if not.
 *  2. Validates the status transition is allowed.
 *  3. Sets completedAt when transitioning to "Completed".
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ message: "orderStatus is required." });
    }

    // Fetch the order first
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // ─── CANTEEN OWNERSHIP CHECK ───────────────────────────────────────────
    if (order.canteen !== assignedCanteen) {
      return res.status(403).json({
        message: "Forbidden. This order does not belong to your canteen.",
      });
    }

    // ─── VALID TRANSITION CHECK ────────────────────────────────────────────
    const allowedNext = VALID_TRANSITIONS[order.orderStatus] || [];
    if (!allowedNext.includes(orderStatus)) {
      return res.status(400).json({
        message: `Invalid transition: "${order.orderStatus}" → "${orderStatus}". Allowed: [${allowedNext.join(", ")}]`,
      });
    }

    // ─── APPLY UPDATE ──────────────────────────────────────────────────────
    order.orderStatus = orderStatus;

    // Set completedAt when order is marked Completed
    if (orderStatus === "Completed") {
      order.completedAt = new Date();
    }

    await order.save();

    res.status(200).json({
      message: `Order status updated to "${orderStatus}".`,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/staff/dashboard
 * Returns dashboard statistics for the staff's canteen only.
 * All aggregations are scoped to assignedCanteen from the JWT.
 */
const getDashboardStats = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;

    // Today's date range (midnight to now)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      pendingCount,
      completedToday,
      allTimeRevenue,
    ] = await Promise.all([
      // All orders placed today for this canteen
      Order.find({
        canteen: assignedCanteen,
        createdAt: { $gte: todayStart },
      }).lean(),

      // Current pending orders count
      Order.countDocuments({
        canteen: assignedCanteen,
        orderStatus: { $in: ACTIVE_STATUSES },
      }),

      // Orders completed today
      Order.find({
        canteen: assignedCanteen,
        orderStatus: "Completed",
        completedAt: { $gte: todayStart },
      }).lean(),

      // All-time completed revenue for this canteen
      Order.aggregate([
        {
          $match: {
            canteen: assignedCanteen,
            orderStatus: "Completed",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    // Today's revenue
    const todayRevenue = completedToday.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );

    // Popular items — flatten all items from today's orders
    const itemFrequency = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemFrequency[item.name] =
          (itemFrequency[item.name] || 0) + item.quantity;
      });
    });
    const popularItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Peak hour — group today's orders by hour
    const hourFrequency = {};
    todayOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    });
    const peakHour =
      Object.entries(hourFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      null;

    res.status(200).json({
      canteen: assignedCanteen,
      stats: {
        todayOrdersCount: todayOrders.length,
        todayRevenue,
        pendingOrdersCount: pendingCount,
        completedTodayCount: completedToday.length,
        allTimeRevenue: allTimeRevenue[0]?.totalRevenue ?? 0,
        popularItems,
        peakHour: peakHour !== null ? `${peakHour}:00` : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveOrders,
  getOrderHistory,
  updateOrderStatus,
  getDashboardStats,
};
