const express = require('express');
const router = express.Router();
const { clubAnnouncements, users } = require('../data/store');
const { verifyToken, requireClubAccess } = require('../middleware/auth');

const REC_CLUBS = [
  { id: "club-1", name: "Coding Club REC", tag: "Coding Club", category: "Technical", membersCount: 140, leadName: "Aditya Verma", email: "lead.coding@rajalakshmi.edu.in", description: "Competitive programming, Web Dev, AI/ML projects, and Open Source contributions." },
  { id: "club-2", name: "Rotaract Club REC", tag: "Rotaract Club", category: "Social & Youth", membersCount: 220, leadName: "Priya Sundaram", email: "lead.rotaract@rajalakshmi.edu.in", description: "Blood drives, community service, leadership workshops, and cultural events." },
  { id: "club-3", name: "IEEE REC Student Chapter", tag: "IEEE REC", category: "Technical & Research", membersCount: 95, leadName: "Prof. S. Nithya", email: "staff.ece@rajalakshmi.edu.in", description: "Hardware workshops, paper presentations, international IEEE conferences." },
  { id: "club-4", name: "Entrepreneurship Development Cell (EDC)", tag: "EDC REC", category: "Startups & Business", membersCount: 80, leadName: "Dr. K. Ramaswamy", email: "admin@rajalakshmi.edu.in", description: "Startup incubation, pitch competitions, founder talks, and investor networking." },
  { id: "club-5", name: "Fine Arts & Music Club REC", tag: "Fine Arts Club", category: "Cultural", membersCount: 110, leadName: "Priya Sundaram", email: "lead.rotaract@rajalakshmi.edu.in", description: "Music band, Western/Folk dance, drama, and annual culturals management." }
];

// Get Club Directory (Viewable by everyone)
router.get('/', verifyToken, (req, res) => {
  res.json({
    success: true,
    count: REC_CLUBS.length,
    data: REC_CLUBS
  });
});

// Get Announcements Feed (Restricted to Club Members, Club Leads, Staff, Admin)
router.get('/announcements', verifyToken, requireClubAccess, (req, res) => {
  const { tag, search } = req.query;
  let filtered = clubAnnouncements;

  if (tag && tag !== 'All') {
    filtered = filtered.filter(a => a.tags.includes(tag) || a.clubTag === tag);
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

// Post Announcement (Restricted to Club Leads, Staff, Admin)
router.post('/announcements', verifyToken, (req, res) => {
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
    postedBy: req.user.email
  };

  clubAnnouncements.unshift(newAnn);

  res.status(201).json({
    success: true,
    message: 'Announcement successfully posted to Club Board.',
    data: newAnn
  });
});

// Apply / Join Club
router.post('/join', verifyToken, (req, res) => {
  const { clubName } = req.body;
  if (!clubName) {
    return res.status(400).json({ success: false, message: 'Club name is required.' });
  }

  const user = users.find(u => u.email === req.user.email);
  if (user) {
    if (!user.clubsJoined.includes(clubName)) {
      user.clubsJoined.push(clubName);
      user.isClubMember = true;
    }
  }

  res.json({
    success: true,
    message: `Application submitted! You are now a member of ${clubName}.`,
    clubsJoined: user ? user.clubsJoined : [clubName]
  });
});

module.exports = router;
