const express = require('express');
const router = express.Router();
const { getDatabase, getLastUpdated } = require('../data/dbPersistence');
const { CAMPUS_LOCATIONS, HOSTEL_NAMES } = require('../data/store');
const { verifyToken } = require('../middleware/auth');

// Endpoint: Fetch real-time sync state & timestamps
router.get('/poll', verifyToken, (req, res) => {
  const clientLastTimestamp = parseInt(req.query.since || '0', 10);
  const serverLastUpdated = getLastUpdated();
  const db = getDatabase();

  const isUpdated = serverLastUpdated > clientLastTimestamp;

  res.json({
    success: true,
    isUpdated,
    serverTimestamp: serverLastUpdated,
    data: {
      eventsCount: db.events.length,
      lostFoundCount: db.lostFoundItems.length,
      announcementsCount: db.clubAnnouncements.length,
      messRatingsCount: db.messData.ratings.length,
      canteenRatingsCount: db.canteenData.ratings.length,
      events: db.events,
      lostFoundItems: db.lostFoundItems,
      clubAnnouncements: db.clubAnnouncements,
      messRatings: db.messData.ratings,
      canteenRatings: db.canteenData.ratings
    }
  });
});

// Endpoint: Fetch official campus locations list
router.get('/locations', (req, res) => {
  res.json({
    success: true,
    locations: CAMPUS_LOCATIONS,
    hostels: HOSTEL_NAMES
  });
});

module.exports = router;
