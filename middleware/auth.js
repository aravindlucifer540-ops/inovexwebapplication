const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'REC_CAMPUS_COMPANION_SECRET_KEY_2026';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

// Middleware for Hosteller OR Staff OR Admin access (Mess menu feedback)
const requireHosteller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.isHosteller || req.user.isStaff || req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access Restricted: Mess feedback & menu portal is reserved for REC Hostellers, Faculty Staff, and Admins.'
  });
};

// Middleware for Club Member OR Lead OR Staff OR Admin access (Club Announcements)
const requireClubAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.isClubMember || req.user.isClubLead || req.user.isStaff || req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access Restricted: Club announcements are only accessible to verified Club Members, Leads, Staff, or Admins.'
  });
};

// Middleware to enforce Event Publishing privileges (Admin, Staff, Club Leads)
const requireEventPublisher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.isClubLead || req.user.isStaff || req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Permission Denied: Only Club Leads, Faculty Staff, or Campus Admins can publish new events.'
  });
};

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireHosteller,
  requireClubAccess,
  requireEventPublisher
};
