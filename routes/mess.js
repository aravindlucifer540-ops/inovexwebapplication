const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken, requireHosteller } = require('../middleware/auth');

// Get Mess Menu & Feedback (Restricted to Hostellers & Admins)
router.get('/', verifyToken, requireHosteller, (req, res) => {
  const db = getDatabase();
  const day = req.query.day || 'Monday';
  const menu = db.messData.weeklyMenu[day] || db.messData.weeklyMenu['Monday'];

  res.json({
    success: true,
    day,
    menu,
    hostels: db.messData.hostels || ["Pearl Hostel", "Ruby Hostel", "Emerald Hostel", "Sapphire Hostel", "Diamond Hostel"],
    weeklyMenuDays: Object.keys(db.messData.weeklyMenu),
    rushGauge: db.messData.rushGauge,
    ratings: db.messData.ratings
  });
});

// Submit Meal Rating & Review
router.post('/rating', verifyToken, requireHosteller, (req, res) => {
  const db = getDatabase();
  const { day, hostelName, mealType, dishName, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    day: day || 'Monday',
    hostelName: hostelName || req.user.designation || 'Pearl Hostel',
    mealType: mealType || 'Lunch',
    dishName: dishName || 'General Meal',
    rating: Number(rating),
    comment: comment ? comment.trim() : 'No written review.',
    studentName: `${req.user.name} (${hostelName || 'Hostel Resident'})`,
    email: req.user.email,
    createdAt: new Date().toISOString()
  };

  db.messData.ratings.unshift(newReview);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Thank you! Meal feedback & rating submitted to Hostel Caterers.',
    data: newReview
  });
});

module.exports = router;
