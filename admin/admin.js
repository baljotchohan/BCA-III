/**
 * BCA III Hub — Admin Panel Controller (Firebase Realtime Database)
 * All data stored at: bca2nd-5c622-default-rtdb.firebaseio.com/bca3/
 * Syncs instantly to ALL student devices in real-time.
 */

const ADMIN_KEY   = 'Defenderbhabhiontop';
const SESSION_KEY = 'bca_admin_session';
const DB          = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

let _editingLectureKey = null;
let _editingAnnKey     = null;
let _editingAgendaKey  = null;
let _editingTodoKey    = null;

// ─── Firebase REST Helpers ────────────────────────────────────────────────────

async function fbGet(path) {
  const res = await fetch(`${DB}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function fbPush(path, data) {
  const res = await fetch(`${DB}/${path}.json`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase POST failed: ${res.status}`);
  return (await res.json()).name;
}

async function fbUpdate(path, fbKey, data) {
  const res = await fetch(`${DB}/${path}/${fbKey}.json`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PATCH failed: ${res.status}`);
}

async function fbDelete(path, fbKey) {
  const res = await fetch(`${DB}/${path}/${fbKey}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase DELETE failed: ${res.status}`);
}

async function fbClearAll(path) {
  const res = await fetch(`${DB}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase CLEAR failed: ${res.status}`);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('bca_hub_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateAdminThemeBtn(theme);

  if (sessionStorage.getItem(SESSION_KEY) === 'authenticated') {
    showDashboard();
  }

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
    const card = document.querySelector('.admin-lock-card');
    card.style.animation = 'none';
    requestAnimationFrame(() => { card.style.animation = 'shake 0.35s ease'; });
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('admin-lock-screen').style.display = 'flex';
  document.getElementById('passkey-input').value = '';
}

function updateAdminThemeBtn(theme) {
  const btn = document.getElementById('admin-theme-btn');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  }
}

function toggleAdminTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bca_hub_theme', next);
  updateAdminThemeBtn(next);
  showAdminToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`);
}

function showDashboard() {
  document.getElementById('admin-lock-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  loadDashboardStats();
  renderAnnouncements();
  renderLectures('all');
  renderAgenda();
  renderTodos();
}

async function loadDashboardStats() {
  try {
    const [anns, lecs, agenda, todos] = await Promise.all([
      fbGet('announcements'), fbGet('lectures'), fbGet('agenda'), fbGet('todos'),
    ]);
    document.getElementById('stat-anns').textContent   = anns.length;
    document.getElementById('stat-lecs').textContent   = lecs.length;
    document.getElementById('stat-agenda').textContent = agenda.length;
    document.getElementById('stat-todos').textContent  = todos.length;
  } catch(e) { console.error('Stats load error', e); }
}

function switchTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));

  const tab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
  const panel = document.getElementById(`tab-${tabName}`);
  if (tab) tab.classList.add('active');
  if (panel) panel.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function openAnnouncementForm() {
  _editingAnnKey = null;
  const f = document.getElementById('announcement-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') document.getElementById('ann-title').focus();
}

function closeAnnouncementForm() {
  _editingAnnKey = null;
  document.getElementById('announcement-form').style.display = 'none';
  ['ann-title','ann-message','ann-link'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
}

async function saveAnnouncement() {
  const title    = document.getElementById('ann-title').value.trim();
  const message  = document.getElementById('ann-message').value.trim();
  const category = document.getElementById('ann-category').value;
  const link     = document.getElementById('ann-link').value.trim();
  if (!title || !message) { showAdminToast('❌ Title and message are required.'); return; }

  showAdminToast('⏳ Saving...');
  try {
    const payload = {
      title, message, category, link,
      date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
      timestamp: Date.now(),
    };

    if (_editingAnnKey) {
      await fbUpdate('announcements', _editingAnnKey, payload);
      showAdminToast('✅ Announcement updated successfully!');
    } else {
      await fbPush('announcements', payload);
      showAdminToast('✅ Announcement live for all students!');
    }
    closeAnnouncementForm();
    await renderAnnouncements();
    loadDashboardStats();
  } catch(e) { showAdminToast('❌ Failed: ' + e.message); }
}

async function editAnnouncement(fbKey) {
  try {
    const list = await fbGet('announcements');
    const item = list.find(a => a.fbKey === fbKey);
    if (!item) return;
    _editingAnnKey = fbKey;
    document.getElementById('ann-title').value = item.title || '';
    document.getElementById('ann-message').value = item.message || '';
    document.getElementById('ann-category').value = item.category || 'notice';
    document.getElementById('ann-link').value = item.link || '';
    document.getElementById('announcement-form').style.display = 'flex';
    document.getElementById('ann-title').focus();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteAnnouncement(fbKey) {
  if (!confirm('Delete this announcement?')) return;
  try {
    await fbDelete('announcements', fbKey);
    await renderAnnouncements();
    loadDashboardStats();
    showAdminToast('Announcement removed.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function clearAllAnnouncements() {
  if (!confirm('🚨 Delete ALL announcements from database?')) return;
  try {
    await fbClearAll('announcements');
    await renderAnnouncements();
    loadDashboardStats();
    showAdminToast('All announcements cleared.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function renderAnnouncements() {
  const container = document.getElementById('announcements-list');
  container.innerHTML = loadingState();
  try {
    const list = await fbGet('announcements');
    if (!list.length) { container.innerHTML = emptyState('No announcements yet. Publish one to notify all students.'); return; }
    const catIcons = { notice:'📌', exam:'📅', assignment:'📝', lab:'🔬', urgent:'🚨' };
    container.innerHTML = list.map(a => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <div class="admin-item-title">${escHtml(a.title)}</div>
          <div class="admin-item-meta">
            <span class="admin-item-badge ${a.category==='urgent'?'urgent':'coral'}">${catIcons[a.category]||'📌'} ${a.category}</span>
            <span>${a.date||''}</span>
          </div>
          <div class="admin-item-desc">${escHtml(a.message)}</div>
          ${a.link?`<a href="${escHtml(a.link)}" target="_blank" style="font-size:0.8125rem;color:var(--color-coral);text-decoration:none;display:inline-block;margin-top:0.35rem;">↗ View Resource</a>`:''}
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn edit" onclick="editAnnouncement('${a.fbKey}')" title="Edit Announcement">✏️ Edit</button>
          <button class="admin-item-btn delete" onclick="deleteAnnouncement('${a.fbKey}')" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. LECTURE LOGS & NOTES
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECT_NAMES = {
  'comp-arch':'Computer Architecture','data-structures':'Data Structures',
  'numerical-methods':'Numerical Methods','machine-learning':'Machine Learning',
  'english-3':'English-3','web-dev':'Web Development','backend-dev':'Backend Web Dev',
};

function openLectureForm() {
  _editingLectureKey = null;
  const f = document.getElementById('lecture-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') {
    document.getElementById('lec-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('lec-topic').focus();
  }
}

function closeLectureForm() {
  _editingLectureKey = null;
  document.getElementById('lecture-form').style.display = 'none';
  ['lec-topic','lec-notes','lec-link','lec-image-url'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
}

async function saveLecture() {
  const subject  = document.getElementById('lec-subject').value;
  const date     = document.getElementById('lec-date').value;
  const time     = document.getElementById('lec-time').value;
  const unit     = document.getElementById('lec-unit').value;
  const topic    = document.getElementById('lec-topic').value.trim();
  const notes    = document.getElementById('lec-notes').value.trim();
  const link     = document.getElementById('lec-link').value.trim();
  const imageUrl = document.getElementById('lec-image-url').value.trim();
  if (!topic || !date) { showAdminToast('❌ Date and topic are required.'); return; }

  showAdminToast('⏳ Saving...');
  try {
    const payload = { subject, date, time, unit, topic, notes, link, imageUrl, timestamp: Date.now() };

    if (_editingLectureKey) {
      await fbUpdate('lectures', _editingLectureKey, payload);
      showAdminToast(`✅ Lecture note updated successfully!`);
    } else {
      await fbPush('lectures', payload);
      showAdminToast(`✅ Lecture saved — visible to all students!`);
    }
    closeLectureForm();
    await renderLectures(_lectureFilter || 'all');
    loadDashboardStats();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function editLecture(fbKey) {
  try {
    const list = await fbGet('lectures');
    const item = list.find(l => l.fbKey === fbKey);
    if (!item) return;
    _editingLectureKey = fbKey;
    document.getElementById('lec-subject').value = item.subject || 'comp-arch';
    document.getElementById('lec-date').value = item.date || new Date().toISOString().split('T')[0];
    document.getElementById('lec-time').value = item.time || '';
    document.getElementById('lec-unit').value = item.unit || 'Unit I';
    document.getElementById('lec-topic').value = item.topic || '';
    document.getElementById('lec-notes').value = item.notes || '';
    document.getElementById('lec-link').value = item.link || '';
    document.getElementById('lec-image-url').value = item.imageUrl || '';
    document.getElementById('lecture-form').style.display = 'flex';
    document.getElementById('lec-topic').focus();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteLecture(fbKey) {
  if (!confirm('Delete this lecture / note entry?')) return;
  try {
    await fbDelete('lectures', fbKey);
    await renderLectures(_lectureFilter || 'all');
    loadDashboardStats();
    showAdminToast('Lecture / note removed.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function clearAllLectures() {
  if (!confirm('🚨 Delete ALL notes and lecture entries from database?')) return;
  try {
    await fbClearAll('lectures');
    await renderLectures(_lectureFilter || 'all');
    loadDashboardStats();
    showAdminToast('All lectures & notes cleared.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

let _lectureFilter = 'all';
function filterLectures(filter, btn) {
  _lectureFilter = filter;
  document.querySelectorAll('.admin-filter-bar .filter-pill').forEach(p=>p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLectures(filter);
}

async function renderLectures(filter) {
  const container = document.getElementById('lectures-list');
  container.innerHTML = loadingState();
  try {
    let list = await fbGet('lectures');
    if (filter && filter !== 'all') list = list.filter(l => l.subject === filter);
    if (!list.length) { container.innerHTML = emptyState(filter==='all'?'No lecture logs yet. Add the first one!': `No lectures for ${SUBJECT_NAMES[filter]||filter}.`); return; }
    container.innerHTML = list.map(l => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <div class="admin-item-title">${escHtml(l.topic)}</div>
          <div class="admin-item-meta">
            <span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[l.subject]||l.subject)}</span>
            <span class="admin-item-badge">${escHtml(l.unit||'')}</span>
            <span>${formatDate(l.date)}${l.time?' · '+formatTime(l.time):''}</span>
          </div>
          ${l.notes?`<div class="admin-item-desc">${escHtml(l.notes)}</div>`:''}
          ${l.imageUrl?`<div style="font-size:0.75rem; color:var(--color-coral); margin-top:0.35rem;">🎨 Visual Image: ${escHtml(l.imageUrl)}</div>`:''}
          ${l.link?`<a href="${escHtml(l.link)}" target="_blank" style="font-size:0.8125rem;color:var(--color-coral);text-decoration:none;display:inline-block;margin-top:0.35rem;">↗ Resource</a>`:''}
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn edit" onclick="editLecture('${l.fbKey}')" title="Edit Lecture">✏️ Edit</button>
          <button class="admin-item-btn delete" onclick="deleteLecture('${l.fbKey}')" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. CLASS AGENDA
// ─────────────────────────────────────────────────────────────────────────────
function openAgendaForm() {
  _editingAgendaKey = null;
  const f = document.getElementById('agenda-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') {
    document.getElementById('agenda-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('agenda-topic').focus();
  }
}

function closeAgendaForm() {
  _editingAgendaKey = null;
  document.getElementById('agenda-form').style.display = 'none';
  ['agenda-topic','agenda-room'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
}

async function saveAgendaItem() {
  const subject = document.getElementById('agenda-subject').value;
  const date    = document.getElementById('agenda-date').value;
  const time    = document.getElementById('agenda-time').value;
  const room    = document.getElementById('agenda-room').value.trim();
  const topic   = document.getElementById('agenda-topic').value.trim();
  if (!topic || !date) { showAdminToast('❌ Date and topic required.'); return; }

  showAdminToast('⏳ Saving...');
  try {
    const payload = { subject, date, time, room, topic, timestamp: Date.now() };

    if (_editingAgendaKey) {
      await fbUpdate('agenda', _editingAgendaKey, payload);
      showAdminToast('✅ Agenda item updated!');
    } else {
      await fbPush('agenda', payload);
      showAdminToast('✅ Agenda item live for all students!');
    }
    closeAgendaForm();
    await renderAgenda();
    loadDashboardStats();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function editAgendaItem(fbKey) {
  try {
    const list = await fbGet('agenda');
    const item = list.find(a => a.fbKey === fbKey);
    if (!item) return;
    _editingAgendaKey = fbKey;
    document.getElementById('agenda-subject').value = item.subject || 'comp-arch';
    document.getElementById('agenda-date').value = item.date || new Date().toISOString().split('T')[0];
    document.getElementById('agenda-time').value = item.time || '';
    document.getElementById('agenda-room').value = item.room || '';
    document.getElementById('agenda-topic').value = item.topic || '';
    document.getElementById('agenda-form').style.display = 'flex';
    document.getElementById('agenda-topic').focus();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteAgendaItem(fbKey) {
  if (!confirm('Remove this agenda item?')) return;
  try {
    await fbDelete('agenda', fbKey);
    await renderAgenda();
    loadDashboardStats();
    showAdminToast('Agenda item removed.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function clearAllAgenda() {
  if (!confirm('🚨 Delete ALL agenda items from database?')) return;
  try {
    await fbClearAll('agenda');
    await renderAgenda();
    loadDashboardStats();
    showAdminToast('All agenda items cleared.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function renderAgenda() {
  const container = document.getElementById('agenda-list');
  container.innerHTML = loadingState();
  try {
    const list = await fbGet('agenda');
    if (!list.length) { container.innerHTML = emptyState("No agenda items. Add today's class schedule."); return; }
    container.innerHTML = list.map(a => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <div class="admin-item-title">${escHtml(a.topic)}</div>
          <div class="admin-item-meta">
            <span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[a.subject]||a.subject)}</span>
            <span>${formatDate(a.date)}${a.time?' · '+formatTime(a.time):''}</span>
            ${a.room?`<span>📍 ${escHtml(a.room)}</span>`:''}
          </div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn edit" onclick="editAgendaItem('${a.fbKey}')" title="Edit Agenda">✏️ Edit</button>
          <button class="admin-item-btn delete" onclick="deleteAgendaItem('${a.fbKey}')" title="Remove">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. STUDY TASKS
// ─────────────────────────────────────────────────────────────────────────────
function openTodoForm() {
  _editingTodoKey = null;
  const f = document.getElementById('todo-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') document.getElementById('todo-text').focus();
}

function closeTodoForm() {
  _editingTodoKey = null;
  document.getElementById('todo-form').style.display = 'none';
  document.getElementById('todo-text').value = '';
  document.getElementById('todo-priority').value = 'medium';
  document.getElementById('todo-due').value = '';
  document.getElementById('todo-subject').value = '';
}

async function saveTodo() {
  const text     = document.getElementById('todo-text').value.trim();
  const priority = document.getElementById('todo-priority').value;
  const due      = document.getElementById('todo-due').value;
  const subject  = document.getElementById('todo-subject').value;
  if (!text) { showAdminToast('❌ Task text is required.'); return; }

  showAdminToast('⏳ Saving...');
  try {
    const payload = { text, priority, due, subject, done: false, timestamp: Date.now() };

    if (_editingTodoKey) {
      await fbUpdate('todos', _editingTodoKey, payload);
      showAdminToast('✅ Study task updated!');
    } else {
      await fbPush('todos', payload);
      showAdminToast('✅ Study task live for all students!');
    }
    closeTodoForm();
    await renderTodos();
    loadDashboardStats();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function editTodo(fbKey) {
  try {
    const list = await fbGet('todos');
    const item = list.find(t => t.fbKey === fbKey);
    if (!item) return;
    _editingTodoKey = fbKey;
    document.getElementById('todo-text').value = item.text || '';
    document.getElementById('todo-priority').value = item.priority || 'medium';
    document.getElementById('todo-due').value = item.due || '';
    document.getElementById('todo-subject').value = item.subject || '';
    document.getElementById('todo-form').style.display = 'flex';
    document.getElementById('todo-text').focus();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function toggleTodoDone(fbKey, current) {
  try {
    await fbUpdate('todos', fbKey, { done: !current });
    await renderTodos();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteTodo(fbKey) {
  if (!confirm('Delete this task?')) return;
  try {
    await fbDelete('todos', fbKey);
    await renderTodos();
    loadDashboardStats();
    showAdminToast('Task removed.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function clearAllTodos() {
  if (!confirm('🚨 Delete ALL study tasks from database?')) return;
  try {
    await fbClearAll('todos');
    await renderTodos();
    loadDashboardStats();
    showAdminToast('All study tasks cleared.');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function renderTodos() {
  const container = document.getElementById('todos-list');
  container.innerHTML = loadingState();
  try {
    const list = await fbGet('todos');
    if (!list.length) { container.innerHTML = emptyState('No study tasks yet. Add one to guide students.'); return; }
    const prioIcons = { high:'🔴', medium:'🟡', low:'🟢' };
    container.innerHTML = list.map(t => `
      <div class="admin-item-card" style="${t.done?'opacity:0.6;':''}">
        <div class="admin-item-content">
          <div class="admin-item-title" style="${t.done?'text-decoration:line-through;':''}">${prioIcons[t.priority]||'🟡'} ${escHtml(t.text)}</div>
          <div class="admin-item-meta">
            ${t.subject?`<span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[t.subject]||t.subject)}</span>`:''}
            ${t.due?`<span>Due: ${formatDate(t.due)}</span>`:''}
            <span class="admin-item-badge">${t.priority} priority</span>
            ${t.done?`<span style="color:var(--color-coral)">✓ Done</span>`:''}
          </div>
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn edit" onclick="editTodo('${t.fbKey}')" title="Edit Task">✏️ Edit</button>
          <button class="admin-item-btn" onclick="toggleTodoDone('${t.fbKey}', ${t.done})" title="${t.done?'Mark incomplete':'Mark done'}">✓</button>
          <button class="admin-item-btn delete" onclick="deleteTodo('${t.fbKey}')" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MASTER PURGE / RESET EVERYTHING
// ─────────────────────────────────────────────────────────────────────────────

async function masterResetDatabase() {
  if (!confirm('⚠️ Are you sure you want to WIPE all database items (Lectures, Notes, Announcements, Tasks, Agenda) and clear local cache?')) return;
  showAdminToast('⏳ Purging database...');
  try {
    await Promise.all([
      fbClearAll('announcements'),
      fbClearAll('lectures'),
      fbClearAll('agenda'),
      fbClearAll('todos'),
    ]);
    localStorage.clear();
    await Promise.all([
      renderAnnouncements(),
      renderLectures('all'),
      renderAgenda(),
      renderTodos(),
      loadDashboardStats(),
    ]);
    showAdminToast('✅ Database completely reset! All fake/sample records removed.');
  } catch(e) {
    showAdminToast('❌ Purge failed: ' + e.message);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function loadingState() {
  return `<div style="padding:2rem; text-align:center; color:var(--text-muted); font-size:0.875rem;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite; margin-bottom:0.5rem;">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg><br>Loading from Firebase…
  </div>`;
}

function errorState(msg) {
  return `<div style="padding:2rem; text-align:center; color:#d44f4f; font-size:0.875rem;">❌ Error: ${msg}</div>`;
}

function emptyState(msg) {
  return `<div class="admin-empty-state">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg><p>${msg}</p></div>`;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'undefined' || dateStr === 'NaN-NaN-NaN') return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return dateStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return timeStr;
  return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}

function showAdminToast(msg) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// Shake + spin animations
const style = document.createElement('style');
style.textContent = `
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;
document.head.appendChild(style);
