const Canteen = require("../../models/Canteen");

/**
 * PUT /api/staff/store/status
 * Allows staff to control their store's open/closed/busy state.
 *
 * Body accepts one or more of:
 *   { isOpen: true/false, isBusy: true/false }
 *
 * Security: canteen is always derived from the JWT — never from request body.
 * Staff can ONLY modify their own store.
 */
const updateStoreStatus = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;
    const { isOpen, isBusy } = req.body;

    if (isOpen === undefined && isBusy === undefined) {
      return res.status(400).json({
        message: "Provide at least one of: isOpen, isBusy.",
      });
    }

    const canteen = await Canteen.findOne({ name: assignedCanteen });

    if (!canteen) {
      return res.status(404).json({
        message: `Canteen "${assignedCanteen}" not found in the registry.`,
      });
    }

    if (isOpen !== undefined) canteen.isOpen = isOpen;
    if (isBusy !== undefined) canteen.isBusy = isBusy;

    await canteen.save();

    res.status(200).json({
      message: "Store status updated.",
      canteen: {
        name: canteen.name,
        isOpen: canteen.isOpen,
        isBusy: canteen.isBusy,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/staff/store/status
 * Returns current status of the staff's own store.
 */
const getStoreStatus = async (req, res) => {
  try {
    const { assignedCanteen } = req.user;

    const canteen = await Canteen.findOne({ name: assignedCanteen }).lean();

    if (!canteen) {
      return res.status(404).json({
        message: `Canteen "${assignedCanteen}" not found.`,
      });
    }

    res.status(200).json({ canteen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/canteens  (PUBLIC — no auth)
 * Returns list of all registered canteens and their open/busy status.
 * Used by student-facing app to show which canteens are available.
 */
const getPublicCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find({})
      .select("name description location isOpen isBusy operatingHours")
      .lean();

    res.status(200).json({ canteens });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateStoreStatus,
  getStoreStatus,
  getPublicCanteens,
};
