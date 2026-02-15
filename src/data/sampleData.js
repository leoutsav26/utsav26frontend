// Sample users and initial events. Used only when VITE_API_URL is not set (offline / dev without backend).
// When VITE_API_URL is set, all data comes from the API; this file is not used for persistence.

export const SAMPLE_STUDENTS = [
  {
    id: "stu-1",
    email: "student@test.com",
    role: "student",
    name: "Test Student",
    rollNo: "CEG2024001",
    phone: "9876543210",
    leoId: "LEO_UTSAVJV1410",
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_COORDINATORS = [
  {
    id: "coord-1",
    email: "coord@test.com",
    password: "password",
    role: "coordinator",
    name: "Test Coordinator",
    phone: "9876512345",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "coord-2",
    email: "coord2@test.com",
    password: "password",
    role: "coordinator",
    name: "Pending Coordinator",
    phone: "9876512346",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const ORGANISER = {
  name: "Leo Club of CEG",
  phone: "044-22345678",
};

export const SAMPLE_ADMINS = [
  {
    id: "admin-1",
    email: "admin@test.com",
    password: "password",
    role: "admin",
    name: "Admin User",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_EVENTS = [
  {
    id: "battle-of-bands",
    title: "Battle of Bands",
    description: "Showcase your musical talent in this epic band competition. Bands of 3-8 members can participate.",
    date: "15 Feb 2026",
    time: "6:00 PM",
    venue: "Main Auditorium",
    category: "Music",
    status: "open", // open | ongoing | completed | closed
    cost: 10,
    rules: "Teams of 3-8. Original or cover. 15 min slot.",
    teamSize: "3-8",
    createdAt: new Date().toISOString(),
  },
  {
    id: "code-sprint",
    title: "Code Sprint",
    description: "A 3-hour competitive coding challenge. Solve algorithmic problems and climb the leaderboard.",
    date: "16 Feb 2026",
    time: "10:00 AM",
    venue: "Computer Lab 101",
    category: "Technical",
    status: "open",
    cost: 10,
    rules: "Individual. No internet. Provided problem set.",
    teamSize: "1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "street-dance",
    title: "Street Dance Battle",
    description: "Show off your dance moves in this high-energy street competition.",
    date: "17 Feb 2026",
    time: "3:00 PM",
    venue: "Open Air Theatre",
    category: "Dance",
    status: "open",
    cost: 200,
    rules: "Solo or group. 5 min max.",
    teamSize: "1-5",
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  USERS: "leo_app_users",
  EVENTS: "leo_app_events",
  COORD_ACTIVE: "leo_coord_active",
  PARTICIPANTS: "leo_event_participants",
  LEADERBOARDS: "leo_leaderboards",
  COORD_REQUESTS: "leo_coord_requests",
  WINNERS: "leo_event_winners",
};

function loadJson(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

export function getInitialUsers() {
  const stored = loadJson(STORAGE_KEYS.USERS, null);
  if (stored && Array.isArray(stored.students) && stored.students.length > 0) {
    return stored;
  }
  return {
    students: [...SAMPLE_STUDENTS],
    coordinators: [...SAMPLE_COORDINATORS],
    admins: [...SAMPLE_ADMINS],
  };
}

export function getInitialEvents() {
  const stored = loadJson(STORAGE_KEYS.EVENTS, null);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  return [...INITIAL_EVENTS];
}

export function getInitialCoordActive() {
  return loadJson(STORAGE_KEYS.COORD_ACTIVE, {});
}

export function getInitialParticipants() {
  return loadJson(STORAGE_KEYS.PARTICIPANTS, {});
}

export function getInitialLeaderboards() {
  return loadJson(STORAGE_KEYS.LEADERBOARDS, {});
}

export function getInitialCoordRequests() {
  return loadJson(STORAGE_KEYS.COORD_REQUESTS, []);
}

export function getInitialWinners() {
  return loadJson(STORAGE_KEYS.WINNERS, {});
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function saveEvents(events) {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function saveCoordActive(data) {
  localStorage.setItem(STORAGE_KEYS.COORD_ACTIVE, JSON.stringify(data));
}

export function saveParticipants(data) {
  localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(data));
}

export function saveLeaderboards(data) {
  localStorage.setItem(STORAGE_KEYS.LEADERBOARDS, JSON.stringify(data));
}

export function saveCoordRequests(data) {
  localStorage.setItem(STORAGE_KEYS.COORD_REQUESTS, JSON.stringify(data));
}

export function saveWinners(data) {
  localStorage.setItem(STORAGE_KEYS.WINNERS, JSON.stringify(data));
}

export { STORAGE_KEYS };
