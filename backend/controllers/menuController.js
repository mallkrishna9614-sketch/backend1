const Menu = require("../../models/Menu");
const Canteen = require("../../models/Canteen");

/**
 * GET /api/staff/menu
 * Returns the full menu for the logged-in staff's canteen (includes unavailable items).
 * Protected: verifyToken + requireStaff
 */
const getStaffMenu = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;

    const items = await Menu.find({ canteen: assignedCanteen })
      .sort({ category: 1, name: 1 })
      .lean();

    res.status(200).json({ canteen: assignedCanteen, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/staff/menu/:id
 * Update a menu item's availability, price, or description.
 *
 * Security: Verifies item.canteen === staff's assignedCanteen — 403 if not.
 * Staff can NEVER edit another canteen's menu item.
 */
const updateMenuItem = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;
    const { id } = req.params;

    const item = await Menu.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    // ─── CANTEEN OWNERSHIP CHECK ───────────────────────────────────────────
    if (item.canteen !== assignedCanteen) {
      return res.status(403).json({
        message: "Forbidden. This menu item does not belong to your canteen.",
      });
    }

    // Only allow updating safe fields — never allow canteen reassignment
    const allowedUpdates = [
      "isAvailable",
      "price",
      "description",
      "imageUrl",
      "category",
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    res.status(200).json({
      message: "Menu item updated.",
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/staff/menu
 * Add a new menu item to the staff's canteen.
 * The canteen field is set from the JWT — frontend cannot override it.
 */
const addMenuItem = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;
    const { name, description, price, category, imageUrl } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required." });
    }

    const item = await Menu.create({
      name,
      description,
      price,
      category,
      imageUrl,
      canteen: assignedCanteen, // always from JWT
      isAvailable: true,
    });

    res.status(201).json({ message: "Menu item added.", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/menu  (PUBLIC — no auth)
 * Returns available menu items for a specific canteen.
 * Used by the student-facing app.
 * Query param: ?canteen=Coffee Day
 */
const getPublicMenu = async (req, res) => {
  try {
    const requestedCanteen = req.params.canteen || req.query.canteen;

    if (!requestedCanteen) {
      return res.status(400).json({
        message: "Canteen parameter is required (either as path parameter /menu/:canteen or query param ?canteen=...).",
      });
    }

    // Resolve flexible canteen name (e.g., "Fresh Juice" -> "The Fresh Juice")
    let resolvedCanteen = requestedCanteen.trim();
    try {
      const normalizedQuery = resolvedCanteen.replace(/^The\s+/i, "");
      const canteenRecord = await Canteen.findOne({
        $or: [
          { name: resolvedCanteen },
          { name: new RegExp(`^${resolvedCanteen}$`, "i") },
          { name: new RegExp(`^The ${normalizedQuery}$`, "i") },
          { name: new RegExp(`^${normalizedQuery}$`, "i") },
        ],
      });

      if (canteenRecord) {
        resolvedCanteen = canteenRecord.name;
      }
    } catch (dbErr) {
      console.error("Canteen resolution database error:", dbErr.message);
    }

    const items = await Menu.find({ canteen: resolvedCanteen, isAvailable: true })
      .sort({ category: 1, name: 1 })
      .lean();

    res.status(200).json({ canteen: resolvedCanteen, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaffMenu,
  updateMenuItem,
  addMenuItem,
  getPublicMenu,
};
