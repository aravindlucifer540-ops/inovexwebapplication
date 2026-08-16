const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EMAIL_REGISTRY = require('../data/emailRegistry');
const { users } = require('../data/store');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

// Endpoint: Check official email against REC Registry Sheet
router.post('/registry-check', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.endsWith('@rajalakshmi.edu.in')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Domain: Only official campus emails ending with @rajalakshmi.edu.in are authorized.'
    });
  }

  const matchedRegistry = EMAIL_REGISTRY.find(item => item.email.toLowerCase() === cleanEmail);

  if (matchedRegistry) {
    return res.json({
      success: true,
      foundInRegistry: true,
      data: {
        email: matchedRegistry.email,
        name: matchedRegistry.name,
        role: matchedRegistry.role,
        gender: matchedRegistry.gender,
        department: matchedRegistry.department,
        year: matchedRegistry.year,
        isHosteller: matchedRegistry.isHosteller,
        isClubLead: matchedRegistry.isClubLead,
        isClubMember: matchedRegistry.isClubMember,
        isStaff: matchedRegistry.isStaff,
        clubsJoined: matchedRegistry.clubsJoined,
        designation: matchedRegistry.designation
      }
    });
  }

  return res.json({
    success: true,
    foundInRegistry: false,
    message: 'Official REC Domain Verified. Proceed with custom registration details.'
  });
});

// Endpoint: Register new account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, gender, department, year, isHosteller } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@rajalakshmi.edu.in')) {
      return res.status(400).json({
        success: false,
        message: 'Registration Denied: Only official college emails ending with @rajalakshmi.edu.in are allowed.'
      });
    }

    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this official email already exists. Please log in.' });
    }

    // Match against registry sheet to inherit pre-assigned privileges if any
    const matchedRegistry = EMAIL_REGISTRY.find(item => item.email.toLowerCase() === cleanEmail);

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      gender: gender || (matchedRegistry ? matchedRegistry.gender : 'Other'),
      department: department || (matchedRegistry ? matchedRegistry.department : 'CSE'),
      year: year || (matchedRegistry ? matchedRegistry.year : '2nd Year'),
      role: matchedRegistry ? matchedRegistry.role : 'student',
      isHosteller: matchedRegistry ? matchedRegistry.isHosteller : Boolean(isHosteller),
      isClubLead: matchedRegistry ? matchedRegistry.isClubLead : false,
      isClubMember: matchedRegistry ? matchedRegistry.isClubMember : false,
      isStaff: matchedRegistry ? matchedRegistry.isStaff : false,
      isAdmin: matchedRegistry ? matchedRegistry.role === 'admin' : false,
      clubsJoined: matchedRegistry ? matchedRegistry.clubsJoined : [],
      designation: matchedRegistry ? matchedRegistry.designation : (Boolean(isHosteller) ? 'Hostel Resident Student' : 'Day Scholar Student'),
      pfpUrl: matchedRegistry ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedRegistry.name}` : '',
      bio: 'Official REC Campus Companion User',
      phone: '+91 98765 43210',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const payload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      gender: newUser.gender,
      department: newUser.department,
      year: newUser.year,
      role: newUser.role,
      isHosteller: newUser.isHosteller,
      isClubLead: newUser.isClubLead,
      isClubMember: newUser.isClubMember,
      isStaff: newUser.isStaff,
      isAdmin: newUser.isAdmin,
      clubsJoined: newUser.clubsJoined,
      designation: newUser.designation,
      pfpUrl: newUser.pfpUrl,
      bio: newUser.bio,
      phone: newUser.phone
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account successfully registered and authenticated.',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration process.' });
  }
});

// Endpoint: Log In / Sign In
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No registered user found with this official email. Please check your credentials or sign up.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password provided.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      department: user.department,
      year: user.year,
      role: user.role,
      isHosteller: user.isHosteller,
      isClubLead: user.isClubLead,
      isClubMember: user.isClubMember,
      isStaff: user.isStaff,
      isAdmin: user.isAdmin,
      clubsJoined: user.clubsJoined,
      designation: user.designation,
      pfpUrl: user.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
      bio: user.bio || 'REC Campus Student',
      phone: user.phone || '+91 98765 43210'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication process.' });
  }
});

// Endpoint: Fetch Current Logged-in User Profile
router.get('/me', verifyToken, (req, res) => {
  const user = users.find(u => u.email === req.user.email);
  if (user) {
    req.user.pfpUrl = user.pfpUrl || req.user.pfpUrl;
    req.user.bio = user.bio || req.user.bio;
    req.user.phone = user.phone || req.user.phone;
  }
  res.json({
    success: true,
    user: req.user
  });
});

// Endpoint: Update User Profile (PFP, Name, Bio, Phone, Department, Year, Hosteller toggle)
router.put('/profile', verifyToken, (req, res) => {
  const user = users.find(u => u.email === req.user.email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { name, pfpUrl, bio, phone, gender, department, year, isHosteller } = req.body;

  if (name) user.name = name.trim();
  if (pfpUrl) user.pfpUrl = pfpUrl;
  if (bio) user.bio = bio.trim();
  if (phone) user.phone = phone.trim();
  if (gender) user.gender = gender;
  if (department) user.department = department;
  if (year) user.year = year;
  if (typeof isHosteller !== 'undefined') user.isHosteller = Boolean(isHosteller);

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    department: user.department,
    year: user.year,
    role: user.role,
    isHosteller: user.isHosteller,
    isClubLead: user.isClubLead,
    isClubMember: user.isClubMember,
    isStaff: user.isStaff,
    isAdmin: user.isAdmin,
    clubsJoined: user.clubsJoined,
    designation: user.designation,
    pfpUrl: user.pfpUrl,
    bio: user.bio,
    phone: user.phone
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: 'Profile details & profile picture updated successfully!',
    token,
    user: payload
  });
});

module.exports = router;
