const jwt = require("jsonwebtoken");

/**
 * Verifies the JWT from the Authorization header.
 * Attaches decoded payload to req.user:
 *   { id, role, assignedCanteen }
 *
 * Used on ALL protected routes (both staff and future student-protected routes).
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, assignedCanteen }
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

/**
 * Ensures the authenticated user has role === "staff".
 * Must be used AFTER verifyToken.
 * Returns 403 Forbidden if the role check fails.
 */
const requireStaff = (req, res, next) => {
  if (!req.user || req.user.role !== "staff") {
    return res.status(403).json({
      message: "Forbidden. Staff access only.",
    });
  }

  if (!req.user.assignedCanteen) {
    return res.status(403).json({
      message: "Forbidden. Staff account has no assigned canteen.",
    });
  }

  next();
};

/**
 * Ensures the authenticated user has role === "student".
 * Reserved for future student-protected endpoints.
 */
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({
      message: "Forbidden. Student access only.",
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireStaff,
  requireStudent,
};
