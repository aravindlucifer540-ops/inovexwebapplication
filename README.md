# 🚀 Inovex Web Application — REC Campus Companion Backend API

Official Node.js + Express backend server and pre-seeded database for the **REC Campus Companion** application (Rajalakshmi Engineering College).

---

## 📌 Features & Modules
- 🔐 **JWT Authentication & REC Domain Restriction**: Strict enforcement of official `@rajalakshmi.edu.in` campus email domain with bcrypt password hashing.
- 👥 **Role-Based Access Control (RBAC)**: Fine-grained permissions across 6 distinct user personas (Admin/Principal, HOD Staff, Club Lead, Club Member, Hosteller Student, Day Scholar Student).
- 📅 **Timetable Viewer & Vacant Room Finder**: Access weekly class schedules across 7 academic departments (CSE, ECE, IT, MECH, EEE, AIDS, BIOTECH) + real-time empty room locator API.
- 🎟️ **Events Feed & RSVP System**: Browse campus hackathons, fests, and workshops with instant 1-click RSVP. Dynamic event publishing for authorized staff & club leads.
- 🔍 **Lost & Found Community Board**: Report lost or found campus belongings with category filtering, location details, and image upload support.
- 📣 **Club Directory & Announcements Feed**: Role-gated official club notices, recruitment drives, and 1-click club membership application flow.
- 🍲 **Hostel Mess Menu & Meal Feedback**: Weekly breakfast, lunch, snacks, and dinner menu lookup with live meal rating and caterer feedback (restricted to Hostellers & Staff).
- 🍔 **College Canteen & Food Court**: Canteen menu categories, item price lists, live rush level status, and student food reviews.

---

## 🚀 Quick Start Guide for Frontend Developers

### 1. Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 2. Installation & Server Setup
```bash
# Clone the repository
git clone https://github.com/aravindlucifer540-ops/inovexwebapplication.git
cd inovexwebapplication

# Install dependencies
npm install

# Start the API server (Runs on http://localhost:5000)
npm start
```

### 3. Environment Variables
Copy `.env.example` to `.env` if custom configuration is needed:
```env
PORT=5000
JWT_SECRET=REC_CAMPUS_COMPANION_SECRET_KEY_2026
```

---

## 🔑 Pre-Seeded Demo Accounts Sheet

All pre-seeded test accounts use password: `Password@123`

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **👑 Admin / Principal** | `admin@rajalakshmi.edu.in` | `Password@123` | Universal access to ALL 6 modules + Event creation + Club notice posting |
| **👨‍🏫 HOD Staff** | `hod.cse@rajalakshmi.edu.in` | `Password@123` | Universal access + Event publishing |
| **🚀 Club Lead** | `lead.coding@rajalakshmi.edu.in` | `Password@123` | Timetable, Events creation, Club notice posting, Lost & Found, Canteen, Mess |
| **🎨 Club Member** | `member.rotaract@rajalakshmi.edu.in` | `Password@123` | Timetable, Events & RSVP, Lost & Found, Canteen, Club Announcements |
| **🍲 Hosteller Student** | `hostel.student1@rajalakshmi.edu.in` | `Password@123` | Timetable, Events & RSVP, Lost & Found, Canteen, Hostel Mess Ratings |
| **🚌 Day Scholar Student** | `student.dayscholar@rajalakshmi.edu.in` | `Password@123` | Timetable, Events & RSVP, Lost & Found, Canteen |

---

## 📄 Documentation
For detailed API request/response specifications, endpoint paths, headers, and schemas, check [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).

For raw initial seed database structures, inspect [`data/database_dump.json`](./data/database_dump.json).
