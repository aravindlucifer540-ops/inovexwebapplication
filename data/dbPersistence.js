const fs = require('fs');
const path = require('path');
const initialStore = require('./store');

const DB_FILE_PATH = path.join(__dirname, 'db.json');

let liveStore = null;
let lastUpdatedTimestamp = Date.now();

// Load persistent DB from file or initialize with store.js seed data
function initDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileData = fs.readFileSync(DB_FILE_PATH, 'utf8');
      liveStore = JSON.parse(fileData);
      console.log('📦 Persistent database loaded successfully from db.json');
    } else {
      liveStore = {
        users: initialStore.users,
        timetables: initialStore.timetables,
        events: initialStore.events,
        lostFoundItems: initialStore.lostFoundItems,
        clubAnnouncements: initialStore.clubAnnouncements,
        messData: initialStore.messData,
        canteenData: initialStore.canteenData
      };
      saveDatabase();
      console.log('🌱 Database initialized and seeded to db.json');
    }
  } catch (error) {
    console.error('Error loading db.json, using in-memory fallback:', error);
    liveStore = {
      users: initialStore.users,
      timetables: initialStore.timetables,
      events: initialStore.events,
      lostFoundItems: initialStore.lostFoundItems,
      clubAnnouncements: initialStore.clubAnnouncements,
      messData: initialStore.messData,
      canteenData: initialStore.canteenData
    };
  }
}

function getDatabase() {
  if (!liveStore) {
    initDatabase();
  }
  return liveStore;
}

function saveDatabase() {
  try {
    lastUpdatedTimestamp = Date.now();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(liveStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist database to db.json:', err);
  }
}

function getLastUpdated() {
  return lastUpdatedTimestamp;
}

module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase,
  getLastUpdated
};
