/**
 * BCA III Hub — Admin Panel Controller
 * Password-protected admin dashboard to manage:
 *  - Announcements posted to student hub
 *  - Lecture logs across all 7 subjects
 *  - Today's class agenda
 *  - Study task / to-do list
 */

const ADMIN_KEY = 'Defenderbhabhiontop';
const SESSION_KEY = 'bca_admin_session';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORE = {
  announcements: 'bca_announcements',
  lectures:      'bca_lecture_logs',
  agenda:        'bca_admin_agenda',
  todos:         'bca_admin_todos',
  theme:         'bca_hub_theme',
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const theme = localStorage.getItem(STORE.theme) || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateAdminThemeBtn(theme);

  // Auto-restore session (within same browser tab session)
  if (sessionStorage.getItem(SESSION_KEY) === 'authenticated') {
    showDashboard();
  }

  // Set today's date as default for all date inputs
  const today = new Date().toISOString().split('T')[0];
  ['lec-date', 'agenda-date', 'todo-due'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById('passkey-input').value;
  const err   = document.getElementById('login-error');

  if (input === ADMIN_KEY) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
    err.classList.remove('visible');
    showDashboard();
  } else {
    err.classList.add('visible');
    document.getElementById('passkey-input').value = '';
    document.getElementById('passkey-input').focus();
    // Shake animation
    document.querySelector('.admin-lock-card').style.animation = 'none';
    requestAnimationFrame(() => {
      document.querySelector('.admin-lock-card').style.animation = 'shake 0.35s ease';
    });
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('admin-lock-screen').style.display = 'flex';
  document.getElementById('passkey-input').value = '';
}

function showDashboard() {
  document.getElementById('admin-lock-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
  document.getElementById('admin-dashboard').style.flexDirection = 'column';
  renderAll();
}

function togglePasskeyVisibility() {
  const input = document.getElementById('passkey-input');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<line x1="1" y1="1" x2="23" y2="23"></line><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleAdminTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORE.theme, next);
  updateAdminThemeBtn(next);
  showAdminToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`);
}

function updateAdminThemeBtn(theme) {
  const btn = document.getElementById('admin-theme-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ─── Render All ───────────────────────────────────────────────────────────────
function renderAll() {
  renderAnnouncements();
  renderLectures('all');
  renderAgenda();
  renderTodos();
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function openAnnouncementForm() {
  const f = document.getElementById('announcement-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') document.getElementById('ann-title').focus();
}

function closeAnnouncementForm() {
  document.getElementById('announcement-form').style.display = 'none';
  ['ann-title', 'ann-message', 'ann-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('ann-category').value = 'notice';
}

function saveAnnouncement() {
  const title    = document.getElementById('ann-title').value.trim();
  const message  = document.getElementById('ann-message').value.trim();
  const category = document.getElementById('ann-category').value;
  const link     = document.getElementById('ann-link').value.trim();

  if (!title || !message) {
    showAdminToast('❌ Title and message are required.');
    return;
  }

  const list = load(STORE.announcements);
  list.unshift({
    id: generateId(),
    title, message, category, link,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: Date.now(),
  });
  save(STORE.announcements, list);
  closeAnnouncementForm();
  renderAnnouncements();
  showAdminToast('✅ Announcement published to student hub!');
}

function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  const list = load(STORE.announcements).filter(a => a.id !== id);
  save(STORE.announcements, list);
  renderAnnouncements();
  showAdminToast('Announcement removed.');
}

function renderAnnouncements() {
  const container = document.getElementById('announcements-list');
  const list = load(STORE.announcements);

  if (!list.length) {
    container.innerHTML = emptyState('No announcements yet. Publish one to notify all students.');
    return;
  }

  const catIcons = {
    notice:     '📌', exam: '📅', assignment: '📝',
    lab:        '🔬', urgent: '🚨',
  };

  container.innerHTML = list.map(a => `
    <div class="admin-item-card">
      <div class="admin-item-content">
        <div class="admin-item-title">${escHtml(a.title)}</div>
        <div class="admin-item-meta">
          <span class="admin-item-badge ${a.category === 'urgent' ? 'urgent' : 'coral'}">${catIcons[a.category] || '📌'} ${a.category}</span>
          <span>${a.date}</span>
        </div>
        <div class="admin-item-desc">${escHtml(a.message)}</div>
        ${a.link ? `<a href="${escHtml(a.link)}" target="_blank" style="font-size:0.8125rem; color:var(--color-coral); text-decoration:none; display:inline-block; margin-top:0.35rem;">↗ View Resource</a>` : ''}
      </div>
      <div class="admin-item-actions">
        <button class="admin-item-btn delete" onclick="deleteAnnouncement('${a.id}')" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. LECTURE LOGS
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECT_NAMES = {
  'comp-arch':          'Computer Architecture',
  'data-structures':    'Data Structures',
  'numerical-methods':  'Numerical Methods',
  'machine-learning':   'Machine Learning',
  'english-3':          'English-3',
  'web-dev':            'Web Development',
  'backend-dev':        'Backend Web Dev',
};

function openLectureForm() {
  const f = document.getElementById('lecture-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lec-date').value = today;
    document.getElementById('lec-topic').focus();
  }
}

function closeLectureForm() {
  document.getElementById('lecture-form').style.display = 'none';
  ['lec-topic', 'lec-notes', 'lec-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function saveLecture() {
  const subject = document.getElementById('lec-subject').value;
  const date    = document.getElementById('lec-date').value;
  const time    = document.getElementById('lec-time').value;
  const unit    = document.getElementById('lec-unit').value;
  const topic   = document.getElementById('lec-topic').value.trim();
  const notes   = document.getElementById('lec-notes').value.trim();
  const link    = document.getElementById('lec-link').value.trim();

  if (!topic || !date) {
    showAdminToast('❌ Date and topic are required.');
    return;
  }

  const list = load(STORE.lectures);
  list.unshift({
    id: generateId(),
    subject, date, time, unit, topic, notes, link,
    timestamp: Date.now(),
  });
  save(STORE.lectures, list);
  closeLectureForm();
  renderLectures('all');
  showAdminToast(`✅ Lecture saved for ${SUBJECT_NAMES[subject]}!`);
}

function deleteLecture(id) {
  if (!confirm('Delete this lecture log?')) return;
  const list = load(STORE.lectures).filter(l => l.id !== id);
  save(STORE.lectures, list);
  renderLectures(window._currentLectureFilter || 'all');
  showAdminToast('Lecture log removed.');
}

let _lectureFilter = 'all';
function filterLectures(filter, btn) {
  _lectureFilter = filter;
  document.querySelectorAll('.admin-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLectures(filter);
}

function renderLectures(filter) {
  const container = document.getElementById('lectures-list');
  let list = load(STORE.lectures);
  if (filter && filter !== 'all') list = list.filter(l => l.subject === filter);

  if (!list.length) {
    container.innerHTML = emptyState(filter === 'all' ? 'No lecture logs yet. Add the first one!' : `No lectures logged for ${SUBJECT_NAMES[filter] || filter}.`);
    return;
  }

  container.innerHTML = list.map(l => `
    <div class="admin-item-card">
      <div class="admin-item-content">
        <div class="admin-item-title">${escHtml(l.topic)}</div>
        <div class="admin-item-meta">
          <span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[l.subject] || l.subject)}</span>
          <span class="admin-item-badge">${escHtml(l.unit)}</span>
          <span>${formatDate(l.date)}${l.time ? ' · ' + formatTime(l.time) : ''}</span>
        </div>
        ${l.notes ? `<div class="admin-item-desc">${escHtml(l.notes)}</div>` : ''}
        ${l.link ? `<a href="${escHtml(l.link)}" target="_blank" style="font-size:0.8125rem; color:var(--color-coral); text-decoration:none; display:inline-block; margin-top:0.35rem;">↗ Resource Link</a>` : ''}
      </div>
      <div class="admin-item-actions">
        <button class="admin-item-btn delete" onclick="deleteLecture('${l.id}')" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. CLASS AGENDA
// ─────────────────────────────────────────────────────────────────────────────
function openAgendaForm() {
  const f = document.getElementById('agenda-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('agenda-date').value = today;
    document.getElementById('agenda-topic').focus();
  }
}

function closeAgendaForm() {
  document.getElementById('agenda-form').style.display = 'none';
  ['agenda-topic', 'agenda-room'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function saveAgendaItem() {
  const subject = document.getElementById('agenda-subject').value;
  const date    = document.getElementById('agenda-date').value;
  const time    = document.getElementById('agenda-time').value;
  const room    = document.getElementById('agenda-room').value.trim();
  const topic   = document.getElementById('agenda-topic').value.trim();

  if (!topic || !date) {
    showAdminToast('❌ Date and topic are required.');
    return;
  }

  const list = load(STORE.agenda);
  list.unshift({
    id: generateId(),
    subject, date, time, room, topic,
    timestamp: Date.now(),
  });
  save(STORE.agenda, list);
  closeAgendaForm();
  renderAgenda();
  showAdminToast('✅ Agenda item added — visible to students!');
}

function deleteAgendaItem(id) {
  if (!confirm('Remove this agenda item?')) return;
  const list = load(STORE.agenda).filter(a => a.id !== id);
  save(STORE.agenda, list);
  renderAgenda();
  showAdminToast('Agenda item removed.');
}

function renderAgenda() {
  const container = document.getElementById('agenda-list');
  const list = load(STORE.agenda);

  if (!list.length) {
    container.innerHTML = emptyState("No agenda items yet. Add today's class schedule.");
    return;
  }

  container.innerHTML = list.map(a => `
    <div class="admin-item-card">
      <div class="admin-item-content">
        <div class="admin-item-title">${escHtml(a.topic)}</div>
        <div class="admin-item-meta">
          <span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[a.subject] || a.subject)}</span>
          <span>${formatDate(a.date)}${a.time ? ' · ' + formatTime(a.time) : ''}</span>
          ${a.room ? `<span>📍 ${escHtml(a.room)}</span>` : ''}
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-item-btn delete" onclick="deleteAgendaItem('${a.id}')" title="Remove">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. STUDY TASKS / TO-DOs
// ─────────────────────────────────────────────────────────────────────────────
function openTodoForm() {
  const f = document.getElementById('todo-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') document.getElementById('todo-text').focus();
}

function closeTodoForm() {
  document.getElementById('todo-form').style.display = 'none';
  document.getElementById('todo-text').value = '';
  document.getElementById('todo-priority').value = 'medium';
  document.getElementById('todo-due').value = '';
  document.getElementById('todo-subject').value = '';
}

function saveTodo() {
  const text     = document.getElementById('todo-text').value.trim();
  const priority = document.getElementById('todo-priority').value;
  const due      = document.getElementById('todo-due').value;
  const subject  = document.getElementById('todo-subject').value;

  if (!text) {
    showAdminToast('❌ Task text is required.');
    return;
  }

  const list = load(STORE.todos);
  list.unshift({
    id: generateId(),
    text, priority, due, subject,
    done: false,
    timestamp: Date.now(),
  });
  save(STORE.todos, list);
  closeTodoForm();
  renderTodos();
  showAdminToast('✅ Study task added for all students!');
}

function toggleTodoDone(id) {
  const list = load(STORE.todos);
  const item = list.find(t => t.id === id);
  if (item) item.done = !item.done;
  save(STORE.todos, list);
  renderTodos();
}

function deleteTodo(id) {
  if (!confirm('Delete this task?')) return;
  const list = load(STORE.todos).filter(t => t.id !== id);
  save(STORE.todos, list);
  renderTodos();
  showAdminToast('Task removed.');
}

function renderTodos() {
  const container = document.getElementById('todos-list');
  const list = load(STORE.todos);

  if (!list.length) {
    container.innerHTML = emptyState('No study tasks yet. Add one to guide students.');
    return;
  }

  const prioIcons = { high: '🔴', medium: '🟡', low: '🟢' };

  container.innerHTML = list.map(t => `
    <div class="admin-item-card" style="${t.done ? 'opacity:0.6;' : ''}">
      <div class="admin-item-content">
        <div class="admin-item-title" style="${t.done ? 'text-decoration:line-through;' : ''}">${prioIcons[t.priority] || '🟡'} ${escHtml(t.text)}</div>
        <div class="admin-item-meta">
          ${t.subject ? `<span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[t.subject] || t.subject)}</span>` : ''}
          ${t.due ? `<span>Due: ${formatDate(t.due)}</span>` : ''}
          <span class="admin-item-badge">${t.priority} priority</span>
          ${t.done ? `<span style="color:var(--color-coral)">✓ Completed</span>` : ''}
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="admin-item-btn" onclick="toggleTodoDone('${t.id}')" title="${t.done ? 'Mark incomplete' : 'Mark complete'}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        </button>
        <button class="admin-item-btn delete" onclick="deleteTodo('${t.id}')" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function emptyState(msg) {
  return `
    <div class="admin-empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>${msg}</p>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function showAdminToast(msg) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2800);
}

// Shake animation for wrong passkey
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60%  { transform: translateX(-8px); }
  40%,80%  { transform: translateX(8px); }
}`;
document.head.appendChild(shakeStyle);
