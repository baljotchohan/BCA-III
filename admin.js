/**
 * BCA III Hub — Admin Panel Controller (Firebase Realtime Database)
 * All data stored at: bca2nd-5c622-default-rtdb.firebaseio.com/bca3/
 * Syncs instantly to ALL student devices in real-time.
 */

const SESSION_KEY = 'bca_hub_admin_session';
const DB          = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

async function getAuthTokenParam() {
  try {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      const token = await firebase.auth().currentUser.getIdToken();
      return `?auth=${token}`;
    }
  } catch (e) {}
  return '';
}

function isPortalAdminAuth() {
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    const email = (firebase.auth().currentUser.email || '').toLowerCase();
    const ADMIN_EMAILS = [
      'baljotchohan23@gmail.com',
      'mehakpreetkaur@gmail.com',
      'mehakpreetsaini26@gmail.com'
    ];
    if (ADMIN_EMAILS.includes(email)) return true;
  }
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated' || 
         sessionStorage.getItem('bca_admin_session') === 'authenticated' ||
         localStorage.getItem('bca_hub_admin_session') === 'authenticated' ||
         localStorage.getItem('bca_admin_session') === 'authenticated';
}

// ─── Firebase REST Helpers ────────────────────────────────────────────────────

async function fbGet(path) {
  const tokenParam = await getAuthTokenParam();
  const res = await fetch(`${DB}/${path}.json${tokenParam}`);
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  // Convert Firebase object {"-key": {...}} to array with .fbKey
  return Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function fbPush(path, data) {
  const tokenParam = await getAuthTokenParam();
  const res = await fetch(`${DB}/${path}.json${tokenParam}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase POST failed: ${res.status}`);
  return (await res.json()).name; // returns the generated key
}

async function fbDelete(path, fbKey) {
  const tokenParam = await getAuthTokenParam();
  const res = await fetch(`${DB}/${path}/${fbKey}.json${tokenParam}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase DELETE failed: ${res.status}`);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('bca_hub_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateAdminThemeBtn(theme);
  updateAdminThemeMeta(theme);

  if (isPortalAdminAuth()) {
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
  if (e && e.preventDefault) e.preventDefault();
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then((result) => {
      const email = result.user.email;
      const ADMIN_EMAILS = ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com'];
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, 'authenticated');
        showDashboard();
      } else {
        alert('Access denied: ' + email + ' is not an authorized administrator account.');
        firebase.auth().signOut();
      }
    }).catch((err) => {
      const errEl = document.getElementById('login-error');
      if (errEl) {
        errEl.innerText = err.message || 'Google Sign-In failed.';
        errEl.classList.add('visible');
      }
    });
  } else {
    alert('Firebase Authentication SDK is loading or unavailable.');
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('bca_admin_session');
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
  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const panel = document.getElementById(`tab-${tabName}`);
  if (tabBtn) tabBtn.classList.add('active');
  if (panel) panel.classList.add('active');

  if (tabName === 'revenue') {
    refreshRevenueData();
  }
}

function renderAll() {
  renderNotes('all');
  renderLectures('all');
  renderAnnouncements();
  renderAgenda();
  renderTodos();
  refreshRevenueData();
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

// ─── REVENUE & SUBSCRIPTIONS ANALYTICS ──────────────────────────────────────
async function refreshRevenueData() {
  const totalAmountEl = document.getElementById('rev-total-amount');
  const activeSubsEl = document.getElementById('rev-active-subs');
  const noteSalesEl = document.getElementById('rev-note-sales');
  const ordersListEl = document.getElementById('revenue-orders-list');

  try {
    const [rawOrders, rawUsers] = await Promise.all([
      _fbFetch('orders'),
      _fbFetch('users')
    ]);

    const orders = Array.isArray(rawOrders) ? rawOrders : Object.values(rawOrders || {});
    const users = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers || {});

    let totalRev = 0;
    let singleNoteCount = 0;

    orders.forEach(o => {
      if (o.status === 'PAID') {
        if (o.itemType === 'single_note') {
          totalRev += 15;
          singleNoteCount++;
        } else if (o.itemType === 'subscription') {
          if (o.planTier === 'pro' || o.planTier === 'plus') totalRev += 19;
          else if (o.planTier === 'max') totalRev += 49;
        }
      }
    });

    const activeSubscribersCount = users.filter(u => u.subscription && u.subscription.status === 'active' && u.subscription.plan !== 'free').length;

    if (totalAmountEl) totalAmountEl.textContent = `₹${totalRev.toFixed(2)}`;
    if (activeSubsEl) activeSubsEl.textContent = activeSubscribersCount;
    if (noteSalesEl) noteSalesEl.textContent = singleNoteCount;

    if (ordersListEl) {
      if (!orders.length) {
        ordersListEl.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-subtle);">No transactions recorded yet.</div>`;
        return;
      }

      ordersListEl.innerHTML = orders.reverse().map(o => {
        const isPaid = o.status === 'PAID';
        const isRefunded = o.status === 'REFUNDED' || o.status === 'CANCELLED';
        const isFailed = o.status === 'FAILED';

        let badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';
        if (isRefunded) badgeStyle = 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);';
        if (isFailed) badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);';

        return `
        <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; color: var(--text-main); font-size: 0.9rem;">
              ${o.itemType === 'single_note' ? '⚡ Single Note (₹15)' : `⭐ Pass: ${(o.planTier || '').toUpperCase()} (${o.planTier === 'max' ? '₹49' : '₹19'})`}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem;">
              UID: <code style="color: var(--color-coral);">${o.uid || 'Anonymous'}</code> | Pay ID: <code style="color: var(--text-subtle);">${o.paymentId || 'N/A'}</code>
            </div>
          </div>
          <div style="text-align: right; display: flex; align-items: center; gap: 0.6rem;">
            <div>
              <span style="display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; ${badgeStyle}">
                ${isPaid ? '✓ PAID' : isRefunded ? '↩ REFUNDED' : isFailed ? '✕ FAILED' : o.status}
              </span>
              <div style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 0.2rem;">
                ${new Date(o.timestamp || Date.now()).toLocaleDateString('en-IN')}
              </div>
            </div>
            ${isPaid && o.orderId ? `
              <button onclick="adminMarkOrderRefunded('${o.orderId}', '${o.uid || ''}')" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer;" title="Mark as refunded/revoked in DB">
                Revoke/Refund
              </button>
            ` : ''}
          </div>
        </div>
      `;
      }).join('');
    }
  } catch (err) {
    console.error('Error fetching revenue data:', err);
    if (ordersListEl) ordersListEl.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading revenue analytics: ${err.message}</div>`;
  }
}

async function adminMarkOrderRefunded(orderId, uid) {
  if (!confirm(`Are you sure you want to mark order ${orderId} as REFUNDED and downgrade user access?`)) return;

  try {
    // 1. Update order status
    await fetch(`https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/orders/${encodeURIComponent(orderId)}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REFUNDED', refundedAt: Date.now() })
    });

    // 2. If UID is present, downgrade subscription to free
    if (uid && uid !== 'anonymous') {
      await fetch(`https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/users/${encodeURIComponent(uid)}/subscription.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'refunded', plan: 'free', validUntil: Date.now() })
      });
    }

    showAdminToast(`Order ${orderId} marked as REFUNDED.`);
    refreshRevenueData();
  } catch (e) {
    alert('Failed to update refund status: ' + e.message);
  }
}

async function adminGrantSubscription() {
  const userIdInput = document.getElementById('grant-user-id');
  const planSelect = document.getElementById('grant-plan-tier');

  const userId = userIdInput ? userIdInput.value.trim() : '';
  const planTier = planSelect ? planSelect.value : 'pro';

  if (!userId) {
    alert('Please enter a student email address or UID.');
    return;
  }

  try {
    const rawUsers = await _fbFetch('users');
    const usersObj = rawUsers || {};

    let targetKey = null;

    if (typeof usersObj === 'object') {
      for (const [key, user] of Object.entries(usersObj)) {
        if (key === userId || (user.email && user.email.toLowerCase() === userId.toLowerCase())) {
          targetKey = key;
          break;
        }
      }
    }

    if (!targetKey) {
      targetKey = userId.replace(/[^a-zA-Z0-9]/g, '_');
    }

    const now = Date.now();
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    if (planTier === 'max') durationMs = 3650 * 24 * 60 * 60 * 1000;

    const subData = {
      plan: planTier,
      status: planTier === 'free' ? 'expired' : 'active',
      activatedAt: now,
      validUntil: now + durationMs,
      grantedByAdmin: true
    };

    await fetch(`https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/users/${targetKey}/subscription.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subData)
    });

    showAdminToast(`Success! Granted ${planTier.toUpperCase()} pass to ${userId}`);
    if (userIdInput) userIdInput.value = '';
    refreshRevenueData();

  } catch (err) {
    console.error('Error granting subscription:', err);
    alert('Failed to grant pass: ' + err.message);
  }
}

