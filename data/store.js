const bcrypt = require('bcryptjs');
const EMAIL_REGISTRY = require('./emailRegistry');

// In-memory data store with pre-hashed default password for test accounts
const users = [];

// Seed pre-registered accounts for testing immediately
const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

EMAIL_REGISTRY.forEach((reg, index) => {
  users.push({
    id: `usr-${index + 100}`,
    name: reg.name,
    email: reg.email,
    passwordHash: defaultPasswordHash,
    gender: reg.gender,
    department: reg.department,
    year: reg.year,
    role: reg.role,
    isHosteller: reg.isHosteller,
    isClubLead: reg.isClubLead,
    isClubMember: reg.isClubMember,
    isStaff: reg.isStaff,
    isAdmin: reg.role === 'admin',
    clubsJoined: reg.clubsJoined,
    designation: reg.designation,
    createdAt: new Date().toISOString()
  });
});

// Helper to generate realistic weekly timetable for any Dept-Year-Sec
function generateSampleSchedule(dept, year, sec) {
  return {
    "Monday": [
      { period: 1, time: "08:30 - 09:20", subject: `${dept} Core Concepts`, room: `${dept[0]}B-101`, faculty: `Dr. A. Ramesh (${dept})` },
      { period: 2, time: "09:20 - 10:10", subject: `Applied Engineering Math`, room: `${dept[0]}B-101`, faculty: "Prof. K. Aruna (Maths)" },
      { period: 3, time: "10:30 - 11:20", subject: `${dept} Systems & Design`, room: `${dept[0]}B-102`, faculty: `Dr. S. Rajesh (${dept})` },
      { period: 4, time: "11:20 - 12:10", subject: "Professional Ethics & Values", room: "Audi-1", faculty: "Dr. G. Lalitha" },
      { period: 5, time: "01:00 - 02:40", subject: `${dept} Practical Lab`, room: `${dept} Lab-1`, faculty: `Dr. A. Ramesh & Lab Team` }
    ],
    "Tuesday": [
      { period: 1, time: "08:30 - 09:20", subject: "Environmental Studies", room: `${dept[0]}B-101`, faculty: "Dr. G. Lalitha" },
      { period: 2, time: "09:20 - 10:10", subject: `${dept} Systems & Design`, room: `${dept[0]}B-102`, faculty: `Dr. S. Rajesh (${dept})` },
      { period: 3, time: "10:30 - 11:20", subject: `${dept} Core Concepts`, room: `${dept[0]}B-101`, faculty: `Dr. A. Ramesh (${dept})` },
      { period: 4, time: "11:20 - 12:10", subject: "Data Analysis & Statistics", room: `${dept[0]}B-101`, faculty: "Prof. M. Selvam" },
      { period: 5, time: "01:00 - 02:40", subject: "Project Work & Mentoring", room: "Central Library", faculty: "Department Mentors" }
    ],
    "Wednesday": [
      { period: 1, time: "08:30 - 09:20", subject: "Applied Engineering Math", room: `${dept[0]}B-101`, faculty: "Prof. K. Aruna (Maths)" },
      { period: 2, time: "09:20 - 10:10", subject: `${dept} Core Concepts`, room: `${dept[0]}B-101`, faculty: `Dr. A. Ramesh (${dept})` },
      { period: 3, time: "10:30 - 11:20", subject: "Technical Communication", room: "Audi-2", faculty: "Prof. Sarah J" },
      { period: 4, time: "11:20 - 12:10", subject: `${dept} Advanced Elective`, room: `${dept[0]}B-103`, faculty: `Prof. P. Anand` },
      { period: 5, time: "01:00 - 02:40", subject: "Computer Simulation Lab", room: `${dept} Lab-2`, faculty: "Lab Faculty Team" }
    ],
    "Thursday": [
      { period: 1, time: "08:30 - 09:20", subject: `${dept} Systems & Design`, room: `${dept[0]}B-102`, faculty: `Dr. S. Rajesh (${dept})` },
      { period: 2, time: "09:20 - 10:10", subject: `${dept} Advanced Elective`, room: `${dept[0]}B-103`, faculty: `Prof. P. Anand` },
      { period: 3, time: "10:30 - 11:20", subject: "Applied Engineering Math", room: `${dept[0]}B-101`, faculty: "Prof. K. Aruna (Maths)" },
      { period: 4, time: "11:20 - 12:10", subject: `${dept} Core Concepts`, room: `${dept[0]}B-101`, faculty: `Dr. A. Ramesh (${dept})` },
      { period: 5, time: "01:00 - 02:40", subject: "Skill Enhancement Workshop", room: "Mini Audi", faculty: "External Industry Trainer" }
    ],
    "Friday": [
      { period: 1, time: "08:30 - 09:20", subject: "Data Analysis & Statistics", room: `${dept[0]}B-101`, faculty: "Prof. M. Selvam" },
      { period: 2, time: "09:20 - 10:10", subject: "Environmental Studies", room: `${dept[0]}B-101`, faculty: "Dr. G. Lalitha" },
      { period: 3, time: "10:30 - 11:20", subject: `${dept} Advanced Elective`, room: `${dept[0]}B-103`, faculty: `Prof. P. Anand` },
      { period: 4, time: "11:20 - 12:10", subject: "Department Tutor Hour", room: `${dept[0]}B-101`, faculty: `Staff Coordinator` },
      { period: 5, time: "01:00 - 02:40", subject: "Sports & Club Activity Hour", room: "Campus Grounds / Club Hub", faculty: "Physical Ed Team" }
    ]
  };
}

// Populate Timetables across CSE, ECE, IT, MECH, EEE, AIDS, BIOTECH
const timetables = {};
const depts = ["CSE", "ECE", "IT", "MECH", "EEE", "AIDS", "BIOTECH"];
const years = [1, 2, 3, 4];
const sections = ["A", "B"];

depts.forEach(d => {
  years.forEach(y => {
    sections.forEach(s => {
      timetables[`${d}-${y}-${s}`] = {
        dept: d,
        year: y,
        section: s,
        schedule: generateSampleSchedule(d, y, s)
      };
    });
  });
});

// Seed Data for Module 2: Events Feed & RSVP
const events = [
  {
    id: "evt-1",
    title: "REC HackSummit 2026",
    category: "Tech",
    organizer: "Coding Club REC",
    date: "2026-08-28",
    time: "09:00 AM - 09:00 AM (24 Hours)",
    venue: "Main Auditorium & Tech Park",
    description: "Annual 24-Hour National Level Hackathon with cash prizes worth ₹1.5 Lakhs across Web3, AI, and Campus Tech tracks.",
    bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600",
    rsvps: ["admin@rajalakshmi.edu.in", "lead.coding@rajalakshmi.edu.in", "member.rotaract@rajalakshmi.edu.in", "hostel.student1@rajalakshmi.edu.in"],
    createdBy: "lead.coding@rajalakshmi.edu.in",
    createdAt: "2026-08-10T10:00:00Z"
  },
  {
    id: "evt-2",
    title: "RECEPTIONS 2026 - Annual Cultural Fest",
    category: "Cultural",
    organizer: "Rotaract Club & Fine Arts REC",
    date: "2026-09-05",
    time: "04:30 PM - 09:30 PM",
    venue: "REC Open Air Theatre (OAT)",
    description: "Battle of the Bands, Group Dance Championship, Pro-Nite Concert featuring top playback singers!",
    bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600",
    rsvps: ["lead.rotaract@rajalakshmi.edu.in", "member.rotaract@rajalakshmi.edu.in", "hostel.student2@rajalakshmi.edu.in"],
    createdBy: "lead.rotaract@rajalakshmi.edu.in",
    createdAt: "2026-08-12T14:30:00Z"
  },
  {
    id: "evt-3",
    title: "Embedded Systems & IoT Workshop",
    category: "Workshop",
    organizer: "IEEE REC Student Branch",
    date: "2026-09-02",
    time: "10:00 AM - 03:00 PM",
    venue: "ECE Seminar Hall (Block 2)",
    description: "Hands-on workshop on ESP32, Sensor Interfacing, and Blynk Cloud Dashboard integration. Hardware kits provided.",
    bannerUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
    rsvps: ["member.ieee@rajalakshmi.edu.in", "staff.ece@rajalakshmi.edu.in"],
    createdBy: "staff.ece@rajalakshmi.edu.in",
    createdAt: "2026-08-14T09:15:00Z"
  }
];

// Seed Data for Module 3: Lost & Found Board
const lostFoundItems = [
  {
    id: "lf-1",
    title: "Blue Boat Airdopes 141 in Black Case",
    category: "Electronics",
    status: "lost",
    location: "Main Canteen Table 14 (Near Juice Counter)",
    description: "Left my earbuds case while having lunch around 1:30 PM. Has a small Batman sticker on top.",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    contactName: "Rahul Sharma",
    contactPhone: "+91 98401 23456",
    contactEmail: "hostel.student1@rajalakshmi.edu.in",
    dateReported: "2026-08-14",
    reportedBy: "hostel.student1@rajalakshmi.edu.in"
  },
  {
    id: "lf-2",
    title: "Casio FX-991EX Scientific Calculator",
    category: "Electronics",
    status: "found",
    location: "Tech Block Room 302 (Submitted to Security)",
    description: "Found on 2nd bench after Period 4 Maths lecture. Handed over to Block 3 Security guard desk.",
    imageUrl: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?w=500",
    contactName: "Prof. S. Nithya",
    contactPhone: "+91 94440 98765",
    contactEmail: "staff.ece@rajalakshmi.edu.in",
    dateReported: "2026-08-15",
    reportedBy: "staff.ece@rajalakshmi.edu.in"
  },
  {
    id: "lf-3",
    title: "Official REC College ID Card (ECE 2nd Year)",
    category: "ID Card",
    status: "claimed",
    location: "Central Library Ground Floor Desk",
    description: "ID Card belonging to Karthik Raja (21172202045). Successfully claimed by owner.",
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500",
    contactName: "Library Helpdesk",
    contactPhone: "+91 91234 56789",
    contactEmail: "member.rotaract@rajalakshmi.edu.in",
    dateReported: "2026-08-11",
    reportedBy: "admin@rajalakshmi.edu.in"
  }
];

// Seed Data for Module 4: Club Announcements
const clubAnnouncements = [
  {
    id: "ann-1",
    clubName: "Coding Club REC",
    clubTag: "Coding Club",
    title: "⚡ Core Executive Committee Recruitment Drive 2026-27",
    category: "Recruitment",
    tags: ["Recruitment", "Tech", "Hiring"],
    content: "We are hiring Web Devs, Competitive Programmers, UI Designers, and Event Coordinators! Open for 2nd and 3rd year students. Apply before August 30.",
    date: "2026-08-14",
    postedBy: "lead.coding@rajalakshmi.edu.in"
  },
  {
    id: "ann-2",
    clubName: "Rotaract Club REC",
    clubTag: "Rotaract Club",
    title: "🩸 Mega Blood Donation Drive in Association with Rotary Chennai",
    category: "Event",
    tags: ["SocialCause", "Notice", "Volunteer"],
    content: "Join us this Friday at Health Centre Annex. All donors receive official certificate, refreshment box, and OD (On-Duty) approval for missed periods.",
    date: "2026-08-13",
    postedBy: "lead.rotaract@rajalakshmi.edu.in"
  },
  {
    id: "ann-3",
    clubName: "IEEE REC Chapter",
    clubTag: "IEEE REC",
    title: "📜 Call for Student Research Papers - IEEE ICEEC 2026",
    category: "Notice",
    tags: ["Research", "PaperSubmission", "IEEE"],
    content: "Submit your final year project abstracts and research papers for IEEE publication track. Financial sponsorship provided for top 3 papers.",
    date: "2026-08-12",
    postedBy: "staff.ece@rajalakshmi.edu.in"
  }
];

// Seed Data for Module 5: Mess Menu & Ratings (Restricted to Hostellers, Staff, Admin)
const messData = {
  weeklyMenu: {
    "Monday": {
      breakfast: ["Ghee Pongal", "Medu Vada", "Coconut Chutney", "Sambar", "Tea / Coffee / Milk"],
      lunch: ["Steamed Rice", "Garlic Rasam", "Paneer Butter Masala", "Kara Kuzhambu", "Appalam", "Curd"],
      snacks: ["Samosa (2 pcs)", "Mint Chutney", "Hot Tea / Coffee"],
      dinner: ["Chapati (3 pcs)", "Mixed Veg Kurma", "Variety Rice", "Curd Rice", "Pickle", "Banana"]
    },
    "Tuesday": {
      breakfast: ["Idli (4 pcs)", "Vada", "Kara Chutney", "Sambar", "Tea / Coffee"],
      lunch: ["Veg Biryani", "Onion Raitha", "Ennai Kathirikai", "Potato Poriyal", "Rasam", "Curd"],
      snacks: ["Sundal / Bajji", "Tea / Coffee"],
      dinner: ["Dosa (2 pcs)", "Coconut Chutney", "Sambar", "Warm Milk"]
    },
    "Wednesday": {
      breakfast: ["Poori (3 pcs)", "Potato Masala", "Coffee / Tea"],
      lunch: ["White Rice", "Kathirikai Sambar", "Chettinad Veg Gravy", "Keerai Poriyal", "Rasam", "Curd"],
      snacks: ["Veg Cutlet (2 pcs)", "Tomato Ketchup", "Tea"],
      dinner: ["Phulka", "Paneer Tikka Masala", "Curd Rice", "Sweet / Halwa"]
    },
    "Thursday": {
      breakfast: ["Rava Upma", "Coconut Chutney", "Sambar", "Tea / Coffee"],
      lunch: ["Lemon Rice / Curd Rice", "Urulai Potato Roast", "Mor Kuzhambu", "Appalam"],
      snacks: ["Bonda (2 pcs)", "Tea / Coffee"],
      dinner: ["Fried Rice / Noodles", "Veg Manchurian Gravy", "Ice Cream Cup"]
    },
    "Friday": {
      breakfast: ["Masala Dosa", "Sambar", "Red Chutney", "Coffee / Tea"],
      lunch: ["Special South Indian Meals", "Sambar", "Vatha Kuzhambu", "Kootu", "Payasam", "Curd"],
      snacks: ["Pani Puri / Masala Puri", "Tea"],
      dinner: ["Kal Dosa (2 pcs)", "Tomato Chutney", "Milk / Banana"]
    }
  },
  rushGauge: "Moderate",
  ratings: [
    {
      id: "rev-1",
      day: "Monday",
      mealType: "Lunch",
      dishName: "Paneer Butter Masala",
      rating: 5,
      comment: "Paneer was fresh and gravy was super rich today! Best Monday lunch in weeks.",
      studentName: "Rahul Sharma (Hostel Block A)",
      email: "hostel.student1@rajalakshmi.edu.in",
      createdAt: "2026-08-15T12:45:00Z"
    },
    {
      id: "rev-2",
      day: "Monday",
      mealType: "Breakfast",
      dishName: "Ghee Pongal",
      rating: 4,
      comment: "Good hot pongal, chutney needed a bit more salt.",
      studentName: "Deepika R (Hostel Block B)",
      email: "hostel.student2@rajalakshmi.edu.in",
      createdAt: "2026-08-15T09:10:00Z"
    }
  ]
};

// Seed Data for College Canteen & Food Court (Open to ALL Students & Staff)
const canteenData = {
  rushGauge: "Low Rush",
  menuCategories: [
    {
      category: "Snacks & Quick Bites",
      items: [
        { name: "Crispy Samosa (2 pcs)", price: "₹25", rating: 4.8 },
        { name: "Paneer Puff", price: "₹30", rating: 4.6 },
        { name: "Cheese Chilli Toast", price: "₹45", rating: 4.7 },
        { name: "Veg Bread Omelette", price: "₹40", rating: 4.9 }
      ]
    },
    {
      category: "Fresh Juices & Beverages",
      items: [
        { name: "Chilled Mango Milkshake", price: "₹50", rating: 4.9 },
        { name: "Fresh Watermelon Juice", price: "₹40", rating: 4.7 },
        { name: "Cold Coffee with Ice Cream", price: "₹60", rating: 4.8 },
        { name: "Hot Filter Coffee", price: "₹15", rating: 4.9 }
      ]
    },
    {
      category: "Main Food Court Special Meals",
      items: [
        { name: "REC Special Dum Biryani", price: "₹110", rating: 4.9 },
        { name: "Fried Rice / Noodles Combo", price: "₹90", rating: 4.5 },
        { name: "North Indian Thali", price: "₹100", rating: 4.6 },
        { name: "Mini South Indian Meals", price: "₹70", rating: 4.7 }
      ]
    }
  ],
  ratings: [
    {
      id: "cant-1",
      dishName: "REC Special Dum Biryani",
      rating: 5,
      comment: "Biryani today was insanely flavorful! Huge portion size.",
      studentName: "Vignesh Kumar (Day Scholar - IT)",
      email: "student.dayscholar@rajalakshmi.edu.in",
      createdAt: "2026-08-15T13:15:00Z"
    },
    {
      id: "cant-2",
      dishName: "Cold Coffee with Ice Cream",
      rating: 5,
      comment: "Perfect refresh after Period 3 lab!",
      studentName: "Prof. S. Nithya (ECE Staff)",
      email: "staff.ece@rajalakshmi.edu.in",
      createdAt: "2026-08-15T11:40:00Z"
    }
  ]
};

module.exports = {
  users,
  timetables,
  events,
  lostFoundItems,
  clubAnnouncements,
  messData,
  canteenData
};
