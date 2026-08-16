const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const eventsRoutes = require('./routes/events');
const lostFoundRoutes = require('./routes/lostFound');
const clubsRoutes = require('./routes/clubs');
const messRoutes = require('./routes/mess');
const canteenRoutes = require('./routes/canteen');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'REC Campus Companion API',
    timestamp: new Date().toISOString(),
    domain: 'rajalakshmi.edu.in'
  });
});

// Register Routers
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/canteen', canteenRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 REC Campus Companion API Server Running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔐 Auth Domain Restriction: @rajalakshmi.edu.in`);
  console.log(`====================================================`);
});
