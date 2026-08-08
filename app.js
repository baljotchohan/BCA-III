/**
 * BCA 3 Hub — Panjab University 2026-27 Study Dashboard Controller
 * Incorporates Anthropic's Warm Editorial Aesthetic, Multi-Level Navigation Dropdowns,
 * Unit-by-Unit Syllabus Viewers, Interactive Lecture Logging, To-Do Tracker, and ⌘K Search.
 */

let activeSubjectId = 'comp-arch';

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGreeting();
  initDropdowns();
  initMobileDrawer();
  initSubjectModals();
  initDashboardWidgets();
  initCommandPalette();
  initNewsletter();
  initFilterPills();
  initKeyboardShortcuts();
});

/* --- 1. Theme Management (Ivory Light vs Midnight Slate Dark) --- */
function initTheme() {
  const savedTheme = localStorage.getItem('bca_hub_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bca_hub_theme', next);
  updateThemeButton(next);
  showToast(`Switched to ${next === 'dark' ? 'Midnight Slate Dark' : 'Warm Ivory Light'} theme`);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
  }
}

/* --- 2. Dynamic Time-Aware Greeting --- */
function initGreeting() {
  const greetingEl = document.getElementById('live-greeting');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeStr = 'Good Evening';
  if (hour < 12) timeStr = 'Good Morning';
  else if (hour < 17) timeStr = 'Good Afternoon';

  greetingEl.innerText = `${timeStr}, BCA III Scholar 👋`;
}

/* --- 3. Interactive Header Dropdown Menus --- */
function initDropdowns() {
  const navItems = document.querySelectorAll('[data-category]');

  navItems.forEach(item => {
    const button = item.querySelector('button');
    const category = item.getAttribute('data-category');
    const dropdown = document.getElementById(`nav-dropdown-${category}`);

    if (button && dropdown) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        closeAllDropdowns();
        if (!isOpen) {
          button.setAttribute('aria-expanded', 'true');
          dropdown.classList.add('active');
        }
      });
    }
  });

  document.addEventListener('click', () => {
    closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.SiteHeader-module-scss-module__zKj4Ca__navText').forEach(el => {
    el.setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('.anthropic-dropdown-menu').forEach(menu => {
    menu.classList.remove('active');
  });
}

/* --- 4. Mobile Off-Canvas Drawer --- */
function initMobileDrawer() {
  const mobileToggle = document.querySelector('.SiteHeader-module-scss-module__zKj4Ca__mobileIcon');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('close-mobile-drawer');

  if (mobileToggle && drawer) {
    mobileToggle.addEventListener('click', () => {
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
}

/* --- 5. Interactive Subject Syllabus Modal --- */
function initSubjectModals() {
  const backdrop = document.getElementById('subject-modal-backdrop');
  const closeBtn = document.getElementById('close-subject-modal');

  if (backdrop && closeBtn) {
    closeBtn.addEventListener('click', closeSubjectModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSubjectModal();
    });
  }
}

function openSubjectModal(subjectId) {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId) || BCA_3RD_SEM_DATA.subjects[0];
  activeSubjectId = subject.id;

  const backdrop = document.getElementById('subject-modal-backdrop');
  if (!backdrop) return;

  document.getElementById('modal-subject-code').innerText = `${subject.code} • ${subject.type} • ${subject.credits} Credits`;
  document.getElementById('modal-subject-title').innerText = subject.title;
  document.getElementById('modal-subject-desc').innerText = subject.description;

  // Render Units (I–IV)
  const unitsContainer = document.getElementById('modal-units-container');
  if (subject.units && subject.units.length > 0) {
    unitsContainer.innerHTML = subject.units.map(u => `
      <div class="unit-section-block">
        <div class="unit-header-title">
          <span class="unit-tag">${u.unitNumber}</span>
          <span>${u.title || 'Syllabus Breakdown'}</span>
        </div>
        <div class="unit-topics-list">
          ${u.topics.map(t => `<div class="unit-topic-bullet">${t}</div>`).join('')}
        </div>
      </div>
    `).join('');
  } else {
    unitsContainer.innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:var(--text-muted); background:var(--bg-page); border-radius:var(--radius-md);">
        <p class="body-1 serif" style="margin-bottom:0.5rem;">Unit details for this elective/AEC paper are in the official curriculum credit structure.</p>
        <a href="./Syllabus.pdf" target="_blank" class="Button-module-scss-module__f9ZZrG__button Button-module-scss-module__f9ZZrG__secondary" style="margin-top:0.5rem;">
          <span>Open Official PU Syllabus PDF ↗</span>
        </a>
      </div>
    `;
  }

  // Render Practicals
  const practicalsContainer = document.getElementById('modal-practicals-container');
  if (subject.practicals && subject.practicals.length > 0) {
    practicalsContainer.innerHTML = subject.practicals.map((p, i) => `
      <div class="curriculum-item">
        <div class="curriculum-item-left">
          <span class="module-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="module-title">${p}</span>
        </div>
        <span class="module-duration">Lab Experiment</span>
      </div>
    `).join('');
  } else {
    practicalsContainer.innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:var(--text-muted); background:var(--bg-page); border-radius:var(--radius-md);">
        This subject is evaluated primarily via Theory Examination (60 Hours).
      </div>
    `;
  }

  // Render Lectures
  renderSubjectLectures();

  // Render Revision Notes
  document.getElementById('modal-revision-box').innerText = subject.revisionNotes || `// ${subject.title}\n// Refer to PU prescribed textbooks and class notes.`;

  // Default to units tab
  switchSubjectTab('units');

  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSubjectModal() {
  const backdrop = document.getElementById('subject-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchSubjectTab(tabName) {
  document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach(c => c.style.display = 'none');

  const btn = document.getElementById(`tab-btn-${tabName}`);
  const content = document.getElementById(`tab-content-${tabName}`);

  if (btn) btn.classList.add('active');
  if (content) content.style.display = 'block';
}

function renderSubjectLectures() {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  const container = document.getElementById('modal-lectures-container');
  if (!container || !subject) return;

  const storedLecturesKey = `bca_lectures_${subject.id}`;
  const localLecs = JSON.parse(localStorage.getItem(storedLecturesKey) || 'null') || subject.lectures || [];

  if (localLecs.length === 0) {
    container.innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:var(--text-muted); background:var(--bg-page); border-radius:var(--radius-md);">
        No lectures recorded yet. Log your first class below!
      </div>
    `;
    return;
  }

  container.innerHTML = localLecs.map((lec, idx) => `
    <div class="curriculum-item">
      <div class="curriculum-item-left">
        <span class="module-num">${String(idx + 1).padStart(2, '0')}</span>
        <div>
          <div class="module-title">${lec.topic}</div>
          <div style="font-size:0.8125rem; color:var(--text-subtle);">${lec.description || 'Class notes recorded'}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.8125rem; font-weight:600; color:var(--color-coral);">${lec.date}</div>
        <div style="font-size:0.75rem; color:var(--text-subtle);">${lec.time || ''}</div>
      </div>
    </div>
  `).join('');
}

function saveNewLecture() {
  const dateInput = document.getElementById('new-lec-date');
  const timeInput = document.getElementById('new-lec-time');
  const topicInput = document.getElementById('new-lec-topic');
  const descInput = document.getElementById('new-lec-desc');

  const date = dateInput.value || new Date().toISOString().split('T')[0];
  const time = timeInput.value.trim() || '10:00 AM';
  const topic = topicInput.value.trim();
  const description = descInput.value.trim();

  if (!topic) {
    showToast('Please specify the topic covered in class.');
    return;
  }

  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  const storedLecturesKey = `bca_lectures_${subject.id}`;
  const existing = JSON.parse(localStorage.getItem(storedLecturesKey) || 'null') || subject.lectures || [];

  existing.unshift({ date, time, topic, description, fileUrl: 'Syllabus.pdf' });
  localStorage.setItem(storedLecturesKey, JSON.stringify(existing));

  topicInput.value = '';
  descInput.value = '';
  renderSubjectLectures();
  renderAgendaWidget();
  showToast(`✓ Class record logged for ${subject.title}!`);
}

/* --- 6. Dashboard Widgets: Admin-Driven Agenda, Todos & Announcements --- */
function initDashboardWidgets() {
  renderAnnouncementsBanner();
  renderAgendaWidget();
  renderTodoWidget();
}

// Pull admin-controlled announcements and show as banner
function renderAnnouncementsBanner() {
  const banner    = document.getElementById('announcements-banner');
  const container = document.getElementById('announcements-container');
  if (!banner || !container) return;

  let list = [];
  try { list = JSON.parse(localStorage.getItem('bca_announcements')) || []; } catch {}

  if (!list.length) { banner.style.display = 'none'; return; }

  banner.style.display = 'block';
  const catIcons = { notice:'📌', exam:'📅', assignment:'📝', lab:'🔬', urgent:'🚨' };

  container.innerHTML = list.slice(0, 5).map(a => `
    <div class="announcement-card ${a.category === 'urgent' ? 'urgent' : ''}" style="
      background:var(--bg-surface);
      border:1px solid ${a.category==='urgent'?'rgba(212,79,79,0.4)':'var(--border-color)'};
      border-left:3px solid ${a.category==='urgent'?'#d44f4f':'var(--color-coral)'};
      border-radius:var(--radius-md);
      padding:1rem 1.25rem;
      margin-bottom:0.65rem;
      display:flex; align-items:flex-start; gap:0.85rem;
    ">
      <span style="font-size:1.1rem; flex-shrink:0;">${catIcons[a.category] || '📌'}</span>
      <div style="flex:1; min-width:0;">
        <div style="font-size:0.9375rem; font-weight:600; color:var(--text-main); margin-bottom:0.2rem;">${escHtmlMain(a.title)}</div>
        <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.45;">${escHtmlMain(a.message)}</div>
        ${a.link ? `<a href="${escHtmlMain(a.link)}" target="_blank" style="font-size:0.8rem; color:var(--color-coral); text-decoration:none; margin-top:0.3rem; display:inline-block;">↗ View Resource</a>` : ''}
      </div>
      <span style="font-size:0.75rem; color:var(--text-subtle); flex-shrink:0; margin-top:0.15rem;">${escHtmlMain(a.date)}</span>
    </div>
  `).join('');
}

function escHtmlMain(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// Render Today's Class Agenda from admin data
function renderAgendaWidget() {
  const container = document.getElementById('agenda-items-container');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];

  // Pull from admin agenda store
  let adminAgenda = [];
  try { adminAgenda = JSON.parse(localStorage.getItem('bca_admin_agenda')) || []; } catch {}

  // Also pull today's lectures from admin lecture logs
  let adminLectures = [];
  try { adminLectures = JSON.parse(localStorage.getItem('bca_lecture_logs')) || []; } catch {}

  const todayLectures = adminLectures
    .filter(l => l.date === today)
    .map(l => ({ ...l, topic: l.topic, subjectTitle: SUBJECT_MAP[l.subject] || l.subject }));

  const todayAgenda = adminAgenda
    .filter(a => a.date === today)
    .map(a => ({ ...a, subjectTitle: SUBJECT_MAP[a.subject] || a.subject }));

  const combined = [...todayAgenda, ...todayLectures];

  if (!combined.length) {
    container.innerHTML = `<div style="padding:1.25rem; text-align:center; color:var(--text-muted); font-size:0.875rem;">
      No classes scheduled for today — check back later! 📅
    </div>`;
    return;
  }

  container.innerHTML = combined.slice(0, 5).map(item => `
    <div class="agenda-item" onclick="openSubjectModal('${item.subject}')" style="cursor:pointer;">
      <div>
        <div class="agenda-time">${item.date} • ${item.time ? formatTimeSt(item.time) : ''}</div>
        <div class="agenda-topic">${escHtmlMain(item.topic)}</div>
        <div style="font-size:0.75rem; color:var(--text-subtle);">${item.subjectTitle}${item.room ? ' • 📍 ' + item.room : ''}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-subtle);">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  `).join('');
}

// Render admin-controlled Study Tasks
function renderTodoWidget() {
  const container = document.getElementById('todo-items-container');
  if (!container) return;

  let todos = [];
  try { todos = JSON.parse(localStorage.getItem('bca_admin_todos')) || []; } catch {}

  if (!todos.length) {
    container.innerHTML = `<div style="padding:1.25rem; text-align:center; color:var(--text-muted); font-size:0.875rem;">
      No study tasks posted yet — check back later! 📚
    </div>`;
    return;
  }

  const prioColors = { high: '#d44f4f', medium: 'var(--color-coral)', low: 'var(--text-muted)' };

  container.innerHTML = todos.map(t => `
    <div class="todo-item-row ${t.done ? 'completed' : ''}" style="pointer-events:none; opacity:${t.done ? '0.6' : '1'};">
      <input type="checkbox" class="todo-checkbox" ${t.done ? 'checked' : ''} style="pointer-events:none;" readonly/>
      <span class="todo-text" style="${t.done ? 'text-decoration:line-through;' : ''}">${escHtmlMain(t.text)}</span>
      ${t.subject ? `<span class="todo-subject-badge">${escHtmlMain(SUBJECT_MAP[t.subject] || t.subject)}</span>` : ''}
      ${t.priority === 'high' ? '<span style="font-size:0.7rem; color:#d44f4f; font-weight:700;">HIGH</span>' : ''}
    </div>
  `).join('');
}

function formatTimeSt(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

const SUBJECT_MAP = {
  'comp-arch': 'Computer Architecture',
  'data-structures': 'Data Structures',
  'numerical-methods': 'Numerical Methods',
  'machine-learning': 'Machine Learning',
  'english-3': 'English-3',
  'web-dev': 'Web Development',
  'backend-dev': 'Backend Web Dev',
};

/* --- 7. Global Command Palette (⌘K) --- */
function initCommandPalette() {
  const palette = document.getElementById('command-palette-backdrop');
  const input = document.getElementById('command-search-input');
  const resultsContainer = document.getElementById('command-results');

  if (!palette || !input || !resultsContainer) return;

  const SEARCH_ITEMS = [];
  BCA_3RD_SEM_DATA.subjects.forEach(sub => {
    SEARCH_ITEMS.push({ title: sub.title, category: 'Subject', id: sub.id });
    if (sub.units) {
      sub.units.forEach(u => {
        SEARCH_ITEMS.push({ title: `${sub.title}: ${u.title || u.unitNumber}`, category: 'Unit', id: sub.id });
        u.topics.forEach(top => {
          SEARCH_ITEMS.push({ title: top, category: `${sub.title} Topic`, id: sub.id });
        });
      });
    }
    if (sub.practicals) {
      sub.practicals.forEach(p => {
        SEARCH_ITEMS.push({ title: `${sub.title} Lab: ${p}`, category: 'Practical', id: sub.id });
      });
    }
  });

  function renderResults(query = '') {
    const q = query.toLowerCase().trim();
    const filtered = SEARCH_ITEMS.filter(item =>
      item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    ).slice(0, 10);

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-subtle);">No matching syllabus topics found.</div>';
      return;
    }

    resultsContainer.innerHTML = filtered.map((item, i) => `
      <div class="command-item ${i === 0 ? 'selected' : ''}" onclick="selectSearchSubject('${item.id}')">
        <div class="command-item-left">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span style="font-weight:500; font-size:0.9rem;">${item.title}</span>
        </div>
        <span class="command-tag">${item.category}</span>
      </div>
    `).join('');
  }

  input.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  window.openCommandPalette = function() {
    palette.classList.add('active');
    input.value = '';
    renderResults();
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  };

  window.closeCommandPalette = function() {
    palette.classList.remove('active');
    document.body.style.overflow = '';
  };

  palette.addEventListener('click', (e) => {
    if (e.target === palette) closeCommandPalette();
  });

  window.selectSearchSubject = function(id) {
    closeCommandPalette();
    if (id) openSubjectModal(id);
  };
}

/* --- 8. Category Filter Pills --- */
function initFilterPills() {
  const pills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.subject-card-item');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-filter');

      if (filter === 'all') {
        cards.forEach(c => c.style.display = 'block');
      } else if (filter === 'agenda' || filter === 'todos') {
        document.getElementById('study-widgets')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        cards.forEach(c => {
          const type = c.getAttribute('data-type') || '';
          if (type.includes(filter)) {
            c.style.display = 'block';
          } else {
            c.style.display = 'none';
          }
        });
      }
      showToast(`Filter applied: ${pill.innerText}`);
    });
  });
}

/* --- 9. Newsletter Form Feedback --- */
function initNewsletter() {
  const form = document.querySelector('.NewsletterSubscribe-module-scss-module__MOPAja__email-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input.value.trim();

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }

    input.value = '';
    showToast('✓ Subscribed! You will receive BCA 3rd Sem exam & syllabus alerts.');
  });
}

/* --- 10. Global Keyboard Shortcuts --- */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      window.openCommandPalette();
    }
    if (e.key === 'Escape') {
      closeSubjectModal();
      window.closeCommandPalette();
      closeAllDropdowns();
    }
  });
}

/* --- 11. Toast Feedback Component --- */
function showToast(message) {
  let toast = document.getElementById('anthropic-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'anthropic-toast';
    toast.className = 'anthropic-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-coral);">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('visible');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}
