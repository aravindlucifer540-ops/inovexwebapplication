const express = require('express');
const router = express.Router();
const { messData } = require('../data/store');
const { verifyToken, requireHosteller } = require('../middleware/auth');

// Get Mess Menu & Feedback (Restricted to Hostellers & Admins ONLY)
router.get('/', verifyToken, requireHosteller, (req, res) => {
  const day = req.query.day || 'Monday';
  const menu = messData.weeklyMenu[day] || messData.weeklyMenu['Monday'];

  res.json({
    success: true,
    day,
    menu,
    weeklyMenuDays: Object.keys(messData.weeklyMenu),
    rushGauge: messData.rushGauge,
    ratings: messData.ratings
  });
});

// Submit Meal Rating & Review (Restricted to Hostellers & Admins ONLY)
router.post('/rating', verifyToken, requireHosteller, (req, res) => {
  const { day, mealType, dishName, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    day: day || 'Monday',
    mealType: mealType || 'Lunch',
    dishName: dishName || 'General Meal',
    rating: Number(rating),
    comment: comment ? comment.trim() : 'No written review.',
    studentName: `${req.user.name} (${req.user.designation || 'Hostel Resident'})`,
    email: req.user.email,
    createdAt: new Date().toISOString()
  };

  messData.ratings.unshift(newReview);

  res.status(201).json({
    success: true,
    message: 'Thank you! Meal feedback & rating submitted to Hostel Caterers.',
    data: newReview
  });
});

module.exports = router;
