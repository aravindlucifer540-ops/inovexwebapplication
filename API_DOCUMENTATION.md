# 📚 REC Campus Companion — Complete API Reference Guide

Base URL: `http://localhost:5000/api`

---

## 🔒 Authentication & Headers
For protected endpoints, include the JWT token returned from `/auth/login` or `/auth/register` in the HTTP Authorization header:

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

---

## 1. Authentication Routes (`/api/auth`)

### `POST /api/auth/registry-check`
Check if an email address exists in the official REC Roster.
- **Request Body:**
  ```json
  { "email": "student.dayscholar@rajalakshmi.edu.in" }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "foundInRegistry": true,
    "data": { "name": "Vignesh Kumar", "role": "student", "department": "IT" }
  }
  ```

### `POST /api/auth/register`
Register a new student/staff account.
- **Request Body:**
  ```json
  {
    "name": "Karthik R",
    "email": "karthik.r@rajalakshmi.edu.in",
    "password": "Password@123",
    "gender": "Male",
    "department": "CSE",
    "year": "3rd Year",
    "isHosteller": false
  }
  ```
- **Response:** `{ "success": true, "token": "...", "user": { ... } }`

### `POST /api/auth/login`
Sign in with campus credentials.
- **Request Body:**
  ```json
  { "email": "admin@rajalakshmi.edu.in", "password": "Password@123" }
  ```
- **Response:** `{ "success": true, "token": "...", "user": { ... } }`

### `GET /api/auth/me` *(Protected)*
Fetch profile of currently logged-in user.

### `PUT /api/auth/profile` *(Protected)*
Update user profile avatar (Base64/URL), bio, phone, or class details.

---

## 2. Timetable Routes (`/api/timetable`)

### `GET /api/timetable` *(Protected)*
Fetch weekly class schedule.
- **Query Params:** `?dept=CSE&year=2&section=A`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "dept": "CSE",
      "year": "2",
      "section": "A",
      "schedule": {
        "Monday": [
          { "period": 1, "time": "08:30 - 09:20", "subject": "CSE Core Concepts", "room": "CB-101", "faculty": "Dr. A. Ramesh" }
        ]
      }
    }
  }
  ```

### `GET /api/timetable/free-rooms` *(Protected)*
Get real-time list of vacant campus classrooms.

---

## 3. Events Routes (`/api/events`)

### `GET /api/events` *(Protected)*
Get campus event feed.
- **Query Params:** `?category=Tech` (Optional)

### `POST /api/events/:id/rsvp` *(Protected)*
Toggle 1-click event RSVP status for the logged-in user.

### `POST /api/events` *(Protected - Requires Staff/Admin/Club Lead)*
Publish a new event to the campus feed.
- **Request Body:**
  ```json
  {
    "title": "AI & Robotics Expo 2026",
    "category": "Tech",
    "organizer": "Robotics Club",
    "date": "2026-09-10",
    "time": "10:00 AM - 04:00 PM",
    "venue": "Main Auditorium",
    "description": "Exhibition of student robotics projects.",
    "bannerUrl": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600"
  }
  ```

---

## 4. Lost & Found Board (`/api/lost-found`)

### `GET /api/lost-found` *(Protected)*
Get list of reported lost/found items.
- **Query Params:** `?status=lost` or `?status=found`, `?category=Electronics`, `?search=casio`

### `POST /api/lost-found` *(Protected)*
Report a lost or found item.
- **Request Body:**
  ```json
  {
    "title": "Casio Scientific Calculator",
    "category": "Electronics",
    "status": "lost",
    "location": "Library 2nd Floor",
    "description": "Left on table 5",
    "contactPhone": "+91 98765 43210"
  }
  ```

### `PATCH /api/lost-found/:id/claim` *(Protected)*
Toggle item status between `lost`/`found` and `claimed` (resolved).

---

## 5. Club Board (`/api/clubs`)

### `GET /api/clubs` *(Protected)*
Get directory of all campus student clubs.

### `GET /api/clubs/announcements` *(Protected - Club Access)*
Fetch announcements feed for joined clubs.

### `POST /api/clubs/announcements` *(Protected - Lead/Staff/Admin)*
Post official club announcement.

### `POST /api/clubs/join` *(Protected)*
Apply/join a club.
- **Request Body:** `{ "clubName": "Coding Club REC" }`

---

## 6. Hostel Mess Hub (`/api/mess`)

### `GET /api/mess` *(Protected - Hosteller/Staff/Admin)*
Get weekly hostel menu and meal reviews.
- **Query Params:** `?day=Monday`

### `POST /api/mess/rating` *(Protected - Hosteller/Staff/Admin)*
Submit meal feedback and 1-5 star rating.
- **Request Body:**
  ```json
  {
    "day": "Monday",
    "mealType": "Lunch",
    "dishName": "Paneer Butter Masala",
    "rating": 5,
    "comment": "Delicious and fresh!"
  }
  ```

---

## 7. College Canteen Hub (`/api/canteen`)

### `GET /api/canteen` *(Protected)*
Fetch food court menu categories, pricing, and ratings.

### `POST /api/canteen/rating` *(Protected)*
Submit canteen food review.
- **Request Body:**
  ```json
  {
    "dishName": "REC Special Dum Biryani",
    "rating": 5,
    "comment": "Top quality food!"
  }
  ```
