const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken, requireEventPublisher } = require('../middleware/auth');

// Get all events feed
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const category = req.query.category;
  let filtered = db.events;
  if (category && category !== 'All') {
    filtered = db.events.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }
  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
    userRsvps: db.events.filter(e => e.rsvps.includes(req.user.email)).map(e => e.id)
  });
});

// One-click RSVP toggle
router.post('/:id/rsvp', verifyToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const event = db.events.find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found.' });
  }

  const userEmail = req.user.email;
  const rsvpIndex = event.rsvps.indexOf(userEmail);
  let isRsvpd = false;

  if (rsvpIndex > -1) {
    event.rsvps.splice(rsvpIndex, 1);
    isRsvpd = false;
  } else {
    event.rsvps.push(userEmail);
    isRsvpd = true;
  }

  saveDatabase();

  res.json({
    success: true,
    message: isRsvpd ? 'RSVP confirmed! Event added to your schedule.' : 'RSVP cancelled.',
    isRsvpd,
    rsvpsCount: event.rsvps.length
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

  db.events.unshift(newEvent);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Event successfully published to campus feed!',
    data: newEvent
  });
});

module.exports = router;
