const express = require('express');
const router = express.Router();
const { canteenData } = require('../data/store');
const { verifyToken } = require('../middleware/auth');

// Get College Canteen Menu & Ratings (Open to ALL authenticated students & staff)
router.get('/', verifyToken, (req, res) => {
  res.json({
    success: true,
    rushGauge: canteenData.rushGauge,
    categories: canteenData.menuCategories,
    ratings: canteenData.ratings
  });
});

// Submit Canteen Food Rating & Review (Open to ALL authenticated users)
router.post('/rating', verifyToken, (req, res) => {
  const { dishName, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5 || !dishName) {
    return res.status(400).json({ success: false, message: 'Please provide dish name and a valid rating (1-5 stars).' });
  }

  const newReview = {
    id: `cant-${Date.now()}`,
    dishName: dishName.trim(),
    rating: Number(rating),
    comment: comment ? comment.trim() : 'Great food!',
    studentName: `${req.user.name} (${req.user.designation || 'Student'})`,
    email: req.user.email,
    createdAt: new Date().toISOString()
  };

  canteenData.ratings.unshift(newReview);

  res.status(201).json({
    success: true,
    message: 'Thank you! Canteen rating & feedback submitted.',
    data: newReview
  });
});

module.exports = router;
