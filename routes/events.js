const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken, requireEventPublisher } = require('../middleware/auth');

// Get all events feed
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const category = req.query.category;
  let filtered = db.events || [];
  if (category && category !== 'All') {
    filtered = filtered.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }
  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
    userRsvps: filtered.filter(e => e.rsvps && e.rsvps.includes(req.user.email)).map(e => e.id)
  });
});

// Helper to generate digital pass object with dynamic QR Code
function generateEventPass(event, user) {
  const ticketId = `REC-TKT-${(event.id || 'evt').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${(user.id || 'usr').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
  const qrData = `REC-OFFICIAL-ENTRY-PASS|ID:${ticketId}|Event:${event.title}|Date:${event.date}|Venue:${event.venue}|Student:${user.name}|Email:${user.email}|Dept:${user.department || 'CSE'}|Year:${user.year || '2nd Year'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  return {
    ticketId,
    qrUrl,
    qrData,
    eventTitle: event.title,
    category: event.category,
    date: event.date,
    time: event.time,
    venue: event.venue,
    organizer: event.organizer,
    studentName: user.name,
    email: user.email,
    department: user.department || 'CSE',
    year: user.year || '2nd Year',
    designation: user.designation || 'Student',
    generatedAt: new Date().toISOString()
  };
}

// Get user's Digital Entry Pass & QR Code for an event
router.get('/:id/pass', verifyToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const event = (db.events || []).find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event record not found.' });
  }

  if (!event.rsvps || !event.rsvps.includes(req.user.email)) {
    return res.status(400).json({ success: false, message: 'You have not RSVPed to this event yet.' });
  }

  const pass = generateEventPass(event, req.user);

  res.json({
    success: true,
    pass
  });
});

// One-click RSVP toggle & QR Entry Pass Generator
router.post('/:id/rsvp', verifyToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const event = (db.events || []).find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  if (!event.rsvps) event.rsvps = [];

  const userEmail = req.user.email;
  const rsvpIndex = event.rsvps.indexOf(userEmail);
  let isRsvpd = false;
  let pass = null;

  if (rsvpIndex > -1) {
    event.rsvps.splice(rsvpIndex, 1);
    isRsvpd = false;
  } else {
    event.rsvps.push(userEmail);
    isRsvpd = true;
    pass = generateEventPass(event, req.user);
  }

  saveDatabase();

  res.json({
    success: true,
    message: isRsvpd ? 'RSVP confirmed! Digital Entry Pass & QR Code generated.' : 'RSVP cancelled.',
    isRsvpd,
    rsvpsCount: event.rsvps.length,
    pass
  });
});

// Upload/Create new event (Restricted to Admin, Staff, and Club Leads)
router.post('/', verifyToken, requireEventPublisher, (req, res) => {
  const db = getDatabase();
  const { title, category, organizer, date, time, venue, description, bannerUrl } = req.body;

  if (!title || !category || !date || !time || !venue || !description) {
    return res.status(400).json({ success: false, message: 'Title, category, date, time, venue, and description are required.' });
  }

  const newEvent = {
    id: `evt-${Date.now()}`,
    title: title.trim(),
    category: category || 'Tech',
    organizer: organizer || req.user.designation || req.user.name,
    date,
    time,
    venue,
    description: description.trim(),
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    rsvps: [req.user.email],
    createdBy: req.user.email,
    createdAt: new Date().toISOString()
  };

  if (!db.events) db.events = [];
  db.events.unshift(newEvent);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Event successfully published to campus feed!',
    data: newEvent
  });
});

module.exports = router;
