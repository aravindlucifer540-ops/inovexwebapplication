/* ═══════════════════════════════════════════════════════════════════
   REC Campus Companion — Frontend JS (connects to localhost:5000 API)
   ═══════════════════════════════════════════════════════════════════ */

const API = 'http://localhost:5000/api';
let TOKEN = localStorage.getItem('rec_token') || null;
let CURRENT_USER = JSON.parse(localStorage.getItem('rec_user') || 'null');
let isHostellerReg = false;

/* ════════════════════════════════
   UTILITY HELPERS
════════════════════════════════ */
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '.6' : '1';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function stars(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function catClass(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('tech')) return 'tech';
  if (c.includes('cult')) return 'cultural';
  if (c.includes('sport')) return 'sports';
  return 'default';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ════════════════════════════════
   AUTH TAB SWITCHING
════════════════════════════════ */
function switchTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function setHostel(val) {
  isHostellerReg = val;
  document.getElementById('reg-hosteller').value = val;
  document.getElementById('day-btn').classList.toggle('active', !val);
  document.getElementById('host-btn').classList.toggle('active', val);
}

/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  setLoading('login-btn', true);
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    TOKEN = data.token;
    CURRENT_USER = data.user;
    localStorage.setItem('rec_token', TOKEN);
    localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
    enterDashboard();
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    setLoading('login-btn', false);
  }
}

/* ════════════════════════════════
   REGISTER
════════════════════════════════ */
async function handleRegister(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('reg-name').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    department: document.getElementById('reg-dept').value,
    year: document.getElementById('reg-year').value,
    isHosteller: isHostellerReg,
    gender: 'Not specified'
  };
  setLoading('reg-btn', true);
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    TOKEN = data.token;
    CURRENT_USER = data.user;
    localStorage.setItem('rec_token', TOKEN);
    localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
    enterDashboard();
  } catch (err) {
    showError('reg-error', err.message);
  } finally {
    setLoading('reg-btn', false);
  }
}

/* ════════════════════════════════
   DASHBOARD ENTRY / LOGOUT
════════════════════════════════ */
function enterDashboard() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  populateUserInfo();
  navigate('home', document.querySelector('[data-page=home]'));
  loadHomeData();
}

function populateUserInfo() {
  if (!CURRENT_USER) return;
  const initial = (CURRENT_USER.name || 'U')[0].toUpperCase();
  const name = CURRENT_USER.name || 'User';
  const role = CURRENT_USER.role || 'student';
  document.getElementById('sidebar-avatar').textContent = initial;
  document.getElementById('topbar-avatar').textContent = initial;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-role').textContent = role;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];
  // Today's date
  document.getElementById('today-date').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function logout() {
  TOKEN = null; CURRENT_USER = null;
  localStorage.removeItem('rec_token');
  localStorage.removeItem('rec_user');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('auth-overlay').classList.remove('hidden');
}

/* ════════════════════════════════
   NAVIGATION
════════════════════════════════ */
function navigate(page, linkEl) {
  if (linkEl) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    linkEl.classList.add('active');
  }
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
  // Auto-load page data
  if (page === 'events') loadEvents();
  if (page === 'lostfound') loadLostFound();
  if (page === 'clubs') loadClubs();
  if (page === 'mess') loadMess();
  if (page === 'canteen') loadCanteen();
  if (page === 'timetable') loadTimetable();
  // Close sidebar on mobile
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
  return false;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ════════════════════════════════
   HOME PAGE
════════════════════════════════ */
async function loadHomeData() {
  // Load events for stats and preview
  try {
    const evRes = await api('/events');
    const events = evRes.data || [];
    document.getElementById('stat-events').textContent = events.length;
    renderHomeEvents(events.slice(0, 3));
  } catch {
    document.getElementById('stat-events').textContent = '—';
    document.getElementById('home-events-preview').innerHTML = '<div class="empty-state">Could not load events</div>';
  }

  // Clubs count
  try {
    const clRes = await api('/clubs');
    const clubs = clRes.data || [];
    document.getElementById('stat-clubs').textContent = clubs.length;
  } catch {
    document.getElementById('stat-clubs').textContent = '—';
  }

  // Lost items count
  try {
    const lfRes = await api('/lost-found?status=lost');
    const items = lfRes.data || [];
    document.getElementById('stat-lost').textContent = items.length;
  } catch {
    document.getElementById('stat-lost').textContent = '—';
  }

  // Classes today (timetable)
  try {
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const ttRes = await api('/timetable?dept=CSE&year=2&section=A');
    const sched = ttRes.data?.schedule || {};
    const todayClasses = sched[day] || [];
    document.getElementById('stat-classes').textContent = todayClasses.length;
  } catch {
    document.getElementById('stat-classes').textContent = '—';
  }
}

function renderHomeEvents(events) {
  const container = document.getElementById('home-events-preview');
  if (!events.length) {
    container.innerHTML = '<div class="empty-state">No events found</div>';
    return;
  }
  container.innerHTML = events.map(ev => buildEventCard(ev)).join('');
}

function buildEventCard(ev) {
  const cat = ev.category || 'General';
  const bannerHtml = ev.bannerUrl
    ? `<img class="event-banner" src="${ev.bannerUrl}" alt="${ev.title}" loading="lazy" onerror="this.outerHTML='<div class=event-banner-placeholder>🎟️</div>'" />`
    : `<div class="event-banner-placeholder">🎟️</div>`;
  return `
    <div class="event-card">
      ${bannerHtml}
      <div class="event-body">
        <span class="event-cat ${catClass(cat)}">${cat}</span>
        <div class="event-title">${ev.title || 'Event'}</div>
        <div class="event-meta">
          <span>📅 ${ev.date || '—'}</span>
          <span>🕐 ${ev.time || '—'}</span>
          <span>📍 ${ev.venue || '—'}</span>
          <span>🏛️ ${ev.organizer || '—'}</span>
        </div>
        <button class="rsvp-btn ${ev.rsvped ? 'rsvp-active' : ''}"
          onclick="toggleRSVP(this, '${ev._id || ev.id}')">
          ${ev.rsvped ? '✅ RSVPed' : '🎯 RSVP Now'}
        </button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════
   EVENTS PAGE
════════════════════════════════ */
async function loadEvents() {
  const container = document.getElementById('events-content');
  const cat = document.getElementById('ev-category')?.value || '';
  container.innerHTML = '<div class="loading-state">Loading events...</div>';
  try {
    const url = `/events${cat ? `?category=${cat}` : ''}`;
    const res = await api(url);
    const events = res.data || [];
    if (!events.length) { container.innerHTML = '<div class="empty-state">No events found</div>'; return; }
    container.innerHTML = events.map(ev => buildEventCard(ev)).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

async function toggleRSVP(btn, eventId) {
  try {
    await api(`/events/${eventId}/rsvp`, { method: 'POST' });
    const isNowRSVP = !btn.classList.contains('rsvp-active');
    btn.classList.toggle('rsvp-active');
    btn.textContent = isNowRSVP ? '✅ RSVPed' : '🎯 RSVP Now';
    showToast(isNowRSVP ? 'RSVP confirmed!' : 'RSVP removed');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ════════════════════════════════
   TIMETABLE PAGE
════════════════════════════════ */
async function loadTimetable() {
  const container = document.getElementById('timetable-content');
  const dept = document.getElementById('tt-dept')?.value || 'CSE';
  const year = document.getElementById('tt-year')?.value || '2';
  const section = document.getElementById('tt-section')?.value || 'A';
  container.innerHTML = '<div class="loading-state">Loading schedule...</div>';
  try {
    const res = await api(`/timetable?dept=${dept}&year=${year}&section=${section}`);
    const schedule = res.data?.schedule || {};
    const days = Object.keys(schedule);
    if (!days.length) { container.innerHTML = '<div class="empty-state">No schedule found</div>'; return; }

    let html = `<table class="timetable-table">
      <thead><tr>
        <th>Day / Period</th><th>Time</th><th>Subject</th><th>Room</th><th>Faculty</th>
      </tr></thead><tbody>`;

    days.forEach(day => {
      const periods = schedule[day] || [];
      periods.forEach((p, i) => {
        html += `<tr>
          ${i === 0 ? `<td rowspan="${periods.length}"><div class="tt-day-header">${day}</div></td>` : ''}
          <td><span class="period-chip">P${p.period}</span> ${p.time || '—'}</td>
          <td>${p.subject || '—'}</td>
          <td><span class="room-chip">${p.room || '—'}</span></td>
          <td>${p.faculty || '—'}</td>
        </tr>`;
      });
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

async function loadFreeRooms() {
  const container = document.getElementById('free-rooms-content');
  container.innerHTML = '<div class="loading-state">Scanning campus rooms...</div>';
  try {
    const res = await api('/timetable/free-rooms');
    const rooms = res.data || [];
    if (!rooms.length) { container.innerHTML = '<div class="empty-state">No free rooms found right now</div>'; return; }
    container.innerHTML = rooms.map(r =>
      `<div class="room-card">🏫 ${r.room || r}</div>`
    ).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

/* ════════════════════════════════
   LOST & FOUND PAGE
════════════════════════════════ */
async function loadLostFound() {
  const container = document.getElementById('lf-content');
  const status = document.getElementById('lf-status')?.value || '';
  const category = document.getElementById('lf-category')?.value || '';
  const search = document.getElementById('lf-search')?.value || '';
  container.innerHTML = '<div class="loading-state">Loading items...</div>';
  try {
    let url = '/lost-found?';
    if (status) url += `status=${status}&`;
    if (category) url += `category=${category}&`;
    if (search) url += `search=${search}&`;
    const res = await api(url);
    const items = res.data || [];
    if (!items.length) { container.innerHTML = '<div class="empty-state">No items found</div>'; return; }
    container.innerHTML = items.map(item => `
      <div class="lf-card">
        <span class="lf-status ${item.status}">${item.status || '—'}</span>
        <div class="lf-title">${item.title || 'Item'}</div>
        <div class="lf-meta">
          <span>🏷️ ${item.category || '—'}</span>
          <span>📍 ${item.location || '—'}</span>
          ${item.description ? `<span>📝 ${item.description}</span>` : ''}
          ${item.contactPhone ? `<span>📱 ${item.contactPhone}</span>` : ''}
          <span>🕐 ${timeAgo(item.createdAt)}</span>
        </div>
        <button class="claim-btn" onclick="claimItem(this, '${item._id || item.id}')">
          ${item.status === 'claimed' ? '✅ Claimed' : '🤝 Mark as Claimed'}
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

function showReportModal() {
  document.getElementById('report-modal').classList.remove('hidden');
}
function closeReportModal() {
  document.getElementById('report-modal').classList.add('hidden');
}

async function submitReport(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('rep-title').value.trim(),
    status: document.getElementById('rep-status').value,
    category: document.getElementById('rep-category').value,
    location: document.getElementById('rep-location').value.trim(),
    description: document.getElementById('rep-desc').value.trim(),
    contactPhone: document.getElementById('rep-phone').value.trim()
  };
  try {
    await api('/lost-found', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Item reported successfully!');
    closeReportModal();
    loadLostFound();
  } catch (err) {
    showError('rep-error', err.message);
  }
}

async function claimItem(btn, itemId) {
  try {
    await api(`/lost-found/${itemId}/claim`, { method: 'PATCH' });
    btn.textContent = '✅ Claimed';
    btn.style.opacity = '.6';
    showToast('Item marked as claimed!');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ════════════════════════════════
   CLUBS PAGE
════════════════════════════════ */
const clubEmojis = ['🤖','💻','🎨','🎭','📸','🎵','🏆','🚀','🌿','⚽','🧩','🎤'];
async function loadClubs() {
  const container = document.getElementById('clubs-content');
  container.innerHTML = '<div class="loading-state">Loading clubs...</div>';
  try {
    const res = await api('/clubs');
    const clubs = res.data || [];
    if (!clubs.length) { container.innerHTML = '<div class="empty-state">No clubs found</div>'; return; }
    container.innerHTML = clubs.map((club, i) => `
      <div class="club-card">
        <div class="club-icon">${clubEmojis[i % clubEmojis.length]}</div>
        <div class="club-name">${club.name || 'Club'}</div>
        <div class="club-desc">${club.description || 'Join this amazing club!'}</div>
        <div style="font-size:.75rem;color:var(--text-muted)">👥 ${club.members || 0} members</div>
        <button class="join-btn" onclick="joinClub(this, '${club.name || club._id}')">
          Join Club
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

async function joinClub(btn, clubName) {
  try {
    await api('/clubs/join', { method: 'POST', body: JSON.stringify({ clubName }) });
    btn.textContent = '✅ Joined!';
    btn.classList.add('joined');
    showToast(`Joined ${clubName}!`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAnnouncements() {
  const container = document.getElementById('announcements-content');
  container.innerHTML = '<div class="loading-state">Loading announcements...</div>';
  try {
    const res = await api('/clubs/announcements');
    const items = res.data || [];
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No announcements yet</div>';
      return;
    }
    container.innerHTML = items.map(a => `
      <div class="announcement-item">
        <div class="announcement-club">📣 ${a.clubName || 'Club'}</div>
        <div class="announcement-text">${a.message || a.text || '—'}</div>
        <div class="announcement-time">${timeAgo(a.createdAt)}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

/* ════════════════════════════════
   MESS PAGE
════════════════════════════════ */
async function loadMess() {
  const container = document.getElementById('mess-content');
  const day = document.getElementById('mess-day')?.value || 'Monday';
  container.innerHTML = '<div class="loading-state">Loading menu...</div>';
  try {
    const res = await api(`/mess?day=${day}`);
    const menu = res.data?.menu || res.data || {};
    const meals = menu.meals || (Array.isArray(res.data) ? res.data : []);
    if (!meals.length) { container.innerHTML = '<div class="empty-state">No mess data for this day</div>'; return; }
    container.innerHTML = meals.map(meal => `
      <div class="meal-card">
        <div class="meal-type">${meal.mealType || meal.type || 'Meal'}</div>
        <div class="meal-title">${meal.dishName || meal.name || '—'}</div>
        <div class="meal-items">${meal.items || meal.description || '—'}</div>
        <div class="meal-rating">
          <span class="stars">${stars(meal.avgRating || meal.rating)}</span>
          <span style="color:var(--text-muted);font-size:.78rem">${meal.avgRating?.toFixed(1) || meal.rating || 'N/A'} / 5</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

/* ════════════════════════════════
   CANTEEN PAGE
════════════════════════════════ */
async function loadCanteen() {
  const container = document.getElementById('canteen-content');
  container.innerHTML = '<div class="loading-state">Loading canteen menu...</div>';
  try {
    const res = await api('/canteen');
    const data = res.data || {};
    const categories = data.categories || (Array.isArray(res.data) ? res.data : []);
    if (!categories.length) { container.innerHTML = '<div class="empty-state">No canteen data available</div>'; return; }
    container.innerHTML = categories.map(cat => `
      <div class="canteen-category">
        <div class="canteen-cat-title">
          <span>🍽️</span> ${cat.name || cat.category || 'Category'}
          ${cat.rushLevel ? `<span style="margin-left:auto;font-size:.72rem;color:var(--amber)">🔥 Rush: ${cat.rushLevel}</span>` : ''}
        </div>
        <div class="canteen-items-grid">
          ${(cat.items || []).map(item => `
            <div class="canteen-item">
              <span>${item.name || item}</span>
              <span class="canteen-price">₹${item.price ?? ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">⚠️ ${err.message}</div>`;
  }
}

/* ════════════════════════════════
   GLOBAL SEARCH (basic filter)
════════════════════════════════ */
document.getElementById('global-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  if (!q) return;
  // Highlight cards that match
  document.querySelectorAll('.event-title, .lf-title, .club-name, .meal-title, .canteen-item span:first-child').forEach(el => {
    const parent = el.closest('.event-card, .lf-card, .club-card, .meal-card, .canteen-item');
    if (!parent) return;
    parent.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

/* ════════════════════════════════
   INIT — Check saved session
════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  // Set current day in mess selector
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayDay = days[new Date().getDay()];
  const messSel = document.getElementById('mess-day');
  if (messSel) {
    for (let opt of messSel.options) {
      if (opt.value === todayDay) { opt.selected = true; break; }
    }
  }

  // Auto-login if token exists
  if (TOKEN && CURRENT_USER) {
    enterDashboard();
  }
});
