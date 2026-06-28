const Staff = require("../../models/Staff");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * POST /api/staff/auth/login
 * Staff-only login. Issues a JWT containing id, role, and assignedCanteen.
 * The frontend must store this token and send it on every staff API call.
 */
const loginStaff = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({
        message: "Please provide (email or username) and password.",
      });
    }

    // Allow login by email or username (case-insensitive)
    const query = email
      ? { email: email.toLowerCase() }
      : { username: { $regex: new RegExp(`^${username}$`, "i") } };

    const staff = await Staff.findOne(query);

    if (!staff) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (!staff.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    const isMatch = await bcrypt.compare(password, staff.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    // JWT payload includes assignedCanteen — this is what all staff APIs use
    const token = jwt.sign(
      {
        id: staff._id,
        role: "staff",
        username: staff.username,
        assignedCanteen: staff.assignedCanteen,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      username: username || staff.username,
      assignedCanteen: staff.assignedCanteen,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        username: staff.username,
        assignedCanteen: staff.assignedCanteen,
        role: staff.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/staff/auth/me
 * Returns the authenticated staff's profile.
 * Protected: verifyToken + requireStaff
 */
const getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select("-password");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    res.status(200).json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginStaff,
  getStaffProfile,
};
