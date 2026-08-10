/**
 * BCA III Hub — Admin Panel Controller (Firebase Realtime Database)
 * All data stored at: bca2nd-5c622-default-rtdb.firebaseio.com/bca3/
 * Syncs instantly to ALL student devices in real-time.
 */

const ADMIN_KEY   = 'Defenderbhabhiontop';
const SESSION_KEY = 'bca_admin_session';
const DB          = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

// ─── Firebase REST Helpers ────────────────────────────────────────────────────

async function fbGet(path) {
  const res = await fetch(`${DB}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  // Convert Firebase object {"-key": {...}} to array with .fbKey
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
  return (await res.json()).name; // returns the generated key
}

async function fbDelete(path, fbKey) {
  const res = await fetch(`${DB}/${path}/${fbKey}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase DELETE failed: ${res.status}`);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('bca_hub_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateAdminThemeBtn(theme);
  updateAdminThemeMeta(theme);

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

function showDashboard() {
  document.getElementById('admin-lock-screen').style.display = 'none';
  const dash = document.getElementById('admin-dashboard');
  dash.style.display = 'flex';
  dash.style.flexDirection = 'column';
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
  localStorage.setItem('bca_hub_theme', next);
  updateAdminThemeBtn(next);
  updateAdminThemeMeta(next);
  showAdminToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`);
}

function updateAdminThemeMeta(theme) {
  const color = theme === 'dark' ? '#141413' : '#faf9f5';
  const metaTags = document.querySelectorAll('meta[name="theme-color"]');
  metaTags.forEach(tag => tag.setAttribute('content', color));
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

function renderAll() {
  renderNotes('all');
  renderLectures('all');
  renderAnnouncements();
  renderAgenda();
  renderTodos();
}

// ─────────────────────────────────────────────────────────────────────────────
//  0. DIGITAL NOTES
// ─────────────────────────────────────────────────────────────────────────────
let _noteFilter = 'all';

function openNoteForm() {
  const f = document.getElementById('note-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') document.getElementById('note-title').focus();
}

function closeNoteForm() {
  document.getElementById('note-form').style.display = 'none';
  ['note-title','note-tags','note-readtime','note-content'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('note-unit').value = 'Unit I';
}

async function saveNote() {
  const subject  = document.getElementById('note-subject').value;
  const unit     = document.getElementById('note-unit').value;
  const title    = document.getElementById('note-title').value.trim();
  const tagsStr  = document.getElementById('note-tags').value.trim();
  const readTime = document.getElementById('note-readtime').value.trim() || '6 min read';
  const content  = document.getElementById('note-content').value.trim();

  if (!title || !content) {
    showAdminToast('❌ Title and Note Content are required.');
    return;
  }

  showAdminToast('⏳ Publishing digital note to cloud...');
  try {
    await fbPush('notes', {
      subject,
      subjectId: subject,
      unit,
      title,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Revision'],
      readTime,
      content,
      isAdminPublished: true,
      author: 'Admin',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });
    closeNoteForm();
    await renderNotes(_noteFilter || 'all');
    showAdminToast('✅ Digital note published live for all students!');
  } catch (e) {
    showAdminToast('❌ Failed: ' + e.message);
  }
}

async function deleteNote(fbKey) {
  if (!confirm('Permanently delete this digital note?')) return;
  try {
    await fbDelete('notes', fbKey);
    await renderNotes(_noteFilter || 'all');
    showAdminToast('Digital note removed from cloud.');
  } catch (e) {
    showAdminToast('❌ ' + e.message);
  }
}

function filterNotes(filter, btn) {
  _noteFilter = filter;
  document.querySelectorAll('#tab-notes .filter-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNotes(filter);
}

async function renderNotes(filter) {
  const container = document.getElementById('notes-list');
  if (!container) return;
  container.innerHTML = loadingState();
  try {
    let list = await fbGet('notes');
    if (filter && filter !== 'all') {
      list = list.filter(n => (n.subject === filter || n.subjectId === filter));
    }
    if (!list.length) {
      container.innerHTML = emptyState(filter === 'all' ? 'No digital notes published yet. Add the first one!' : `No notes published for ${SUBJECT_NAMES[filter] || filter}.`);
      return;
    }
    container.innerHTML = list.map(n => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <div class="admin-item-title">${escHtml(n.title)}</div>
          <div class="admin-item-meta">
            <span class="admin-item-badge coral">${escHtml(SUBJECT_NAMES[n.subject || n.subjectId] || n.subject)}</span>
            <span class="admin-item-badge">${escHtml(n.unit || 'General')}</span>
            <span>${n.readTime || '6 min read'} · ${formatDate(n.date)}</span>
          </div>
          <div class="admin-item-desc" style="white-space: pre-wrap; max-height: 120px; overflow-y: auto;">${escHtml((n.content || '').slice(0, 300))}${(n.content || '').length > 300 ? '...' : ''}</div>
          ${n.tags && n.tags.length ? `
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.5rem;">
              ${n.tags.map(t => `<span style="font-size: 0.72rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.45rem; border-radius: 4px; color: var(--text-subtle);">#${escHtml(t)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn delete" onclick="deleteNote('${n.fbKey}')" title="Delete Note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = errorState(e.message);
  }
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
  ['ann-title','ann-message','ann-link'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('ann-category').value = 'notice';
}

async function saveAnnouncement() {
  const title    = document.getElementById('ann-title').value.trim();
  const message  = document.getElementById('ann-message').value.trim();
  const category = document.getElementById('ann-category').value;
  const link     = document.getElementById('ann-link').value.trim();
  if (!title || !message) { showAdminToast('❌ Title and message are required.'); return; }

  showAdminToast('⏳ Publishing...');
  try {
    await fbPush('announcements', {
      title, message, category, link,
      date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
      timestamp: Date.now(),
    });
    closeAnnouncementForm();
    await renderAnnouncements();
    showAdminToast('✅ Announcement live for all students!');
  } catch(e) {
    showAdminToast('❌ Failed: ' + e.message);
  }
}

async function deleteAnnouncement(fbKey) {
  if (!confirm('Delete this announcement?')) return;
  try {
    await fbDelete('announcements', fbKey);
    await renderAnnouncements();
    showAdminToast('Announcement removed.');
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
          <button class="admin-item-btn delete" onclick="deleteAnnouncement('${a.fbKey}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. LECTURE LOGS
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECT_NAMES = {
  'comp-arch':'Computer Architecture','data-structures':'Data Structures',
  'numerical-methods':'Numerical Methods','machine-learning':'Machine Learning',
  'english-3':'English-3','web-dev':'Web Development','backend-dev':'Backend Web Dev',
};

function openLectureForm() {
  const f = document.getElementById('lecture-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') {
    document.getElementById('lec-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('lec-topic').focus();
  }
}
function closeLectureForm() {
  document.getElementById('lecture-form').style.display = 'none';
  ['lec-topic','lec-notes','lec-link'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
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
    await fbPush('lectures', { subject, date, time, unit, topic, notes, link, imageUrl, timestamp: Date.now() });
    closeLectureForm();
    await renderLectures(_lectureFilter || 'all');
    showAdminToast(`✅ Lecture saved — visible to all students!`);
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteLecture(fbKey) {
  if (!confirm('Delete this lecture log?')) return;
  try {
    await fbDelete('lectures', fbKey);
    await renderLectures(_lectureFilter || 'all');
    showAdminToast('Lecture removed.');
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
          ${l.link?`<a href="${escHtml(l.link)}" target="_blank" style="font-size:0.8125rem;color:var(--color-coral);text-decoration:none;display:inline-block;margin-top:0.35rem;">↗ Resource</a>`:''}
        </div>
        <div class="admin-item-actions">
          <button class="admin-item-btn delete" onclick="deleteLecture('${l.fbKey}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. CLASS AGENDA
// ─────────────────────────────────────────────────────────────────────────────
function openAgendaForm() {
  const f = document.getElementById('agenda-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') {
    document.getElementById('agenda-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('agenda-topic').focus();
  }
}
function closeAgendaForm() {
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
    await fbPush('agenda', { subject, date, time, room, topic, timestamp: Date.now() });
    closeAgendaForm();
    await renderAgenda();
    showAdminToast('✅ Agenda item live for all students!');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteAgendaItem(fbKey) {
  if (!confirm('Remove this agenda item?')) return;
  try {
    await fbDelete('agenda', fbKey);
    await renderAgenda();
    showAdminToast('Agenda item removed.');
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
          <button class="admin-item-btn delete" onclick="deleteAgendaItem('${a.fbKey}')" title="Remove">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. STUDY TASKS
// ─────────────────────────────────────────────────────────────────────────────
function openTodoForm() {
  const f = document.getElementById('todo-form');
  f.style.display = f.style.display==='none' ? 'flex' : 'none';
  if (f.style.display==='flex') document.getElementById('todo-text').focus();
}
function closeTodoForm() {
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
    await fbPush('todos', { text, priority, due, subject, done: false, timestamp: Date.now() });
    closeTodoForm();
    await renderTodos();
    showAdminToast('✅ Study task live for all students!');
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function toggleTodoDone(fbKey, current) {
  try {
    await fetch(`${DB}/todos/${fbKey}.json`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ done: !current }),
    });
    await renderTodos();
  } catch(e) { showAdminToast('❌ ' + e.message); }
}

async function deleteTodo(fbKey) {
  if (!confirm('Delete this task?')) return;
  try {
    await fbDelete('todos', fbKey);
    await renderTodos();
    showAdminToast('Task removed.');
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
          <button class="admin-item-btn" onclick="toggleTodoDone('${t.fbKey}', ${t.done})" title="${t.done?'Mark incomplete':'Mark done'}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </button>
          <button class="admin-item-btn delete" onclick="deleteTodo('${t.fbKey}')" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = errorState(e.message); }
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
  if (!dateStr) return '';
  try { return new Date(dateStr+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
  catch { return dateStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h,m] = timeStr.split(':').map(Number);
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
