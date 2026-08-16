const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../data/dbPersistence');
const { verifyToken } = require('../middleware/auth');

// Get College Canteen Menu & Ratings
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  res.json({
    success: true,
    foodCourts: db.canteenData.foodCourts || ["HUT CAFE", "REC CAFE"],
    rushGauge: db.canteenData.rushGauge,
    categories: db.canteenData.menuCategories,
    ratings: db.canteenData.ratings
  });
});

// Submit Canteen Food Rating & Review
router.post('/rating', verifyToken, (req, res) => {
  const db = getDatabase();
  const { canteenName, dishName, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5 || !dishName) {
    return res.status(400).json({ success: false, message: 'Please provide dish name and a valid rating (1-5 stars).' });
  }

  const newReview = {
    id: `cant-${Date.now()}`,
    canteenName: canteenName || 'REC CAFE',
    dishName: dishName.trim(),
    rating: Number(rating),
    comment: comment ? comment.trim() : 'Great food!',
    studentName: `${req.user.name} (${req.user.designation || 'Student'})`,
    email: req.user.email,
    createdAt: new Date().toISOString()
  };

  db.canteenData.ratings.unshift(newReview);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Thank you! Canteen rating & feedback submitted.',
    data: newReview
  });
});

module.exports = router;
