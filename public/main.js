/* ═══════════════════════════════════════════════════════════════════
   REC Campus Companion — Complete Frontend Client
   Connects to Node.js / Express backend at http://localhost:5000/api
   ═══════════════════════════════════════════════════════════════════ */

const API = 'http://localhost:5000/api';
let TOKEN = localStorage.getItem('rec_token') || null;
let CURRENT_USER = JSON.parse(localStorage.getItem('rec_user') || 'null');
let isHostellerReg = false;

// Global state caches
let canteenRawData = null;
let selectedCanteenCourt = 'All';
let selectedMessDayName = 'Monday';
let userApplicationsCache = [];

/* ════════════════════════════════
   UTILITY HELPERS
════════════════════════════════ */
function escapeHTML(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid response from server' }));
  
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `HTTP ${res.status}: Request failed`);
  }
  return data;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerHTML = (type === 'success' ? '✅ ' : '❌ ') + escapeHTML(msg);
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 4000);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function stars(rating) {
  const num = Math.round(Number(rating) || 5);
  const clamped = Math.max(1, Math.min(5, num));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function catClass(cat = '') {
  const c = String(cat).toLowerCase();
  if (c.includes('tech')) return 'tech';
  if (c.includes('cult')) return 'cultural';
  if (c.includes('sport')) return 'sports';
  return 'default';
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
}

/* ════════════════════════════════
   AUTH & TAB SWITCHING
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

function fillLogin(email) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = 'Password@123';
  switchTab('login');
}

async function checkRegistryEmail() {
  const emailInput = document.getElementById('reg-email');
  const badge = document.getElementById('registry-badge');
  const email = emailInput?.value?.trim();
  if (!email || !email.endsWith('@rajalakshmi.edu.in')) return;

  try {
    const res = await api('/auth/registry-check', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (res.foundInRegistry && res.data) {
      badge.textContent = `✓ REC Roster Verified: ${res.data.name} (${res.data.department} - ${res.data.year})`;
      badge.classList.remove('hidden');
      if (res.data.name) document.getElementById('reg-name').value = res.data.name;
      if (res.data.department) document.getElementById('reg-dept').value = res.data.department;
      if (res.data.year) document.getElementById('reg-year').value = res.data.year;
      if (typeof res.data.isHosteller !== 'undefined') setHostel(res.data.isHosteller);
    } else {
      badge.textContent = '✓ Authorized @rajalakshmi.edu.in Campus Domain';
      badge.classList.remove('hidden');
    }
  } catch (err) {
    console.warn('Registry check failed:', err);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    TOKEN = data.token;
    CURRENT_USER = data.user;
    localStorage.setItem('rec_token', TOKEN);
    localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
    showToast(`Welcome back, ${CURRENT_USER.name}!`);
    enterDashboard();
  } catch (err) {
    showError('login-error', err.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('reg-name').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    department: document.getElementById('reg-dept').value,
    year: document.getElementById('reg-year').value,
    isHosteller: isHostellerReg
  };
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    TOKEN = data.token;
    CURRENT_USER = data.user;
    localStorage.setItem('rec_token', TOKEN);
    localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
    showToast('Account registered successfully!');
    enterDashboard();
  } catch (err) {
    showError('reg-error', err.message);
  }
}

function enterDashboard() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  populateUserInfo();
  navigate('home', document.querySelector('[data-page=home]'));
  loadHomeData();
  checkPendingLeadAppsCount();
}

function populateUserInfo() {
  if (!CURRENT_USER) return;
  const initial = (CURRENT_USER.name || 'U')[0].toUpperCase();
  const name = CURRENT_USER.name || 'Student';
  const role = CURRENT_USER.role || 'Student';

  // Avatars
  const pfpImg = document.getElementById('sidebar-avatar-img');
  const pfpTxt = document.getElementById('sidebar-avatar-txt');
  if (CURRENT_USER.pfpUrl) {
    pfpImg.src = CURRENT_USER.pfpUrl;
    pfpImg.style.display = 'block';
    pfpTxt.style.display = 'none';
  } else {
    pfpTxt.textContent = initial;
    pfpTxt.style.display = 'flex';
    pfpImg.style.display = 'none';
  }

  document.getElementById('topbar-avatar').textContent = initial;
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-role').textContent = CURRENT_USER.designation || role;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];
  document.getElementById('role-pill').textContent = role;

  // Banner details
  const bName = document.getElementById('home-banner-name');
  const bDet = document.getElementById('home-banner-details');
  const bPfp = document.getElementById('home-banner-pfp');
  const bInit = document.getElementById('home-banner-initial');
  const bTags = document.getElementById('home-banner-tags');

  if (bName) bName.textContent = `${name} (${CURRENT_USER.year || '2nd Year'})`;
  if (bDet) bDet.textContent = `${CURRENT_USER.department || 'CSE'} Department • ${CURRENT_USER.designation || 'Student'}`;
  
  if (bPfp && CURRENT_USER.pfpUrl) {
    bPfp.src = CURRENT_USER.pfpUrl;
    bPfp.style.display = 'block';
    if (bInit) bInit.style.display = 'none';
  } else if (bInit) {
    bInit.textContent = initial;
    bInit.style.display = 'flex';
    if (bPfp) bPfp.style.display = 'none';
  }

  if (bTags) {
    let tagsHtml = `<span class="banner-tag">${CURRENT_USER.isHosteller ? '🍲 Hosteller' : '🚌 Day Scholar'}</span>`;
    if (CURRENT_USER.isClubLead) tagsHtml += `<span class="banner-tag" style="background:rgba(236,72,153,.15);color:var(--pink)">🚀 Club Lead</span>`;
    if (CURRENT_USER.isStaff) tagsHtml += `<span class="banner-tag" style="background:rgba(16,185,129,.15);color:var(--emerald)">👨‍🏫 Staff</span>`;
    if (CURRENT_USER.isAdmin) tagsHtml += `<span class="banner-tag" style="background:rgba(245,158,11,.15);color:var(--amber)">👑 Admin</span>`;
    bTags.innerHTML = tagsHtml;
  }

  // Toggle role-gated action buttons
  const isPublisher = CURRENT_USER.isAdmin || CURRENT_USER.isStaff || CURRENT_USER.isClubLead;
  document.getElementById('create-event-btn')?.classList.toggle('hidden', !isPublisher);
  document.getElementById('post-announcement-btn')?.classList.toggle('hidden', !isPublisher);
  document.getElementById('view-apps-btn')?.classList.toggle('hidden', !isPublisher);
  document.getElementById('topbar-lead-apps-btn')?.classList.toggle('hidden', !isPublisher);

  // Today Date
  const dateEl = document.getElementById('today-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}

function logout() {
  TOKEN = null; CURRENT_USER = null;
  localStorage.removeItem('rec_token');
  localStorage.removeItem('rec_user');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('auth-overlay').classList.remove('hidden');
  showToast('Signed out of campus session.');
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

  if (page === 'canteen') loadCanteen();
  if (page === 'clubs') loadClubs();
  if (page === 'events') loadEvents();
  if (page === 'timetable') loadTimetable();
  if (page === 'lostfound') loadLostFound();
  if (page === 'mess') loadMess();

  if (window.innerWidth < 768) {
    document.getElementById('sidebar')?.classList.remove('open');
  }
  return false;
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

/* ════════════════════════════════
   1. HOME PAGE
════════════════════════════════ */
async function loadHomeData() {
  try {
    const cRes = await api('/canteen');
    if (cRes.rushGauge) {
      document.getElementById('stat-canteen-rush').textContent = cRes.rushGauge;
    }
  } catch (err) { console.warn('Home canteen fetch failed:', err); }

  try {
    const evRes = await api('/events');
    const events = evRes.data || [];
    document.getElementById('stat-events-count').textContent = events.length;
    renderHomeEvents(events.slice(0, 3));
  } catch (err) {
    console.warn('Home events fetch failed:', err);
    document.getElementById('home-events-grid').innerHTML = '<div class="empty-state">Could not connect to events API</div>';
  }

  try {
    const lfRes = await api('/lost-found?status=lost');
    const items = lfRes.data || [];
    document.getElementById('stat-lost-count').textContent = items.length;
  } catch (err) { console.warn('Home lost items fetch failed:', err); }
}

function renderHomeEvents(events) {
  const container = document.getElementById('home-events-grid');
  if (!container) return;
  if (!events.length) {
    container.innerHTML = '<div class="empty-state">No upcoming campus events at the moment.</div>';
    return;
  }
  container.innerHTML = events.map(ev => buildEventCard(ev)).join('');
}

/* ════════════════════════════════
   2. CLUBS & LEAD APPROVAL WORKFLOW
════════════════════════════════ */
const clubEmojis = {
  'Coding Club REC': '💻',
  'Rotaract Club REC': '🤝',
  'IEEE REC Student Chapter': '⚡',
  'Entrepreneurship Development Cell (EDC)': '🚀',
  'Fine Arts & Music Club REC': '🎨'
};

async function loadClubs() {
  const container = document.getElementById('clubs-directory-content');
  if (container) container.innerHTML = '<div class="loading-state">Loading registered campus clubs...</div>';

  try {
    const res = await api('/clubs');
    const clubs = res.data || [];
    userApplicationsCache = res.userApplications || [];
    renderClubsDirectory(clubs);
    loadAnnouncements();
    checkPendingLeadAppsCount();
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

function renderClubsDirectory(clubs) {
  const container = document.getElementById('clubs-directory-content');
  if (!container) return;

  const joinedList = CURRENT_USER?.clubsJoined || [];

  container.innerHTML = clubs.map(club => {
    const isJoined = joinedList.some(c => c.toLowerCase() === club.name.toLowerCase() || c.toLowerCase() === club.tag.toLowerCase());
    const pendingApp = userApplicationsCache.find(a => a.clubName === club.name && a.status === 'pending');
    const emoji = clubEmojis[club.name] || '🚀';

    let btnText = '🚀 Apply to Join Club';
    let btnClass = '';
    
    if (isJoined) {
      btnText = '✓ Approved Member';
      btnClass = 'joined';
    } else if (pendingApp) {
      btnText = '⏳ Application Pending Lead Approval';
      btnClass = 'pending';
    }

    return `
      <div class="club-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="club-icon">${emoji}</div>
          <span class="banner-tag">${escapeHTML(club.category)}</span>
        </div>
        <div class="club-name">${escapeHTML(club.name)}</div>
        <div class="club-desc">${escapeHTML(club.description)}</div>
        <div style="font-size:.78rem; color:var(--text-secondary);">
          👤 Lead: <strong>${escapeHTML(club.leadName)}</strong> • 👥 ${club.membersCount || 100}+ Members
        </div>
        <button class="join-btn ${btnClass}" onclick="joinClub(this, '${escapeHTML(club.name)}')">
          ${btnText}
        </button>
      </div>
    `;
  }).join('');
}

async function joinClub(btn, clubName) {
  try {
    const res = await api('/clubs/join', {
      method: 'POST',
      body: JSON.stringify({ clubName })
    });

    if (res.status === 'approved') {
      showToast(res.message || `You are now a member of ${clubName}!`);
      if (CURRENT_USER) {
        CURRENT_USER.clubsJoined = res.clubsJoined || [...(CURRENT_USER.clubsJoined || []), clubName];
        CURRENT_USER.isClubMember = true;
        localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
      }
      btn.textContent = '✓ Approved Member';
      btn.className = 'join-btn joined';
    } else {
      showToast(res.message || 'Application submitted to Coordinator Lead!');
      btn.textContent = '⏳ Application Pending Lead Approval';
      btn.className = 'join-btn pending';
    }
    loadClubs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function checkPendingLeadAppsCount() {
  if (!CURRENT_USER || (!CURRENT_USER.isClubLead && !CURRENT_USER.isStaff && !CURRENT_USER.isAdmin)) return;

  try {
    const res = await api('/clubs/applications');
    const pendingApps = (res.data || []).filter(a => a.status === 'pending');
    const badgeEl = document.getElementById('lead-pending-count');
    if (badgeEl) badgeEl.textContent = pendingApps.length;
  } catch (err) {
    console.warn('Check lead apps failed:', err);
  }
}

async function openClubAppsModal() {
  const modal = document.getElementById('club-apps-modal');
  const container = document.getElementById('club-apps-list');
  if (modal) modal.classList.remove('hidden');
  if (container) container.innerHTML = '<div class="loading-state">Fetching membership applications...</div>';

  try {
    const res = await api('/clubs/applications');
    const apps = res.data || [];
    const pendingApps = apps.filter(a => a.status === 'pending');

    if (!pendingApps.length) {
      container.innerHTML = '<div class="empty-state">🎉 No pending membership applications at the moment!</div>';
      return;
    }

    container.innerHTML = pendingApps.map(a => `
      <div class="app-item-card">
        <div class="app-student-info">
          <div class="app-student-name">👤 ${escapeHTML(a.studentName)}</div>
          <div class="app-student-details">
            ✉ ${escapeHTML(a.studentEmail)} • ${escapeHTML(a.department)} (${escapeHTML(a.year)})
          </div>
          <div style="font-size:.74rem; color:var(--indigo); margin-top:2px;">
            Target Club: <strong>${escapeHTML(a.clubName)}</strong> • Applied ${timeAgo(a.appliedAt)}
          </div>
        </div>
        <div class="app-actions">
          <button class="btn-sm" style="background:rgba(16,185,129,.15);color:var(--emerald);" onclick="approveApp('${a.id}')">
            ✓ Approve
          </button>
          <button class="btn-sm" style="background:rgba(239,68,68,.15);color:#f87171;" onclick="rejectApp('${a.id}')">
            ✕ Reject
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

async function approveApp(appId) {
  try {
    const res = await api(`/clubs/applications/${appId}/approve`, { method: 'POST' });
    showToast(res.message || 'Student membership approved!');
    openClubAppsModal();
    checkPendingLeadAppsCount();
    loadClubs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectApp(appId) {
  try {
    const res = await api(`/clubs/applications/${appId}/reject`, { method: 'POST' });
    showToast(res.message || 'Application rejected');
    openClubAppsModal();
    checkPendingLeadAppsCount();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAnnouncements() {
  const container = document.getElementById('announcements-content');
  const gatedMsg = document.getElementById('announcements-gated-msg');
  const tag = document.getElementById('ann-tag-filter')?.value || 'All';
  const search = document.getElementById('ann-search')?.value?.trim() || '';

  if (container) container.innerHTML = '<div class="loading-state">Loading announcements feed...</div>';

  try {
    let url = '/clubs/announcements?';
    if (tag && tag !== 'All') url += `tag=${encodeURIComponent(tag)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    const res = await api(url);
    if (gatedMsg) gatedMsg.classList.add('hidden');

    const items = res.data || [];
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No announcements posted for this filter.</div>';
      return;
    }

    container.innerHTML = items.map(a => `
      <div class="announcement-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="announcement-club">📣 ${escapeHTML(a.clubName)}</div>
          <span class="announcement-time">${escapeHTML(a.date || '')} (${timeAgo(a.createdAt)})</span>
        </div>
        <div class="announcement-title">${escapeHTML(a.title)}</div>
        <div class="announcement-text">${escapeHTML(a.content)}</div>
      </div>
    `).join('');
  } catch (err) {
    if (gatedMsg) gatedMsg.classList.remove('hidden');
    if (container) container.innerHTML = `<div class="empty-state">⚠️ Access Restricted: ${escapeHTML(err.message)}</div>`;
  }
}

function openAnnouncementModal() {
  document.getElementById('announcement-modal')?.classList.remove('hidden');
}

async function submitAnnouncement(e) {
  e.preventDefault();
  const payload = {
    clubName: document.getElementById('ca-club').value.trim(),
    title: document.getElementById('ca-title').value.trim(),
    content: document.getElementById('ca-content').value.trim()
  };

  try {
    const res = await api('/clubs/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Announcement posted!');
    closeModal('announcement-modal');
    loadAnnouncements();
  } catch (err) {
    showError('ca-error', err.message);
  }
}

/* ════════════════════════════════
   3. EVENTS & DIGITAL PASS WITH QR
════════════════════════════════ */
async function loadEvents() {
  const container = document.getElementById('events-feed-content');
  const category = document.getElementById('ev-category')?.value || 'All';
  if (container) container.innerHTML = '<div class="loading-state">Loading campus events feed...</div>';

  try {
    let url = '/events?';
    if (category && category !== 'All') url += `category=${encodeURIComponent(category)}`;

    const res = await api(url);
    const events = res.data || [];

    if (!events.length) {
      container.innerHTML = '<div class="empty-state">No campus events published for this category.</div>';
      return;
    }

    container.innerHTML = events.map(ev => buildEventCard(ev)).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

function buildEventCard(ev) {
  const cat = ev.category || 'Tech';
  const isRsvped = ev.rsvped || (ev.rsvps && CURRENT_USER && ev.rsvps.includes(CURRENT_USER.email));
  const rsvpCount = ev.rsvps ? ev.rsvps.length : 1;

  const bannerHtml = ev.bannerUrl
    ? `<img class="event-banner" src="${escapeHTML(ev.bannerUrl)}" alt="${escapeHTML(ev.title)}" loading="lazy" onerror="this.outerHTML='<div class=event-banner-placeholder>🎟️</div>'" />`
    : `<div class="event-banner-placeholder">🎟️</div>`;

  return `
    <div class="event-card">
      ${bannerHtml}
      <div class="event-body">
        <span class="event-cat ${catClass(cat)}">${escapeHTML(cat)}</span>
        <div class="event-title">${escapeHTML(ev.title)}</div>
        <div class="event-meta">
          <span>📅 Date: <strong>${escapeHTML(ev.date)}</strong></span>
          <span>🕐 Time: ${escapeHTML(ev.time)}</span>
          <span>📍 Venue: ${escapeHTML(ev.venue)}</span>
          <span>🏛 Organizer: ${escapeHTML(ev.organizer)}</span>
        </div>
        <div style="font-size:.78rem; color:var(--text-secondary); margin-top:4px;">
          ${escapeHTML(ev.description)}
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;">
          <button class="rsvp-btn ${isRsvped ? 'rsvp-active' : ''}" onclick="toggleRSVP(this, '${ev.id || ev._id}')">
            ${isRsvped ? `✓ RSVPed (${rsvpCount})` : `🎯 RSVP Now (${rsvpCount})`}
          </button>
          ${isRsvped ? `<button class="pass-view-btn" onclick="fetchAndShowPass('${ev.id || ev._id}')">🎫 View QR Entry Pass</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

async function toggleRSVP(btn, eventId) {
  try {
    const res = await api(`/events/${eventId}/rsvp`, { method: 'POST' });
    const isNow = res.isRsvpd;
    const count = res.rsvpsCount || 1;
    btn.classList.toggle('rsvp-active', isNow);
    btn.textContent = isNow ? `✓ RSVPed (${count})` : `🎯 RSVP Now (${count})`;
    showToast(res.message || (isNow ? 'RSVP confirmed! Digital Entry Pass generated.' : 'RSVP cancelled.'));

    if (isNow && res.pass) {
      openEventPassModal(res.pass);
    }
    loadEvents();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function fetchAndShowPass(eventId) {
  try {
    const res = await api(`/events/${eventId}/pass`);
    if (res.pass) openEventPassModal(res.pass);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEventPassModal(pass) {
  if (!pass) return;
  document.getElementById('pass-qr-img').src = pass.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pass.ticketId)}`;
  document.getElementById('pass-ticket-id').textContent = pass.ticketId;
  document.getElementById('pass-event-title').textContent = pass.eventTitle;
  document.getElementById('pass-event-time').textContent = `${pass.date} | ${pass.time}`;
  document.getElementById('pass-event-venue').textContent = pass.venue;
  document.getElementById('pass-student-name').textContent = pass.studentName;
  document.getElementById('pass-student-email').textContent = pass.email;
  document.getElementById('pass-student-dept').textContent = pass.department;
  document.getElementById('pass-student-year').textContent = pass.year;

  document.getElementById('event-pass-modal')?.classList.remove('hidden');
}

function openCreateEventModal() {
  document.getElementById('create-event-modal')?.classList.remove('hidden');
}

async function submitCreateEvent(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('ce-title').value.trim(),
    category: document.getElementById('ce-category').value,
    organizer: document.getElementById('ce-organizer').value.trim(),
    date: document.getElementById('ce-date').value,
    time: document.getElementById('ce-time').value.trim(),
    venue: document.getElementById('ce-venue').value.trim(),
    description: document.getElementById('ce-desc').value.trim(),
    bannerUrl: document.getElementById('ce-banner').value.trim()
  };

  try {
    const res = await api('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Event published successfully!');
    closeModal('create-event-modal');
    loadEvents();
  } catch (err) {
    showError('ce-error', err.message);
  }
}

/* ════════════════════════════════
   4. CANTEEN MODULE
════════════════════════════════ */
async function loadCanteen() {
  const categoriesContainer = document.getElementById('canteen-categories-content');
  if (categoriesContainer) categoriesContainer.innerHTML = '<div class="loading-state">Fetching canteen menu & food courts...</div>';

  try {
    canteenRawData = await api('/canteen');
    
    if (canteenRawData.rushGauge) {
      document.getElementById('canteen-rush-gauge').textContent = canteenRawData.rushGauge;
    }
    if (canteenRawData.foodCourts) {
      document.getElementById('canteen-courts-list').textContent = canteenRawData.foodCourts.join(', ');
    }

    renderCanteenMenu();
    renderCanteenReviews(canteenRawData.ratings || []);
  } catch (err) {
    if (categoriesContainer) categoriesContainer.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

function filterCanteenCourt(court, btn) {
  selectedCanteenCourt = court;
  document.querySelectorAll('#page-canteen .filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderCanteenMenu();
}

function renderCanteenMenu() {
  const container = document.getElementById('canteen-categories-content');
  if (!container || !canteenRawData) return;

  const searchQuery = document.getElementById('canteen-search')?.value?.toLowerCase()?.trim() || '';
  const categories = canteenRawData.categories || [];

  let html = '';
  let totalItemsFound = 0;

  categories.forEach(cat => {
    let items = cat.items || [];
    
    if (selectedCanteenCourt !== 'All') {
      items = items.filter(i => (i.availableAt || '').includes(selectedCanteenCourt));
    }

    if (searchQuery) {
      items = items.filter(i => 
        (i.name || '').toLowerCase().includes(searchQuery) || 
        (i.availableAt || '').toLowerCase().includes(searchQuery)
      );
    }

    if (items.length > 0) {
      totalItemsFound += items.length;
      html += `
        <div class="canteen-category-card">
          <div class="canteen-cat-header">
            <span>🍽️</span> ${escapeHTML(cat.category || 'Special Category')}
          </div>
          <div class="canteen-items-grid">
            ${items.map(item => `
              <div class="canteen-item-card">
                <div>
                  <div class="dish-name">${escapeHTML(item.name)}</div>
                  <div style="margin-top: 4px; display:flex; gap:6px; align-items:center;">
                    <span class="stars-display">${stars(item.rating)}</span>
                    <span style="font-size:.74rem;color:var(--text-muted)">(${item.rating || '4.5'})</span>
                  </div>
                </div>
                <div class="dish-meta">
                  <span class="dish-price">${escapeHTML(item.price)}</span>
                  <span class="dish-outlet">${escapeHTML(item.availableAt || 'Food Court')}</span>
                </div>
                <button class="btn-sm" style="margin-top:4px;" onclick="openCanteenReviewForDish('${escapeHTML(item.name)}')">
                  ⭐ Rate Dish
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  if (totalItemsFound === 0) {
    container.innerHTML = '<div class="empty-state">No canteen items found matching your filter/search.</div>';
  } else {
    container.innerHTML = html;
  }
}

function renderCanteenReviews(ratings) {
  const container = document.getElementById('canteen-reviews-content');
  if (!container) return;
  if (!ratings.length) {
    container.innerHTML = '<div class="empty-state">No food reviews posted yet. Be the first to rate!</div>';
    return;
  }

  container.innerHTML = ratings.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div>
          <div class="review-dish">${escapeHTML(r.dishName || 'Food Item')}</div>
          <div style="font-size:.74rem;color:var(--indigo);font-weight:600;">${escapeHTML(r.canteenName || 'HUT CAFE')}</div>
        </div>
        <span class="stars-display">${stars(r.rating)}</span>
      </div>
      <div class="review-comment">"${escapeHTML(r.comment)}"</div>
      <div class="review-student">
        By ${escapeHTML(r.studentName || 'Student')} • ${timeAgo(r.createdAt)}
      </div>
    </div>
  `).join('');
}

function openCanteenReviewModal() {
  document.getElementById('canteen-review-modal')?.classList.remove('hidden');
}

function openCanteenReviewForDish(dishName) {
  document.getElementById('cr-dish').value = dishName;
  openCanteenReviewModal();
}

function setStarRating(targetInputId, rating) {
  document.getElementById(targetInputId).value = rating;
  const container = document.getElementById(targetInputId)?.closest('.star-rating-select');
  if (!container) return;
  const btns = container.querySelectorAll('.star-btn');
  btns.forEach((btn, idx) => {
    btn.classList.toggle('active', idx < rating);
  });
}

async function submitCanteenRating(e) {
  e.preventDefault();
  const payload = {
    canteenName: document.getElementById('cr-court').value,
    dishName: document.getElementById('cr-dish').value.trim(),
    rating: Number(document.getElementById('cr-rating').value),
    comment: document.getElementById('cr-comment').value.trim()
  };

  try {
    const res = await api('/canteen/rating', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Canteen review submitted!');
    closeModal('canteen-review-modal');
    loadCanteen();
  } catch (err) {
    showError('cr-error', err.message);
  }
}

/* ════════════════════════════════
   5. TIMETABLE & ROOMS
════════════════════════════════ */
async function loadTimetable() {
  const container = document.getElementById('timetable-content');
  const dept = document.getElementById('tt-dept')?.value || 'CSE';
  const year = document.getElementById('tt-year')?.value || '2';
  const section = document.getElementById('tt-section')?.value || 'A';

  if (container) container.innerHTML = '<div class="loading-state">Loading timetable schedule...</div>';

  try {
    const res = await api(`/timetable?dept=${dept}&year=${year}&section=${section}`);
    const schedule = res.data?.schedule || {};
    const days = Object.keys(schedule);

    if (!days.length) {
      container.innerHTML = '<div class="empty-state">No schedule record found for selected class.</div>';
      return;
    }

    let html = `<table class="timetable-table">
      <thead><tr>
        <th>Day</th><th>Period & Time</th><th>Subject</th><th>Classroom</th><th>Faculty</th>
      </tr></thead><tbody>`;

    days.forEach(day => {
      const periods = schedule[day] || [];
      periods.forEach((p, idx) => {
        html += `<tr>
          ${idx === 0 ? `<td rowspan="${periods.length}"><div class="tt-day-header">${escapeHTML(day)}</div></td>` : ''}
          <td><span class="period-chip">Period ${p.period}</span> ${escapeHTML(p.time || '')}</td>
          <td><strong>${escapeHTML(p.subject)}</strong></td>
          <td><span class="room-chip">🏫 ${escapeHTML(p.room)}</span></td>
          <td>${escapeHTML(p.faculty || 'Staff')}</td>
        </tr>`;
      });
    });

    html += '</tbody></table>';
    container.innerHTML = html;
    loadFreeRooms();
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

async function loadFreeRooms() {
  const container = document.getElementById('free-rooms-content');
  if (container) container.innerHTML = '<div class="loading-state">Scanning campus classrooms...</div>';

  try {
    const res = await api('/timetable/free-rooms');
    const rooms = res.data || [];

    if (!rooms.length) {
      container.innerHTML = '<div class="empty-state">No vacant classrooms right now.</div>';
      return;
    }

    container.innerHTML = rooms.map(r => `
      <div class="room-card">
        <div class="room-no">🏫 ${escapeHTML(r.roomNo || r)}</div>
        <div class="room-details">
          <span>📍 ${escapeHTML(r.block || 'Campus Block')} • ${escapeHTML(r.floor || '')}</span>
          <div style="margin-top:4px;">
            <span class="banner-tag" style="background:rgba(16,185,129,.12);color:var(--emerald)">${escapeHTML(r.status || 'Vacant')}</span>
            ${r.ac ? '<span class="banner-tag" style="background:rgba(56,189,248,.12);color:var(--sky)">❄️ Air Conditioned</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

/* ════════════════════════════════
   6. LOST & FOUND MODULE
════════════════════════════════ */
async function loadLostFound() {
  const container = document.getElementById('lf-content');
  const status = document.getElementById('lf-status')?.value || 'all';
  const category = document.getElementById('lf-category')?.value || 'All';
  const search = document.getElementById('lf-search')?.value?.trim() || '';

  if (container) container.innerHTML = '<div class="loading-state">Loading lost & found board...</div>';

  try {
    let url = '/lost-found?';
    if (status && status !== 'all') url += `status=${encodeURIComponent(status)}&`;
    if (category && category !== 'All') url += `category=${encodeURIComponent(category)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    const res = await api(url);
    const items = res.data || [];

    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No reported items match your criteria.</div>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="lf-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="lf-status ${item.status}">${escapeHTML(item.status)}</span>
          <span style="font-size:.72rem; color:var(--text-muted);">${escapeHTML(item.dateReported || '')} (${timeAgo(item.createdAt)})</span>
        </div>
        <div class="lf-title">${escapeHTML(item.title)}</div>
        <div class="lf-meta">
          <span>🏷️ Category: ${escapeHTML(item.category)}</span>
          <span>📍 Location: <strong>${escapeHTML(item.location)}</strong></span>
          <span>📝 ${escapeHTML(item.description)}</span>
          <span>📱 Contact: ${escapeHTML(item.contactPhone || item.contactName || '')}</span>
        </div>
        <button class="claim-btn" onclick="claimItem(this, '${item.id || item._id}')">
          ${item.status === 'claimed' ? '✓ Resolved' : '🤝 Mark as Claimed / Resolved'}
        </button>
      </div>
    `).join('');
  } catch (err) {
    if (container) container.innerHTML = `<div class="empty-state">⚠️ ${escapeHTML(err.message)}</div>`;
  }
}

function showReportModal() {
  document.getElementById('report-modal')?.classList.remove('hidden');
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
    const res = await api('/lost-found', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Item reported successfully!');
    closeModal('report-modal');
    loadLostFound();
  } catch (err) {
    showError('rep-error', err.message);
  }
}

async function claimItem(btn, itemId) {
  try {
    const res = await api(`/lost-found/${itemId}/claim`, { method: 'PATCH' });
    showToast(res.message || 'Status updated!');
    btn.textContent = '✓ Resolved';
    btn.style.opacity = '.7';
    loadLostFound();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ════════════════════════════════
   7. HOSTEL MESS MODULE
════════════════════════════════ */
function selectMessDay(dayName, btn) {
  selectedMessDayName = dayName;
  document.querySelectorAll('#mess-day-selector .day-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadMess();
}

async function loadMess() {
  const container = document.getElementById('mess-content');

  if (container) container.innerHTML = '<div class="loading-state">Loading weekly hostel menu...</div>';

  try {
    const res = await api(`/mess?day=${selectedMessDayName}`);
    const menuObj = res.menu || {};

    let html = '<div class="mess-grid">';
    const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];

    meals.forEach(mealKey => {
      const items = menuObj[mealKey] || [];
      if (items.length > 0) {
        html += `
          <div class="meal-card">
            <div class="meal-type">🥣 ${escapeHTML(mealKey.toUpperCase())}</div>
            <ul class="meal-items-list">
              ${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    });

    html += '</div>';
    container.innerHTML = html;

    renderMessReviews(res.ratings || []);
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="info-callout">
          🔒 <strong>Hostel Resident Access Required:</strong> ${escapeHTML(err.message)}
          <br/><span style="font-size:.8rem;opacity:.8">If you are a hosteller, update your profile residence type to access daily mess menus.</span>
        </div>
      `;
    }
  }
}

function renderMessReviews(ratings) {
  const container = document.getElementById('mess-reviews-content');
  if (!container) return;
  if (!ratings.length) {
    container.innerHTML = '<div class="empty-state">No hostel mess ratings submitted yet.</div>';
    return;
  }

  container.innerHTML = ratings.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div>
          <div class="review-dish">${escapeHTML(r.dishName || 'Meal')}</div>
          <div style="font-size:.74rem;color:var(--amber);font-weight:700;">${escapeHTML(r.hostelName || 'Pearl Hostel')} • ${escapeHTML(r.mealType || '')}</div>
        </div>
        <span class="stars-display">${stars(r.rating)}</span>
      </div>
      <div class="review-comment">"${escapeHTML(r.comment)}"</div>
      <div class="review-student">By ${escapeHTML(r.studentName || 'Resident')} • ${timeAgo(r.createdAt)}</div>
    </div>
  `).join('');
}

function openMessReviewModal() {
  document.getElementById('mess-review-modal')?.classList.remove('hidden');
}

async function submitMessRating(e) {
  e.preventDefault();
  const payload = {
    day: selectedMessDayName,
    hostelName: document.getElementById('mr-hostel').value,
    mealType: document.getElementById('mr-meal').value,
    dishName: document.getElementById('mr-dish').value.trim(),
    rating: Number(document.getElementById('mr-rating').value),
    comment: document.getElementById('mr-comment').value.trim()
  };

  try {
    const res = await api('/mess/rating', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Mess feedback submitted!');
    closeModal('mess-review-modal');
    loadMess();
  } catch (err) {
    showError('mr-error', err.message);
  }
}

/* ════════════════════════════════
   PROFILE DRAWER & UPDATES
════════════════════════════════ */
function openProfileModal() {
  if (!CURRENT_USER) return;
  document.getElementById('prof-preview-name').textContent = CURRENT_USER.name || 'User';
  document.getElementById('prof-preview-email').textContent = CURRENT_USER.email || '';
  document.getElementById('prof-preview-role').textContent = CURRENT_USER.designation || CURRENT_USER.role || 'Student';

  const img = document.getElementById('prof-pfp-preview');
  if (img) img.src = CURRENT_USER.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(CURRENT_USER.name || 'User')}`;

  document.getElementById('prof-pfp').value = CURRENT_USER.pfpUrl || '';
  document.getElementById('prof-bio').value = CURRENT_USER.bio || '';
  document.getElementById('prof-phone').value = CURRENT_USER.phone || '';
  document.getElementById('prof-designation').value = CURRENT_USER.designation || '';

  document.getElementById('profile-modal')?.classList.remove('hidden');
}

function updatePfpPreview(url) {
  const img = document.getElementById('prof-pfp-preview');
  if (img) img.src = url.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=REC`;
}

async function submitProfileUpdate(e) {
  e.preventDefault();
  const payload = {
    pfpUrl: document.getElementById('prof-pfp').value.trim(),
    bio: document.getElementById('prof-bio').value.trim(),
    phone: document.getElementById('prof-phone').value.trim(),
    designation: document.getElementById('prof-designation').value.trim()
  };

  try {
    const res = await api('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    TOKEN = res.token;
    CURRENT_USER = res.user;
    localStorage.setItem('rec_token', TOKEN);
    localStorage.setItem('rec_user', JSON.stringify(CURRENT_USER));
    showToast('Profile updated successfully!');
    closeModal('profile-modal');
    populateUserInfo();
  } catch (err) {
    showError('prof-error', err.message);
  }
}

/* ════════════════════════════════
   GLOBAL SEARCH
════════════════════════════════ */
document.getElementById('global-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  if (!q) {
    document.querySelectorAll('.event-card, .lf-card, .club-card, .canteen-item-card').forEach(el => el.style.display = '');
    return;
  }
  document.querySelectorAll('.event-card, .lf-card, .club-card, .canteen-item-card').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

/* ════════════════════════════════
   INIT ON LOAD
════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = days[new Date().getDay()];
  selectedMessDayName = todayName === 'Sunday' ? 'Sunday' : todayName;

  const dayBtns = document.querySelectorAll('#mess-day-selector .day-btn');
  dayBtns.forEach(b => {
    if (b.textContent.trim().toLowerCase() === selectedMessDayName.substring(0, 3).toLowerCase()) {
      b.classList.add('active');
    }
  });

  if (TOKEN && CURRENT_USER) {
    enterDashboard();
  }
});
