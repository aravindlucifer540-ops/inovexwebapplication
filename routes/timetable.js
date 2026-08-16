const express = require('express');
const router = express.Router();
const { timetables } = require('../data/store');
const { verifyToken } = require('../middleware/auth');

// Timetable is common & accessible to all authenticated students/staff
router.get('/', verifyToken, (req, res) => {
  const dept = (req.query.dept || 'CSE').toUpperCase();
  const year = req.query.year || '2';
  const section = (req.query.section || 'A').toUpperCase();

  const key = `${dept}-${year}-${section}`;
  const timetable = timetables[key] || timetables['CSE-2-A'];

  res.json({
    success: true,
    data: timetable,
    availableKeys: Object.keys(timetables)
  });
});

// Free/Vacant classroom finder
router.get('/free-rooms', verifyToken, (req, res) => {
  const vacantRooms = [
    { roomNo: "TB-104", block: "Tech Park Block 1", floor: "Ground Floor", status: "Vacant", capacity: 60, ac: false },
    { roomNo: "TB-208", block: "Tech Park Block 1", floor: "1st Floor", status: "Vacant", capacity: 60, ac: false },
    { roomNo: "EB-302", block: "ECE Block 2", floor: "2nd Floor", status: "Vacant", capacity: 70, ac: true },
    { roomNo: "MB-101", block: "Main Block", floor: "Ground Floor", status: "Vacant until 01:00 PM", capacity: 80, ac: true },
    { roomNo: "Lab-3", block: "Tech Park 3rd Floor", floor: "3rd Floor", status: "Open Study Slot", capacity: 40, ac: true }
  ];

  res.json({
    success: true,
    count: vacantRooms.length,
    data: vacantRooms
  });
});

module.exports = router;
