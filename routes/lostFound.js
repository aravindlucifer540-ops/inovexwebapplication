const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken } = require('../middleware/auth');

// Get Lost & Found items
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const status = req.query.status;
  const category = req.query.category;
  const search = req.query.search;

  let filtered = db.lostFoundItems;

  if (status && status !== 'all') {
    filtered = filtered.filter(item => item.status === status);
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(item => item.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(item => item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

// Post Lost or Found item
router.post('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const { title, category, status, location, description, imageUrl, contactPhone } = req.body;

  if (!title || !category || !status || !location || !description) {
    return res.status(400).json({ success: false, message: 'Title, category, status (lost/found), location, and description are required.' });
  }

  const newItem = {
    id: `lf-${Date.now()}`,
    title: title.trim(),
    category,
    status: status.toLowerCase() === 'found' ? 'found' : 'lost',
    location: location.trim(),
    description: description.trim(),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500',
    contactName: req.user.name,
    contactPhone: contactPhone || req.user.phone || '+91 98765 43210',
    contactEmail: req.user.email,
    dateReported: new Date().toISOString().split('T')[0],
    reportedBy: req.user.email
  };

  db.lostFoundItems.unshift(newItem);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Item successfully posted to Lost & Found board.',
    data: newItem
  });
});

// Toggle claimed/resolved status
router.patch('/:id/claim', verifyToken, (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const item = db.lostFoundItems.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Item record not found.' });
  }

  item.status = item.status === 'claimed' ? 'lost' : 'claimed';
  saveDatabase();

  res.json({
    success: true,
    message: item.status === 'claimed' ? 'Item marked as Resolved / Claimed!' : 'Item status reopened.',
    data: item
  });
});

module.exports = router;
