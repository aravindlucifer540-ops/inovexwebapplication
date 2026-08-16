const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken, requireClubAccess } = require('../middleware/auth');

const REC_CLUBS = [
  { id: "club-1", name: "Coding Club REC", tag: "Coding Club", category: "Technical", membersCount: 140, leadName: "Aditya Verma", email: "lead.coding@rajalakshmi.edu.in", description: "Competitive programming, Web Dev, AI/ML projects in J Block." },
  { id: "club-2", name: "Rotaract Club REC", tag: "Rotaract Club", category: "Social & Youth", membersCount: 220, leadName: "Priya Sundaram", email: "lead.rotaract@rajalakshmi.edu.in", description: "Blood drives, community service in Indoor auditorium and HUT CAFE." },
  { id: "club-3", name: "IEEE REC Student Chapter", tag: "IEEE REC", category: "Technical & Research", membersCount: 95, leadName: "Prof. S. Nithya", email: "staff.ece@rajalakshmi.edu.in", description: "Hardware workshops in I Block, paper presentations." },
  { id: "club-4", name: "Entrepreneurship Development Cell (EDC)", tag: "EDC REC", category: "Startups & Business", membersCount: 80, leadName: "Dr. K. Ramaswamy", email: "admin@rajalakshmi.edu.in", description: "Startup incubation in A Block, pitch competitions." },
  { id: "club-5", name: "Fine Arts & Music Club REC", tag: "Fine Arts Club", category: "Cultural", membersCount: 110, leadName: "Priya Sundaram", email: "lead.rotaract@rajalakshmi.edu.in", description: "Music band practice in Indoor auditorium, annual culturals." }
];

// Get Club Directory with user application status
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const applications = db.clubApplications || [];
  const userEmail = req.user.email;

  const userApps = applications.filter(a => a.studentEmail === userEmail);

  res.json({
    success: true,
    count: REC_CLUBS.length,
    data: REC_CLUBS,
    userApplications: userApps
  });
});

// Get Announcements Feed
router.get('/announcements', verifyToken, requireClubAccess, (req, res) => {
  const db = getDatabase();
  const { tag, search } = req.query;
  let filtered = db.clubAnnouncements || [];

  if (tag && tag !== 'All') {
    filtered = filtered.filter(a => a.tags.includes(tag) || a.clubTag === tag || a.clubName === tag);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.clubName.toLowerCase().includes(q));
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
    userClubs: req.user.clubsJoined || []
  });
});

// Post Announcement (Restricted to Club Leads, Staff, Admins)
router.post('/announcements', verifyToken, (req, res) => {
  const db = getDatabase();
  if (!req.user.isClubLead && !req.user.isStaff && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Permission Denied: Only Club Leads, Staff, or Admins can post official club announcements.'
    });
  }

  const { clubName, title, category, tags, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required fields.' });
  }

  const newAnn = {
    id: `ann-${Date.now()}`,
    clubName: clubName || req.user.clubsJoined[0] || 'REC Official Club',
    clubTag: clubName || 'Official Notice',
    title: title.trim(),
    category: category || 'Notice',
    tags: Array.isArray(tags) ? tags : ['Notice', 'Updates'],
    content: content.trim(),
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    postedBy: req.user.email
  };

  if (!db.clubAnnouncements) db.clubAnnouncements = [];
  db.clubAnnouncements.unshift(newAnn);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Announcement successfully posted to Club Board.',
    data: newAnn
  });
});

// Apply / Join Club (Requires Lead Approval)
router.post('/join', verifyToken, (req, res) => {
  const db = getDatabase();
  const { clubName } = req.body;
  if (!clubName) {
    return res.status(400).json({ success: false, message: 'Club name is required.' });
  }

  if (!db.clubApplications) db.clubApplications = [];

  const userEmail = req.user.email;
  const user = db.users.find(u => u.email === userEmail);

  // Check if already joined
  if (user && user.clubsJoined && user.clubsJoined.includes(clubName)) {
    return res.json({
      success: true,
      message: `You are already an approved member of ${clubName}.`,
      status: 'approved',
      clubsJoined: user.clubsJoined
    });
  }

  // Auto-approve if user is Admin, Staff, or the Club Lead
  const isLeadOrAdmin = req.user.isAdmin || req.user.isStaff || req.user.isClubLead;
  
  if (isLeadOrAdmin) {
    if (user) {
      if (!user.clubsJoined.includes(clubName)) user.clubsJoined.push(clubName);
      user.isClubMember = true;
    }
    saveDatabase();

    return res.json({
      success: true,
      message: `Coordinator privileges verified! Auto-approved membership for ${clubName}.`,
      status: 'approved',
      clubsJoined: user ? user.clubsJoined : [clubName]
    });
  }

  // Check existing pending application
  const existingApp = db.clubApplications.find(a => a.studentEmail === userEmail && a.clubName === clubName);

  if (existingApp && existingApp.status === 'pending') {
    return res.json({
      success: true,
      message: `Your membership application for ${clubName} is pending Lead approval.`,
      status: 'pending'
    });
  }

  // Create new pending application
  const newApp = {
    id: `app-${Date.now()}`,
    clubName,
    studentName: req.user.name,
    studentEmail: userEmail,
    department: req.user.department || 'CSE',
    year: req.user.year || '2nd Year',
    status: 'pending',
    appliedAt: new Date().toISOString()
  };

  db.clubApplications.unshift(newApp);
  saveDatabase();

  res.json({
    success: true,
    message: `Application submitted to ${clubName} Coordinator Lead! Awaiting approval.`,
    status: 'pending',
    application: newApp
  });
});

// Get Pending Membership Applications (Restricted to Club Leads, Staff, Admins)
router.get('/applications', verifyToken, (req, res) => {
  const db = getDatabase();
  if (!req.user.isClubLead && !req.user.isStaff && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Permission Denied: Only Club Coordinators, Staff, or Admins can review club membership applications.'
    });
  }

  const applications = db.clubApplications || [];

  res.json({
    success: true,
    count: applications.length,
    data: applications
  });
});

// Approve Pending Application
router.post('/applications/:id/approve', verifyToken, (req, res) => {
  const db = getDatabase();
  if (!req.user.isClubLead && !req.user.isStaff && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Permission Denied: Only Club Coordinators, Staff, or Admins can approve applications.'
    });
  }

  const { id } = req.params;
  const app = (db.clubApplications || []).find(a => a.id === id);

  if (!app) {
    return res.status(404).json({ success: false, message: 'Application record not found.' });
  }

  app.status = 'approved';
  app.approvedBy = req.user.email;
  app.approvedAt = new Date().toISOString();

  // Update user record
  const student = db.users.find(u => u.email === app.studentEmail);
  if (student) {
    if (!student.clubsJoined.includes(app.clubName)) {
      student.clubsJoined.push(app.clubName);
    }
    student.isClubMember = true;
  }

  saveDatabase();

  res.json({
    success: true,
    message: `Application approved! ${app.studentName} is now an official member of ${app.clubName}.`,
    data: app
  });
});

// Reject Pending Application
router.post('/applications/:id/reject', verifyToken, (req, res) => {
  const db = getDatabase();
  if (!req.user.isClubLead && !req.user.isStaff && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Permission Denied.' });
  }

  const { id } = req.params;
  const app = (db.clubApplications || []).find(a => a.id === id);

  if (!app) {
    return res.status(404).json({ success: false, message: 'Application record not found.' });
  }

  app.status = 'rejected';
  app.rejectedBy = req.user.email;

  saveDatabase();

  res.json({
    success: true,
    message: `Application for ${app.studentName} was rejected.`,
    data: app
  });
});

module.exports = router;
