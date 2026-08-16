const express = require('express');
const router = express.Router();
const { getDatabase } = require('../data/dbPersistence');
const { verifyToken } = require('../middleware/auth');

// Timetable is common & accessible to all authenticated students/staff
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  const dept = (req.query.dept || 'CSE').toUpperCase();
  const year = req.query.year || '2';
  const section = (req.query.section || 'A').toUpperCase();

  const key = `${dept}-${year}-${section}`;
  const timetable = db.timetables[key] || db.timetables['CSE-2-A'];

  res.json({
    success: true,
    data: timetable,
    availableKeys: Object.keys(db.timetables)
  });
});

// Free/Vacant classroom finder (featuring official college locations)
router.get('/free-rooms', verifyToken, (req, res) => {
  const vacantRooms = [
    { roomNo: "J Block - J-104", block: "J Block", floor: "Ground Floor", status: "Vacant", capacity: 60, ac: false },
    { roomNo: "I Block - I-208", block: "I Block", floor: "1st Floor", status: "Vacant", capacity: 60, ac: false },
    { roomNo: "A Block - A-302", block: "A Block", floor: "2nd Floor", status: "Vacant", capacity: 70, ac: true },
    { roomNo: "K block - K-101", block: "K block", floor: "Ground Floor", status: "Vacant until 01:00 PM", capacity: 80, ac: true },
    { roomNo: "Indoor auditorium", block: "Indoor auditorium", floor: "Main Stage & Annex", status: "Open Study / Prep Slot", capacity: 500, ac: true },
    { roomNo: "B block - B-205", block: "B block", floor: "2nd Floor", status: "Vacant", capacity: 65, ac: false }
  ];

  res.json({
    success: true,
    count: vacantRooms.length,
    data: vacantRooms
  });
});

module.exports = router;
