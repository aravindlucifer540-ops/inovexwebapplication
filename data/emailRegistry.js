/**
 * Pre-approved REC Official Email Registry Sheet (rajalakshmi.edu.in)
 * Maps official emails to pre-verified roles, designations, hosteller status, and club memberships.
 */

const EMAIL_REGISTRY = [
  {
    email: "admin@rajalakshmi.edu.in",
    name: "Dr. K. Ramaswamy",
    role: "admin",
    gender: "Male",
    department: "Administration",
    year: "Staff",
    isHosteller: true,
    isClubLead: true,
    isClubMember: true,
    isStaff: true,
    clubsJoined: ["Coding Club", "Rotaract Club", "IEEE REC", "EDC REC", "Fine Arts Club"],
    designation: "Campus Admin & Principal (A Block)"
  },
  {
    email: "hod.cse@rajalakshmi.edu.in",
    name: "Dr. V. Murali",
    role: "staff",
    gender: "Male",
    department: "CSE",
    year: "Staff",
    isHosteller: false,
    isClubLead: false,
    isClubMember: true,
    isStaff: true,
    clubsJoined: ["Coding Club", "IEEE REC"],
    designation: "HOD - Computer Science (J Block)"
  },
  {
    email: "staff.ece@rajalakshmi.edu.in",
    name: "Prof. S. Nithya",
    role: "staff",
    gender: "Female",
    department: "ECE",
    year: "Staff",
    isHosteller: false,
    isClubLead: false,
    isClubMember: true,
    isStaff: true,
    clubsJoined: ["IEEE REC"],
    designation: "Assistant Professor - ECE (I Block)"
  },
  {
    email: "lead.coding@rajalakshmi.edu.in",
    name: "Aditya Verma",
    role: "club_lead",
    gender: "Male",
    department: "CSE",
    year: "3rd Year",
    isHosteller: true,
    isClubLead: true,
    isClubMember: true,
    isStaff: false,
    clubsJoined: ["Coding Club"],
    designation: "President - Coding Club REC (Pearl Hostel)"
  },
  {
    email: "lead.rotaract@rajalakshmi.edu.in",
    name: "Priya Sundaram",
    role: "club_lead",
    gender: "Female",
    department: "IT",
    year: "3rd Year",
    isHosteller: false,
    isClubLead: true,
    isClubMember: true,
    isStaff: false,
    clubsJoined: ["Rotaract Club", "Fine Arts Club"],
    designation: "President - Rotaract REC (B block)"
  },
  {
    email: "member.rotaract@rajalakshmi.edu.in",
    name: "Karthik Raja",
    role: "club_member",
    gender: "Male",
    department: "ECE",
    year: "2nd Year",
    isHosteller: true,
    isClubLead: false,
    isClubMember: true,
    isStaff: false,
    clubsJoined: ["Rotaract Club"],
    designation: "Active Member - Rotaract (Emerald Hostel)"
  },
  {
    email: "member.ieee@rajalakshmi.edu.in",
    name: "Ananya Krishnan",
    role: "club_member",
    gender: "Female",
    department: "EEE",
    year: "2nd Year",
    isHosteller: false,
    isClubLead: false,
    isClubMember: true,
    isStaff: false,
    clubsJoined: ["IEEE REC"],
    designation: "Member - IEEE REC Chapter (K block)"
  },
  {
    email: "hostel.student1@rajalakshmi.edu.in",
    name: "Rahul Sharma",
    role: "student",
    gender: "Male",
    department: "CSE",
    year: "2nd Year",
    isHosteller: true,
    isClubLead: false,
    isClubMember: false,
    isStaff: false,
    clubsJoined: [],
    designation: "Hostel Resident (Pearl Hostel - Room 204)"
  },
  {
    email: "hostel.student2@rajalakshmi.edu.in",
    name: "Deepika R",
    role: "student",
    gender: "Female",
    department: "MECH",
    year: "3rd Year",
    isHosteller: true,
    isClubLead: false,
    isClubMember: false,
    isStaff: false,
    clubsJoined: [],
    designation: "Hostel Resident (Ruby Hostel - Room 108)"
  },
  {
    email: "student.dayscholar@rajalakshmi.edu.in",
    name: "Vignesh Kumar",
    role: "student",
    gender: "Male",
    department: "IT",
    year: "1st Year",
    isHosteller: false,
    isClubLead: false,
    isClubMember: false,
    isStaff: false,
    clubsJoined: [],
    designation: "Day Scholar Student (J Block)"
  }
];

module.exports = EMAIL_REGISTRY;
