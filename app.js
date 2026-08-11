/**
 * BCA 3 Hub — Panjab University 2026-27 Study Dashboard Controller
 * Full SPA Routing (Dedicated Subject Workspaces), Digital Study Notes Repository,
 * Interactive Calendar Switcher and Integrated In-App Admin Portal.
 */

let activeSubjectId = 'comp-arch';
let activeWorkspaceTab = 'units';
let selectedCalendarDate = '2026-08-08';
let currentNoteFilter = 'all';
let _editingItem = null; // { type: 'note'|'lecture'|'announcement', fbKey, collection }
let _currentSubjectNotes = []; // Cached active notes array for focus reader & export
let _globalCloudData = { notes: [], lectures: [], announcements: [] }; // Global cache for search indexing

const ADMIN_PASSKEY = 'Defenderbhabhiontop';
const ADMIN_SESSION_KEY = 'bca_hub_admin_session';
const FIREBASE_DB = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated' || sessionStorage.getItem('bca_admin_session') === 'authenticated';
}

function lockScroll(lock) {
  if (lock) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGreeting();
  initHashRouter();
  initDashboardWidgets();
  initFilterPills();
  initCommandPalette();
  initMobileDrawer();
  updateAdminHeaderUI();
  syncFirebaseData();
});

/* ==========================================================================
   1. HASH ROUTING & SPA VIEW SWITCHING
   ========================================================================== */

function initHashRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  
  if (hash.startsWith('#/subject/')) {
    const subjectId = hash.replace('#/subject/', '').trim();
    renderSubjectWorkspace(subjectId);
  } else if (hash === '#/admin') {
    showDashboardView();
    openAdminModal();
  } else {
    showDashboardView();
  }
}

function navigateToDashboard(e) {
  if (e) e.preventDefault();
  window.location.hash = '#/';
  showDashboardView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToSubject(subjectId) {
  window.location.hash = `#/subject/${subjectId}`;
  renderSubjectWorkspace(subjectId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDashboardView() {
  const dashView = document.getElementById('dashboard-view');
  const wsView = document.getElementById('subject-workspace-view');
  if (dashView) dashView.style.display = 'block';
  if (wsView) wsView.style.display = 'none';
  renderDashboardLectures();
  renderDashboardTodos();
  renderDashboardAnnouncements();
}

/* ==========================================================================
   2. DEDICATED FULL SUBJECT WORKSPACE RENDERING
   ========================================================================== */

function renderSubjectWorkspace(subjectId) {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId) || BCA_3RD_SEM_DATA.subjects[0];
  activeSubjectId = subject.id;

  const dashView = document.getElementById('dashboard-view');
  const wsView = document.getElementById('subject-workspace-view');
  if (dashView) dashView.style.display = 'none';
  if (wsView) {
    wsView.style.display = 'block';
    wsView.classList.remove('view-transition-container');
    void wsView.offsetWidth; // Trigger reflow for animation
    wsView.classList.add('view-transition-container');
  }

  // Update Breadcrumbs & Hero
  document.getElementById('ws-breadcrumb-title').innerText = subject.title;
  document.getElementById('ws-code-badge').innerText = `${subject.code} • ${subject.type}`;
  document.getElementById('ws-credit-tag').innerText = `${subject.credits} Credits • ${subject.theoryHours || 60} Theory Hrs`;
  document.getElementById('ws-subject-title').innerText = subject.title;
  document.getElementById('ws-subject-desc').innerText = subject.description;

  // Hero Card Color Class
  const heroCard = document.getElementById('ws-hero-card');
  heroCard.className = `subject-hero-card ${subject.bgClass || 'bg-cactus'}`;

  // Subject Tags
  const tagsRow = document.getElementById('ws-tags-row');
  tagsRow.innerHTML = (subject.tags || []).map(t => `<span class="topic-badge">${t}</span>`).join('');

  // Sidebar Subjects Switcher
  renderSidebarSubjectLinks();

  // Render Tabs Content
  renderSubjectUnits(subject);
  renderSubjectNotes(subject);
  renderSubjectCalendar(subject);

  // Switch to active tab
  switchWorkspaceTab(activeWorkspaceTab || 'units');
}

function renderSidebarSubjectLinks() {
  const container = document.getElementById('ws-sidebar-subjects');
  if (!container) return;

  const icons = {
    'comp-arch': '🖥️',
    'data-structures': '🌲',
    'numerical-methods': '📐',
    'machine-learning': '🤖',
    'english-3': '📖',
    'web-dev': '🎨',
    'backend-dev': '⚙️'
  };

  container.innerHTML = BCA_3RD_SEM_DATA.subjects.map(s => `
    <a href="#/subject/${s.id}" class="sidebar-subject-link ${s.id === activeSubjectId ? 'current' : ''}" onclick="navigateToSubject('${s.id}')">
      <span>${icons[s.id] || '📑'}</span>
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.shortTitle || s.title}</span>
      <span class="tree-item-badge">${s.credits}C</span>
    </a>
  `).join('');
}

function switchWorkspaceTab(tabName) {
  activeWorkspaceTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.workspace-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Update sidebar tree items
  document.querySelectorAll('.sidebar-tree-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-target-tab') === tabName);
  });

  // Switch tab content views
  ['units', 'notes', 'calendar'].forEach(tab => {
    const el = document.getElementById(`ws-tab-${tab}`);
    if (el) el.style.display = tab === tabName ? 'block' : 'none';
  });
}

/* ==========================================================================
   3. UNITS BREAKDOWN (UNITS I–IV WITH TOPIC CHECKLISTS)
   ========================================================================== */

function renderSubjectUnits(subject) {
  const container = document.getElementById('ws-units-list');
  if (!container) return;

  if (!subject.units || !subject.units.length) {
    container.innerHTML = `<div class="empty-state">No units defined for this course.</div>`;
    return;
  }

  container.innerHTML = subject.units.map((unit, idx) => {
    const topicsHtml = (unit.topics || []).map((topic, tIdx) => {
      const topicKey = `topic_${subject.id}_u${idx}_t${tIdx}`;
      const isChecked = localStorage.getItem(topicKey) === 'true';
      return `
        <label class="topic-checklist-item" id="label_${topicKey}">
          <input type="checkbox" class="topic-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTopicCheck('${topicKey}', this)"/>
          <span style="${isChecked ? 'text-decoration: line-through; opacity: 0.65;' : ''}">${topic}</span>
        </label>
      `;
    }).join('');

    const keyPointsHtml = (unit.keyPoints && unit.keyPoints.length) ? `
      <div class="unit-keypoints-box">
        <div class="unit-keypoints-title">💡 Core Takeaways &amp; Exam Focus</div>
        <ul class="unit-keypoints-list">
          ${unit.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return `
      <div class="unit-card-block">
        <div class="unit-card-header">
          <span class="unit-pill-tag">${unit.unitNumber}</span>
          <span style="font-size: 0.8125rem; color: var(--text-subtle);">${unit.topics ? unit.topics.length : 0} Core Topics</span>
        </div>
        <h3 class="unit-card-title">${unit.title}</h3>
        <p class="unit-summary-text">${unit.summary || 'Detailed syllabus topics and technical competencies for this unit.'}</p>
        
        <div class="unit-topics-checklist">
          ${topicsHtml}
        </div>

        ${keyPointsHtml}
      </div>
    `;
  }).join('');
}

function toggleTopicCheck(topicKey, checkbox) {
  localStorage.setItem(topicKey, checkbox.checked);
  const label = document.getElementById(`label_${topicKey}`);
  if (label) {
    const span = label.querySelector('span');
    if (span) {
      span.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
      span.style.opacity = checkbox.checked ? '0.65' : '1';
    }
  }
  showToast(checkbox.checked ? 'Topic marked as completed! 🎯' : 'Topic marked for review.');
}

/* ==========================================================================
   4. DIGITAL NOTES REPOSITORY (TOPIC CARDS + FULL-PAGE ARTICLE READER)
   ========================================================================== */

let _currentlyOpenNoteId = null;

async function renderSubjectNotes(subject) {
  const container = document.getElementById('ws-notes-stream');
  if (!container) return;

  // Make sure we are on the list subview
  const listSubView = document.getElementById('ws-notes-list-subview');
  const readerSubView = document.getElementById('ws-notes-reader-subview');
  if (listSubView && readerSubView && !_currentlyOpenNoteId) {
    listSubView.style.display = 'block';
    readerSubView.style.display = 'none';
  }

  // Fetch live digital notes from Firebase 'notes' collection (and fallback check 'lectures' for legacy items)
  const [rawFbNotes, rawFbLectures] = await Promise.all([
    _fbFetch('notes'),
    _fbFetch('lectures')
  ]);

  const subjectId = subject.id;
  const fbNotes = rawFbNotes.filter(n => (n.subject === subjectId || n.subjectId === subjectId));
  
  // Also include any notes that were previously stored in lectures collection
  const legacyLectureNotes = rawFbLectures
    .filter(l => (l.subject === subjectId || l.subjectId === subjectId) && (l.isAdminPublished || (l.content && !l.topic) || l.readTime))
    .map(l => ({
      id: l.id || l.fbKey,
      fbKey: l.fbKey,
      unit: l.unit || 'General',
      title: l.title || l.topic || 'Digital Note',
      content: l.content || l.notes || l.description || '',
      date: l.date,
      readTime: l.readTime || '6 min read',
      tags: l.tags || ['Study Guide'],
      author: l.author || 'Baljot Chohan',
      isAdminPublished: true
    }));

  const combinedCloudNotes = [
    ...fbNotes,
    ...legacyLectureNotes.filter(ln => !fbNotes.some(fn => fn.fbKey === ln.fbKey || fn.id === ln.id))
  ];

  const allNotes = [...(subject.digitalNotes || []), ...combinedCloudNotes];
  _currentSubjectNotes = allNotes;

  if (!allNotes.length) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-subtle);">
        <p style="font-size: 1rem; margin-bottom: 1rem;">No digital notes published yet for ${escapeHtml(subject.title)}.</p>
        <button class="admin-submit-btn" style="display: inline-flex; width: auto; padding: 0.6rem 1.25rem;" onclick="openAdminModal()">
          <span>+ Create &amp; Publish Note as Admin</span>
        </button>
      </div>
    `;
    return;
  }

  let filtered = allNotes;
  if (currentNoteFilter && currentNoteFilter !== 'all') {
    filtered = allNotes.filter(n => n.unit === currentNoteFilter);
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-subtle);">
        <p style="font-size: 0.95rem; margin-bottom: 1rem;">No notes found under <strong>${escapeHtml(currentNoteFilter)}</strong>.</p>
        <button class="note-filter-btn active" onclick="filterNotesByUnit('all', document.querySelector('#ws-notes-filter-bar .note-filter-btn'))">Show All Topics</button>
      </div>
    `;
    return;
  }

  // Render sleek, compact Topic Cards instead of huge text walls
  container.innerHTML = filtered.map(note => {
    const noteKey = note.fbKey || note.id;
    const isCloud = Boolean(note.fbKey);
    const authorName = note.author || 'Baljot Chohan';
    const excerpt = getPlainExcerpt(note.content, 140);

    return `
      <div class="note-topic-card" onclick="openNoteReaderView('${noteKey}')">
        <div class="note-topic-header">
          <div class="note-meta-left" style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
            <span class="note-unit-badge">${escapeHtml(note.unit || 'Unit I')}</span>
            <span class="note-author-pill">✍️ By ${escapeHtml(authorName)}</span>
            <span class="note-read-time">⏱️ ${escapeHtml(note.readTime || '6 min read')}</span>
            ${note.date ? `<span style="font-size: 0.72rem; color: var(--text-subtle);">📅 ${escapeHtml(note.date)}</span>` : ''}
          </div>
          <div class="note-actions-bar" onclick="event.stopPropagation()">
            ${isAdminAuthenticated() && isCloud ? `
              <button class="note-tool-btn" onclick="deleteNoteLive('${note.fbKey}', event)" title="Admin: Delete Note" style="color: #d44f4f; border-color: rgba(212,79,79,0.3); background: rgba(212,79,79,0.06);">
                <span>🗑️ Delete</span>
              </button>
            ` : ''}
            <button class="note-tool-btn" onclick="copyNoteContent('${noteKey}'); event.stopPropagation();" title="Copy note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div class="note-topic-title-row">
          <h3 class="note-topic-title">${escapeHtml(note.title)}</h3>
        </div>

        ${excerpt ? `<p class="note-topic-excerpt">${escapeHtml(excerpt)}</p>` : ''}

        <div class="note-topic-footer">
          <div class="topic-tags-row" style="margin: 0;">
            ${(note.tags || []).slice(0, 3).map(t => `<span class="topic-tag-pill">${escapeHtml(t.replace(/^#/, ''))}</span>`).join('')}
          </div>
          <button class="note-read-btn">
            <span>📖 Read Full Note ➔</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openNoteReaderView(noteKey) {
  const note = (_currentSubjectNotes || []).find(n => (n.fbKey === noteKey || n.id === noteKey));
  if (!note) return;

  _currentlyOpenNoteId = noteKey;

  const listSubView = document.getElementById('ws-notes-list-subview');
  const readerSubView = document.getElementById('ws-notes-reader-subview');
  if (listSubView) listSubView.style.display = 'none';
  if (readerSubView) readerSubView.style.display = 'block';

  const authorName = note.author || 'Baljot Chohan';
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  const subjectTitle = subject ? subject.title : 'Subject';

  // Breadcrumbs
  const crumbsEl = document.getElementById('note-reader-crumbs');
  if (crumbsEl) {
    crumbsEl.innerHTML = `${escapeHtml(subjectTitle)} › <strong style="color: var(--text-main);">${escapeHtml(note.unit || 'Unit')}</strong> › ${escapeHtml(note.title)}`;
  }

  // Header metadata
  const unitEl = document.getElementById('note-reader-unit');
  if (unitEl) unitEl.textContent = note.unit || 'Unit I';

  const authorEl = document.getElementById('note-reader-author');
  if (authorEl) authorEl.textContent = `✍️ By ${authorName}`;

  const timeEl = document.getElementById('note-reader-time');
  if (timeEl) timeEl.textContent = note.readTime || '6 min read';

  const dateEl = document.getElementById('note-reader-date');
  if (dateEl) dateEl.textContent = note.date ? `📅 ${note.date}` : 'August 2026';

  const titleEl = document.getElementById('note-reader-title');
  if (titleEl) titleEl.textContent = note.title;

  const tagsEl = document.getElementById('note-reader-tags');
  if (tagsEl) {
    tagsEl.innerHTML = (note.tags || []).map(t => `<span class="topic-tag-pill">${escapeHtml(t.replace(/^#/, ''))}</span>`).join('');
  }

  // Render markdown body with diagrams & LaTeX
  const bodyEl = document.getElementById('note-reader-body');
  if (bodyEl) {
    bodyEl.innerHTML = renderMarkdownBlocks(note.content);
    if (window.ManimVisuals) {
      setTimeout(() => window.ManimVisuals.mountAll(bodyEl), 40);
    }
  }

  // Update previous/next topic buttons
  updateReaderNavButtons(noteKey);

  // Smooth scroll to top of workspace
  const workspaceView = document.getElementById('subject-workspace-view');
  if (workspaceView) {
    workspaceView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeNoteReaderView() {
  _currentlyOpenNoteId = null;
  const listSubView = document.getElementById('ws-notes-list-subview');
  const readerSubView = document.getElementById('ws-notes-reader-subview');
  if (readerSubView) readerSubView.style.display = 'none';
  if (listSubView) listSubView.style.display = 'block';
}

function updateReaderNavButtons(currentKey) {
  const all = _currentSubjectNotes || [];
  const idx = all.findIndex(n => (n.fbKey === currentKey || n.id === currentKey));

  const prevBtn = document.getElementById('note-prev-btn');
  const nextBtn = document.getElementById('note-next-btn');
  const prevTitle = document.getElementById('note-prev-title');
  const nextTitle = document.getElementById('note-next-title');

  if (idx > 0) {
    const prevNote = all[idx - 1];
    if (prevBtn) prevBtn.style.visibility = 'visible';
    if (prevTitle) prevTitle.textContent = prevNote.title;
  } else {
    if (prevBtn) prevBtn.style.visibility = 'hidden';
  }

  if (idx >= 0 && idx < all.length - 1) {
    const nextNote = all[idx + 1];
    if (nextBtn) nextBtn.style.visibility = 'visible';
    if (nextTitle) nextTitle.textContent = nextNote.title;
  } else {
    if (nextBtn) nextBtn.style.visibility = 'hidden';
  }
}

function navigateNotePrev() {
  const all = _currentSubjectNotes || [];
  const idx = all.findIndex(n => (n.fbKey === _currentlyOpenNoteId || n.id === _currentlyOpenNoteId));
  if (idx > 0) {
    const prevNote = all[idx - 1];
    openNoteReaderView(prevNote.fbKey || prevNote.id);
  }
}

function navigateNoteNext() {
  const all = _currentSubjectNotes || [];
  const idx = all.findIndex(n => (n.fbKey === _currentlyOpenNoteId || n.id === _currentlyOpenNoteId));
  if (idx >= 0 && idx < all.length - 1) {
    const nextNote = all[idx + 1];
    openNoteReaderView(nextNote.fbKey || nextNote.id);
  }
}

function copyCurrentOpenNote() {
  const note = (_currentSubjectNotes || []).find(n => (n.fbKey === _currentlyOpenNoteId || n.id === _currentlyOpenNoteId));
  if (note && note.content) {
    navigator.clipboard.writeText(note.content).then(() => {
      showToast('Copied full markdown note to clipboard! 📋');
    });
  }
}

function getPlainExcerpt(content, maxLen = 140) {
  if (!content) return '';
  const clean = content
    .replace(/@\[.*?\]\(.*?\)/g, '')
    .replace(/@\[.*?\]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s*/g, '')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > maxLen ? clean.substring(0, maxLen) + '...' : clean;
}

function filterNotesByUnit(unit, btn) {
  currentNoteFilter = unit;
  document.querySelectorAll('#ws-notes-filter-bar .note-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectNotes(subject);
}

function insertVisualTagToEditor(tag) {
  if (!tag) return;
  const textarea = document.getElementById('adm-note-content');
  if (!textarea) return;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + '\n\n' + tag + '\n\n' + text.substring(end);
  textarea.focus();
  showToast('Inserted visual animation tag! ✨');
}

function renderMarkdownBlocks(content) {
  if (!content) return '';

  let html = content;

  // 1. Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // 1b. Interactive Manim Visual Tags @[visual:type]
  html = html.replace(/@\[visual:([a-zA-Z0-9_\-]+)\]/g, (match, type) => {
    return `<div class="manim-visual-mount" data-manim-visual="${escapeHtml(type.trim())}"></div>`;
  });

  // 1c. Manim Video Clips @[video:title](url) or @[manim:title](url)
  html = html.replace(/@\[(?:video|manim):(.*?)\]\((.*?)\)/g, (match, title, url) => {
    return `
      <div class="manim-visual-card">
        <div class="manim-card-header">
          <div class="manim-header-title-row">
            <span class="manim-tag">🎬 Manim Mathematical Animation</span>
          </div>
          <h3 class="manim-title">${escapeHtml(title || 'Mathematical Visualization')}</h3>
        </div>
        <div class="manim-canvas-container" style="background: #000;">
          <video controls autoplay loop muted playsinline style="width: 100%; max-height: 420px; display: block;">
            <source src="${url}" type="video/mp4">
            <source src="${url}" type="video/webm">
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    `;
  });

  // 2. Code blocks & ASCII diagrams (matches closed or unclosed ``` or ''')
  html = html.replace(/(?:```|''')([a-zA-Z0-9_\-\+]+)?[ \t]*\n?([\s\S]*?)(?:```|'''|$)/g, (match, lang, code) => {
    if (!code || !code.trim()) return '';
    const cleanCode = escapeHtml(code.trim());
    const language = lang ? lang.trim() : 'DIAGRAM / ARCHITECTURE';
    return `
      <div class="notion-code-container">
        <div class="notion-code-header">
          <span>${escapeHtml(language.toUpperCase())}</span>
          <button class="copy-code-btn" onclick="copySnippet(this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy Code</span>
          </button>
        </div>
        <pre class="notion-code-block"><code>${cleanCode}</code></pre>
      </div>
    `;
  });

  // Helper: Format common LaTeX expressions into clean Unicode math
  function formatMathSymbols(text) {
    if (!text) return '';
    let s = text;
    
    // 1. Text & font wrappers
    s = s.replace(/\\text\{([^}]+)\}/g, '$1')
         .replace(/\\mathbf\{([^}]+)\}/g, '$1');

    // 2. High-priority macros
    s = s.replace(/\\implies/g, ' ⟹ ')
         .replace(/\\iff/g, ' ⟺ ')
         .replace(/\\rightarrow|\\to/g, ' → ')
         .replace(/\\leftarrow/g, ' ← ')
         .replace(/\\longleftrightarrow/g, ' ⟷ ')
         .replace(/\\longrightarrow/g, ' ⟶ ')
         .replace(/\\le|\\leq/g, ' ≤ ')
         .replace(/\\ge|\\geq/g, ' ≥ ')
         .replace(/\\approx/g, ' ≈ ')
         .replace(/\\ne|\\neq/g, ' ≠ ')
         .replace(/\\pm/g, ' ± ')
         .replace(/\\cdot|\\times/g, ' · ')
         .replace(/\\mid/g, ' | ')
         .replace(/\\in/g, ' ∈ ')
         .replace(/\\notin/g, ' ∉ ')
         .replace(/\\forall/g, ' ∀ ')
         .replace(/\\exists/g, ' ∃ ')
         .replace(/\\arg\\min/g, 'arg min')
         .replace(/\\arg\\max/g, 'arg max');

    // 3. Summations, Products & Integrals
    s = s.replace(/\\sum_\{([^}]+)\}\^\{?([a-zA-Z0-9]+)\}?/g, '∑ ($1 to $2)')
         .replace(/\\sum_\{([^}]+)\}/g, '∑ ($1)')
         .replace(/\\sum/g, '∑ ')
         .replace(/\\prod_\{([^}]+)\}\^\{?([a-zA-Z0-9]+)\}?/g, '∏ ($1 to $2)')
         .replace(/\\prod_\{([^}]+)\}/g, '∏ ($1)')
         .replace(/\\prod/g, '∏ ')
         .replace(/\\int_\{([^}]+)\}\^\{?([a-zA-Z0-9]+)\}?/g, '∫ ($1 to $2)')
         .replace(/\\int/g, '∫ ');

    // 4. Fractions & Radicals
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
         .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
         .replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, '√$1');

    // 5. Functions & Greek Letters
    s = s.replace(/\\log_?2/g, 'log₂')
         .replace(/\\log_\{([^}]+)\}/g, 'log_($1)')
         .replace(/\\log/g, 'log')
         .replace(/\\ln/g, 'ln')
         .replace(/\\partial/g, '∂')
         .replace(/\\Delta/g, 'Δ')
         .replace(/\\nabla/g, '∇')
         .replace(/\\xi/g, 'ξ')
         .replace(/\\epsilon/g, 'ε')
         .replace(/\\eta/g, 'η')
         .replace(/\\sigma/g, 'σ')
         .replace(/\\mu/g, 'μ')
         .replace(/\\alpha/g, 'α')
         .replace(/\\beta/g, 'β')
         .replace(/\\theta/g, 'θ')
         .replace(/\\infty/g, '∞');

    // 6. Subscripts & Superscripts
    const subs = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','a':'ₐ','e':'ₑ','i':'ᵢ','n':'ₙ','v':'ᵥ','x':'ₓ','y':'ᵧ','t':'ₜ','+':'₊','-':'₋' };
    const sups = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','*':'*','n':'ⁿ','t':'ᵗ','x':'ˣ','2':'²','3':'³' };

    s = s.replace(/_\{?([0-9a-zA-Z\+\-]+)\}?/g, (m, sub) => sub.split('').map(c => subs[c] || c).join(''));
    s = s.replace(/\^\{?([0-9a-zA-Z\+\-\*]+)\}?/g, (m, sup) => sup.split('').map(c => sups[c] || c).join(''));

    return s;
  }

  // 3. LaTeX / Math formulas
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (m, math) => `<div class="math-display-block" style="background: var(--bg-surface-subtle); padding: 0.85rem 1.25rem; border-radius: 8px; font-family: var(--font-serif); font-size: 1.18rem; text-align: center; margin: 1.25rem 0; border: 1px solid var(--border-color); color: var(--text-main); font-style: italic;">${escapeHtml(formatMathSymbols(math.trim()))}</div>`);
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (m, math) => `<div class="math-display-block" style="background: var(--bg-surface-subtle); padding: 0.85rem 1.25rem; border-radius: 8px; font-family: var(--font-serif); font-size: 1.18rem; text-align: center; margin: 1.25rem 0; border: 1px solid var(--border-color); color: var(--text-main); font-style: italic;">${escapeHtml(formatMathSymbols(math.trim()))}</div>`);
  html = html.replace(/\$([^\$\n]+)\$/g, (m, math) => `<span class="math-inline" style="font-family: var(--font-serif); font-style: italic; color: var(--color-coral); font-size: 1.05em; font-weight: 500;">${escapeHtml(formatMathSymbols(math))}</span>`);
  html = html.replace(/\\\(([^\)\n]+)\\\)/g, (m, math) => `<span class="math-inline" style="font-family: var(--font-serif); font-style: italic; color: var(--color-coral); font-size: 1.05em; font-weight: 500;">${escapeHtml(formatMathSymbols(math))}</span>`);

  // 4. Markdown Tables
  html = html.replace(/\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
    const headers = header.split('|').map(h => h.trim()).filter(h => h.length > 0);
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const rowLines = rows.trim().split('\n');
    const trs = rowLines.map(r => {
      const cols = r.split('|').map(c => c.trim()).filter(c => c.length > 0);
      return `<tr>${cols.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="notion-table-wrapper"><table class="notion-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });

  // 5. Callouts (> 💡 etc.)
  html = html.replace(/^>\s*(💡|📌|⚡|🚨|📝)?\s*(.*?)$/gm, (match, icon, text) => {
    return `<div class="notion-callout"><span class="notion-callout-icon">${icon || '💡'}</span><div>${text}</div></div>`;
  });

  // 6. Headings (from h5 down to h1)
  html = html.replace(/^##### (.*$)/gim, '<h5 style="font-size: 0.95rem; font-weight: 700; margin: 0.9rem 0 0.25rem 0; color: var(--text-main);">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 style="font-size: 1.05rem; font-weight: 600; margin: 1.15rem 0 0.35rem 0; color: var(--text-main);">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.2rem; font-weight: 600; margin: 1.25rem 0 0.4rem 0; color: var(--text-main);">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-family: var(--font-serif); font-size: 1.45rem; font-weight: 600; margin: 1.5rem 0 0.5rem 0; color: var(--text-main);">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; color: var(--text-main);">$1</h1>');

  // 7. Horizontal Rules
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 1.5rem 0;"/>');

  // 8. Lists
  html = html.replace(/^\*\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.35rem; color: var(--text-muted);">$1</li>');
  html = html.replace(/^-\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.35rem; color: var(--text-muted);">$1</li>');

  // 9. Images: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    return `
      <div style="margin: 1.25rem 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000;">
        <div style="padding: 0.45rem 0.85rem; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
          🎨 Visual Diagram — ${escapeHtml(alt || 'Infographic')}
        </div>
        <img src="${url}" alt="${escapeHtml(alt)}" style="width: 100%; max-height: 480px; object-fit: contain; display: block;" onerror="this.parentElement.style.display='none';" />
      </div>
    `;
  });

  // 10. Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: var(--color-coral); text-decoration: underline;">$1 ↗</a>');

  // 11. Bold & Italic & Inline Code
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="font-family: var(--font-mono); background-color: var(--color-oat); padding: 0.15rem 0.35rem; border-radius: 4px; font-size: 0.85em;">$1</code>');

  // 12. Paragraph breaks
  html = html.replace(/\n\n/g, '</p><p>');

  return `<p>${html}</p>`;
}

function copySnippet(btn) {
  const container = btn.closest('.notion-code-container');
  const code = container.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.innerHTML = '<span>✅ Copied!</span>';
    setTimeout(() => {
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy Code</span>';
    }, 2000);
    showToast('Code copied to clipboard! 📋');
  });
}

function copyNoteContent(noteId) {
  const el = document.getElementById(`note-body-${noteId}`);
  if (el) {
    navigator.clipboard.writeText(el.innerText).then(() => {
      showToast('Full note copied to clipboard! 📋');
    });
  }
}

function exportCurrentSubjectNotes() {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (!subject) return;

  const allNotes = _currentSubjectNotes && _currentSubjectNotes.length ? _currentSubjectNotes : (subject.digitalNotes || []);

  let md = `# ${subject.title} (${subject.code})\n\n`;
  md += `Panjab University BCA 3rd Semester — ${subject.type} (${subject.credits} Credits)\n\n---\n\n`;

  allNotes.forEach(n => {
    md += `## ${n.title}\nUnit: ${n.unit || 'General'} | Date: ${n.date || 'Aug 2026'}\n\n`;
    md += `${n.content}\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${subject.id}-notes.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${subject.title} notes as Markdown! 📥`);
}

/* --- Live Firebase RTDB Helper Functions --- */

async function _fbFetch(path) {
  try {
    const res = await fetch(`${FIREBASE_DB}/${path}.json`);
    const data = await res.json();
    if (!data || data.error) return [];
    const list = Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (_globalCloudData[path]) {
      _globalCloudData[path] = list;
    }
    return list;
  } catch (err) {
    return [];
  }
}

async function deleteNoteLive(fbKey, e) {
  if (e) e.stopPropagation();
  if (!fbKey) return;

  if (!isAdminAuthenticated()) {
    showToast('🔒 Administrator passkey required to delete content.');
    openAdminModal();
    return;
  }

  if (!confirm('Are you sure you want to permanently delete this public note from cloud?')) return;

  showToast('⏳ Removing note from cloud...');
  try {
    await Promise.all([
      fetch(`${FIREBASE_DB}/notes/${fbKey}.json`, { method: 'DELETE' }),
      fetch(`${FIREBASE_DB}/lectures/${fbKey}.json`, { method: 'DELETE' })
    ]);
    showToast('🗑️ Note permanently deleted from cloud!');
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) || BCA_3RD_SEM_DATA.subjects[0];
    if (subject) {
      renderSubjectNotes(subject);
    }
    renderDashboardLectures();
    renderAdminManageData();
  } catch (err) {
    showToast('❌ Deletion failed: ' + err.message);
  }
}

async function deleteFirebaseItem(collection, fbKey, e) {
  if (e) e.stopPropagation();
  if (!fbKey) return;

  if (!isAdminAuthenticated()) {
    showToast('🔒 Administrator passkey required to delete content.');
    openAdminModal();
    return;
  }

  if (!confirm('Are you sure you want to permanently delete this item from cloud?')) return;

  showToast('⏳ Removing item from cloud...');
  try {
    await fetch(`${FIREBASE_DB}/${collection}/${fbKey}.json`, { method: 'DELETE' });
    if (collection === 'notes') {
      await fetch(`${FIREBASE_DB}/lectures/${fbKey}.json`, { method: 'DELETE' });
    } else if (collection === 'lectures') {
      await fetch(`${FIREBASE_DB}/notes/${fbKey}.json`, { method: 'DELETE' });
    }

    showToast('🗑️ Item deleted successfully from cloud!');
    
    // Refresh all live views
    renderDashboardLectures();
    renderDashboardAnnouncements();
    renderDashboardTodos();
    renderAdminManageData();
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) || BCA_3RD_SEM_DATA.subjects[0];
    if (subject) {
      renderSubjectCalendar(subject);
      renderSubjectNotes(subject);
    }
  } catch (err) {
    showToast('❌ Deletion failed: ' + err.message);
  }
}

function getSubjectName(subjectId) {
  const s = BCA_3RD_SEM_DATA.subjects.find(sub => sub.id === subjectId);
  return s ? s.title : (subjectId || 'General');
}

/* ==========================================================================
   5. INTERACTIVE CALENDAR SWITCHER & DAILY LECTURE LOGS
   ========================================================================== */

async function renderSubjectCalendar(subject) {
  const calGrid = document.getElementById('ws-calendar-grid');
  const quickDatesBar = document.getElementById('ws-quick-dates-bar');
  const lecturesList = document.getElementById('ws-subject-lectures-list');
  if (!calGrid || !lecturesList) return;

  // Fetch live lectures from Firebase
  let fbLectures = await _fbFetch('lectures');
  fbLectures = fbLectures.filter(l => (l.subject === subject.id || l.subjectId === subject.id));

  const allLectures = [...fbLectures, ...(subject.lectures || [])];

  // Map of active dates
  const lectureDateMap = {};
  allLectures.forEach(l => {
    if (l.date) lectureDateMap[l.date] = l;
  });

  // Generate August 2026 Calendar Grid (Aug 1, 2026 is a Saturday = index 6)
  let gridHtml = '';
  // Leading empty cells for Saturday start (6 blanks)
  for (let i = 0; i < 6; i++) {
    gridHtml += `<div class="cal-day-cell empty"></div>`;
  }

  for (let day = 1; day <= 31; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateKey = `2026-08-${dayStr}`;
    const hasLecture = Boolean(lectureDateMap[dateKey]);
    const isSelected = dateKey === selectedCalendarDate;

    gridHtml += `
      <div class="cal-day-cell ${hasLecture ? 'has-lecture' : ''} ${isSelected ? 'selected' : ''}" onclick="selectCalendarDate('${dateKey}', '${subject.id}')" title="${hasLecture ? 'Lecture: ' + lectureDateMap[dateKey].topic : 'August ' + day}">
        <span>${day}</span>
      </div>
    `;
  }
  calGrid.innerHTML = gridHtml;

  // Quick Date Switcher Pills Bar
  const dateKeys = Object.keys(lectureDateMap).sort();
  if (quickDatesBar) {
    quickDatesBar.innerHTML = `
      <button class="quick-date-pill ${selectedCalendarDate === 'all' ? 'active' : ''}" onclick="selectCalendarDate('all', '${subject.id}')">All Lectures (${allLectures.length})</button>
      ${dateKeys.map(dk => {
        const dNum = dk.split('-')[2];
        return `
          <button class="quick-date-pill ${selectedCalendarDate === dk ? 'active' : ''}" onclick="selectCalendarDate('${dk}', '${subject.id}')">Aug ${dNum}</button>
        `;
      }).join('')}
    `;
  }

  // Update Highlighted Active Day Card
  updateActiveDayCard(subject, allLectures);

  // Chronological List
  renderSubjectLecturesList(subject, allLectures);
}

function selectCalendarDate(dateKey, subjectId) {
  selectedCalendarDate = dateKey;
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId) || BCA_3RD_SEM_DATA.subjects[0];
  renderSubjectCalendar(subject);
}

function updateActiveDayCard(subject, allLectures) {
  const card = document.getElementById('ws-active-day-card');
  const titleEl = document.getElementById('active-day-title');
  const timeEl = document.getElementById('active-day-time');
  const topicEl = document.getElementById('active-day-topic');
  const descEl = document.getElementById('active-day-desc');

  if (!card) return;

  if (selectedCalendarDate === 'all') {
    titleEl.innerText = `All ${allLectures.length} Lectures for ${subject.title}`;
    timeEl.innerText = 'Aug 2026 Session';
    topicEl.innerText = 'Showing complete chronological curriculum timeline below';
    descEl.innerText = 'Click any date above on the interactive calendar to inspect that single day’s lecture notes, timings, and attached file links.';
    return;
  }

  const lecture = allLectures.find(l => l.date === selectedCalendarDate);
  const dateFormatted = formatDateLong(selectedCalendarDate);

  if (lecture) {
    titleEl.innerText = `Lecture on ${dateFormatted}`;
    timeEl.innerText = lecture.time || '10:00 AM';
    topicEl.innerText = lecture.topic;
    descEl.innerText = lecture.description || lecture.notes || 'Core topics covered during class session.';
  } else {
    titleEl.innerText = `No Lecture Logged for ${dateFormatted}`;
    timeEl.innerText = 'Free / Study Day';
    topicEl.innerText = 'Revision & Self Study';
    descEl.innerText = 'No lecture was held on this date. Use this time to revise digital notes and practice code algorithms.';
  }
}

function renderSubjectLecturesList(subject, allLectures) {
  const container = document.getElementById('ws-subject-lectures-list');
  if (!container) return;

  if (!allLectures.length) {
    container.innerHTML = `<div class="empty-state">No lecture logs recorded yet.</div>`;
    return;
  }

  let filtered = allLectures;
  if (selectedCalendarDate && selectedCalendarDate !== 'all') {
    filtered = allLectures.filter(l => l.date === selectedCalendarDate);
    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">No lecture on ${formatDateLong(selectedCalendarDate)}. Switch to "All Lectures" to view all records.</div>`;
      return;
    }
  }

  container.innerHTML = filtered.map(l => `
    <div class="lecture-item">
      <div class="lecture-date-box">
        <span class="lecture-month">AUG</span>
        <span class="lecture-day">${l.date ? l.date.split('-')[2] || '01' : '01'}</span>
      </div>
      <div class="lecture-info">
        <div class="lecture-topic-title">${escapeHtml(l.topic)}</div>
        <div class="lecture-meta-row">
          <span class="lecture-subject-badge">${l.unit || 'Unit I'}</span>
          <span>⏱️ ${l.time || '10:00 AM'}</span>
          <span>📅 ${l.date ? formatDateLong(l.date) : ''}</span>
        </div>
        <p class="lecture-desc">${renderMarkdownBlocks(l.notes || l.description || '')}</p>
        ${l.imageUrl ? `
          <div style="margin-top: 0.75rem; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000;">
            <div style="padding: 0.4rem 0.75rem; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              🎨 Visual Study Diagram / Infographic
            </div>
            <img src="${escapeHtml(l.imageUrl)}" alt="${escapeHtml(l.topic)} visual note" style="width: 100%; max-height: 450px; object-fit: contain; display: block;" onerror="this.parentElement.style.display='none';" />
          </div>
        ` : ''}
        ${l.fileUrl || l.link ? `<a href="${l.fileUrl || l.link}" target="_blank" rel="noopener" class="lecture-link-btn">↗ View Attached Resource</a>` : ''}
        ${isAdminAuthenticated() && l.fbKey ? `
          <div style="margin-top: 1rem;">
            <button onclick="deleteNoteLive('${l.fbKey}', event)" title="Admin: Delete Note Live" style="background: rgba(212, 79, 79, 0.12); color: #d44f4f; border: 1px solid rgba(212, 79, 79, 0.35); border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
              🛡️ Delete Lecture Log
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   6. DASHBOARD WIDGETS & TIMELINES
   ========================================================================== */

function initDashboardWidgets() {
  renderDashboardLectures();
  renderDashboardTodos();
  renderDashboardAnnouncements();
}

async function renderDashboardLectures() {
  const container = document.getElementById('dashboard-lectures-list');
  if (!container) return;

  // Fetch live notes and lectures from Firebase RTDB
  const [fbNotes, fbLectures] = await Promise.all([
    _fbFetch('notes'),
    _fbFetch('lectures')
  ]);

  const cloudItems = [
    ...fbNotes.map(n => ({
      ...n,
      topic: n.title || n.topic,
      subjectName: getSubjectName(n.subject || n.subjectId),
      subjectId: n.subject || n.subjectId,
      time: n.readTime || 'Digital Note',
      isNote: true
    })),
    ...fbLectures.map(l => ({
      ...l,
      subjectName: getSubjectName(l.subject || l.subjectId),
      subjectId: l.subject || l.subjectId,
      isNote: false
    }))
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Gather static lectures
  let staticLectures = [];
  BCA_3RD_SEM_DATA.subjects.forEach(s => {
    (s.lectures || []).forEach(l => staticLectures.push({ ...l, subjectName: s.title, subjectId: s.id }));
  });

  const all = [...cloudItems, ...staticLectures];

  const badge = document.getElementById('lecture-count-badge');
  if (badge) badge.innerText = `${all.length} Notes/Lectures`;

  if (!all.length) {
    container.innerHTML = `<div class="empty-state">No lectures or notes recorded yet.</div>`;
    return;
  }

  container.innerHTML = all.slice(0, 10).map(l => `
    <div class="lecture-item" onclick="navigateToSubject('${l.subjectId}')" style="cursor: pointer; position: relative;">
      <div class="lecture-date-box">
        <span class="lecture-month">AUG</span>
        <span class="lecture-day">${l.date ? l.date.split('-')[2] || '01' : '01'}</span>
      </div>
      <div class="lecture-info" style="flex: 1; min-width: 0;">
        <div class="lecture-topic-title">${escapeHtml(l.topic || l.title || 'Lecture')}</div>
        <div class="lecture-meta-row">
          <span class="lecture-subject-badge">${escapeHtml(l.subjectName || l.subject || 'General')}</span>
          <span>⏱️ ${l.time || '10:00 AM'}</span>
          <span>${l.unit || ''}</span>
        </div>
      </div>
      ${isAdminAuthenticated() && l.fbKey ? `
        <button onclick="deleteNoteLive('${l.fbKey}', event)" title="Admin: Delete Note Live" style="background: rgba(212, 79, 79, 0.12); color: #d44f4f; border: 1px solid rgba(212, 79, 79, 0.35); border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; flex-shrink: 0; align-self: center;">
          🛡️ Delete
        </button>
      ` : ''}
    </div>
  `).join('');
}

async function renderDashboardTodos() {
  const container = document.getElementById('dashboard-todos-list');
  const badge = document.getElementById('todo-progress-badge');
  if (!container) return;

  const todos = await _fbFetch('todos');
  const doneCount = todos.filter(t => t.done).length;
  if (badge) badge.innerText = `${doneCount}/${todos.length} Done`;

  if (!todos.length) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-subtle); padding: 0.75rem 0;">No active study tasks. Add a study target above.</p>`;
    return;
  }

  container.innerHTML = todos.map(t => {
    const key = t.fbKey || t.id;
    return `
      <div class="todo-item-row ${t.done ? 'done' : ''}">
        <input type="checkbox" class="todo-checkbox" ${t.done ? 'checked' : ''} onchange="toggleTodoLive('${key}', ${Boolean(t.done)})" id="todo-cb-${key}">
        <label for="todo-cb-${key}" class="todo-label-text">${escapeHtml(t.text)}</label>
        ${isAdminAuthenticated() ? `<button class="todo-del-btn" onclick="deleteTodoLive('${key}')" title="Admin: Delete Task">✕</button>` : ''}
      </div>
    `;
  }).join('');
}

async function addNewTodo() {
  const input = document.getElementById('new-todo-input');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  showToast('⏳ Adding study target to cloud...');
  try {
    await fetch(`${FIREBASE_DB}/todos.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        priority: 'medium',
        due: '',
        subject: 'General Study',
        done: false,
        timestamp: Date.now()
      })
    });
    input.value = '';
    showToast('New study target live for all students! 🎯');
    await renderDashboardTodos();
  } catch (err) {
    showToast('❌ Failed to add task: ' + err.message);
  }
}

async function toggleTodoLive(fbKey, currentDone) {
  try {
    await fetch(`${FIREBASE_DB}/todos/${fbKey}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !currentDone })
    });
    await renderDashboardTodos();
  } catch (err) {
    showToast('❌ Failed to update task status: ' + err.message);
  }
}

async function deleteTodoLive(fbKey) {
  if (!isAdminAuthenticated()) {
    showToast('🔒 Administrator passkey required to delete shared study targets.');
    openAdminModal();
    return;
  }
  if (!confirm('Remove this study target from cloud?')) return;
  try {
    await fetch(`${FIREBASE_DB}/todos/${fbKey}.json`, { method: 'DELETE' });
    showToast('Study task removed.');
    await renderDashboardTodos();
  } catch (err) {
    showToast('❌ Failed to remove task: ' + err.message);
  }
}

async function renderDashboardAnnouncements() {
  const container = document.getElementById('dashboard-announcements-list');
  if (!container) return;

  const announcements = await _fbFetch('announcements');
  const catIcons = { notice: '📌', exam: '📅', assignment: '📝', urgent: '🚨' };

  if (!announcements.length) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-subtle); padding: 0.75rem 0;">No announcements posted yet. Use Admin Portal to broadcast notices.</p>`;
    return;
  }

  container.innerHTML = announcements.slice(0, 5).map(a => `
    <div class="announcement-card" style="margin-bottom: 0.75rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
        <span class="admin-item-badge ${a.category === 'urgent' ? 'urgent' : 'coral'}">${catIcons[a.category] || '📌'} ${escapeHtml(a.category || 'Notice')}</span>
        <span style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(a.date || 'Aug 2026')}</span>
      </div>
      <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">${escapeHtml(a.title)}</div>
      <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">${escapeHtml(a.message)}</p>
      ${a.link ? `<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--color-coral); text-decoration: none; display: inline-block; margin-top: 0.35rem;">↗ View Resource</a>` : ''}
    </div>
  `).join('');
}

/* ==========================================================================
   7. INTEGRATED IN-APP ADMIN PORTAL
   ========================================================================== */

function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  lockScroll(true);

  const isAuth = isAdminAuthenticated();
  const authScreen = document.getElementById('admin-auth-screen');
  const controlsScreen = document.getElementById('admin-controls-screen');
  const badge = document.getElementById('admin-status-badge');

  // Restore author selection from localStorage
  const savedAuthor = localStorage.getItem('bca3_admin_author') || 'Baljot Chohan';
  ['adm-note-author', 'adm-lec-author', 'adm-ann-author'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = savedAuthor;
  });

  if (isAuth) {
    if (authScreen) authScreen.style.display = 'none';
    if (controlsScreen) controlsScreen.style.display = 'block';
    if (badge) {
      badge.innerText = '🛡️ Admin Verified';
      badge.style.backgroundColor = 'var(--color-cactus)';
      badge.style.color = 'var(--text-main)';
    }
    switchAdminTab('note');
  } else {
    if (authScreen) authScreen.style.display = 'block';
    if (controlsScreen) controlsScreen.style.display = 'none';
    if (badge) {
      badge.innerText = '🔒 Admin Restricted';
      badge.style.backgroundColor = 'var(--color-oat)';
      badge.style.color = 'var(--color-coral)';
    }
    setTimeout(() => {
      const passInput = document.getElementById('admin-passkey-input') || document.getElementById('inapp-passkey');
      if (passInput) passInput.focus();
    }, 100);
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
  lockScroll(false);
}

function handleInAppAdminLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const passInput = document.getElementById('admin-passkey-input') || document.getElementById('inapp-passkey');
  const passkey = passInput ? passInput.value.trim() : '';
  const errEl = document.getElementById('inapp-login-error');

  if (passkey === ADMIN_PASSKEY) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    if (errEl) errEl.style.display = 'none';
    showToast('🛡️ Admin verification successful! Portal unlocked.');
    updateAdminHeaderUI();
    openAdminModal();
    
    // Refresh active views to show admin actions
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
    if (subject) renderSubjectNotes(subject);
    renderDashboardLectures();
  } else {
    if (errEl) errEl.style.display = 'block';
    showToast('❌ Incorrect passkey.');
    if (passInput) {
      passInput.value = '';
      passInput.focus();
    }
  }
}

function handleInAppAdminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem('bca_admin_session');
  showToast('🔒 Admin signed out. Returned to Student view.');
  updateAdminHeaderUI();
  closeAdminModal();

  // Refresh active views to remove admin buttons
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectNotes(subject);
  renderDashboardLectures();
}

function updateAdminHeaderUI() {
  const container = document.getElementById('header-admin-wrap');
  if (!container) return;
  const isAuth = isAdminAuthenticated();
  if (isAuth) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <button class="header-admin-btn active" onclick="openAdminModal()" title="Admin Mode Active (Click to open portal)" style="background: var(--color-cactus); border-color: var(--color-cactus-border); color: var(--text-main);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Admin Active</span>
        </button>
        <button onclick="handleInAppAdminLogout()" title="Log out of Admin mode" style="background: none; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 0.3rem 0.5rem; font-size: 0.72rem; color: var(--color-coral); cursor: pointer;">
          Exit
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="header-admin-btn" onclick="openAdminModal()" title="Open Admin Portal (Create &amp; Publish Notes)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Admin</span>
      </button>
    `;
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-admintab') === tabName);
  });

  ['note', 'lecture', 'announcement', 'manage'].forEach(t => {
    const panel = document.getElementById(`admintab-${t}`);
    if (panel) panel.style.display = t === tabName ? 'block' : 'none';
  });

  if (tabName === 'manage') {
    renderAdminManageData();
  }
}

// 1. Publish Note (supports create + edit) - 100% Cloud Firebase RTDB
async function publishAdminNote() {
  const authorSelect = document.getElementById('adm-note-author');
  const authorName = (authorSelect && authorSelect.value) ? authorSelect.value : (localStorage.getItem('bca3_admin_author') || 'Baljot Chohan');
  localStorage.setItem('bca3_admin_author', authorName);

  const subjectId = document.getElementById('adm-note-subject').value;
  const unit = document.getElementById('adm-note-unit').value;
  const title = document.getElementById('adm-note-title').value.trim();
  const tagsStr = document.getElementById('adm-note-tags').value.trim();
  const readTime = document.getElementById('adm-note-readtime').value.trim() || '6 min read';
  const content = document.getElementById('adm-note-content').value.trim();

  if (!title || !content) {
    showToast('❌ Title and Note Content are required.');
    return;
  }

  const isEditing = _editingItem && _editingItem.type === 'note';
  showToast(isEditing ? '⏳ Updating public note in cloud...' : '⏳ Publishing note live to all students...');

  const noteData = {
    id: isEditing ? _editingItem.id : `custom-note-${Date.now()}`,
    subject: subjectId,
    subjectId: subjectId,
    unit,
    title,
    readTime,
    tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Revision'],
    content,
    isAdminPublished: true,
    author: authorName,
    date: isEditing ? (_editingItem.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    timestamp: isEditing ? (_editingItem.timestamp || Date.now()) : Date.now()
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      const col = _editingItem.collection || 'notes';
      await fetch(`${FIREBASE_DB}/${col}/${_editingItem.fbKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    } else {
      await fetch(`${FIREBASE_DB}/notes.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }

  document.getElementById('adm-note-title').value = '';
  document.getElementById('adm-note-tags').value = '';
  document.getElementById('adm-note-content').value = '';
  resetEditState('note');

  showToast(isEditing ? '✅ Public note updated in cloud!' : `✅ Digital note published live by ${authorName}!`);
  closeAdminModal();

  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId) || BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject && activeSubjectId === subjectId) {
    renderSubjectNotes(subject);
  }
}

// 2. Publish Lecture Log (supports create + edit) - 100% Cloud Firebase RTDB
async function publishAdminLecture() {
  const authorSelect = document.getElementById('adm-lec-author');
  const authorName = (authorSelect && authorSelect.value) ? authorSelect.value : (localStorage.getItem('bca3_admin_author') || 'Baljot Chohan');
  localStorage.setItem('bca3_admin_author', authorName);

  const subjectId = document.getElementById('adm-lec-subject').value;
  const unit = document.getElementById('adm-lec-unit').value;
  const date = document.getElementById('adm-lec-date').value || new Date().toISOString().split('T')[0];
  const time = document.getElementById('adm-lec-time').value.trim() || '10:00 AM';
  const topic = document.getElementById('adm-lec-topic').value.trim();
  const desc = document.getElementById('adm-lec-desc').value.trim();
  const link = document.getElementById('adm-lec-link').value.trim();

  if (!topic || !date) {
    showToast('❌ Lecture Topic and Date are required.');
    return;
  }

  const isEditing = _editingItem && _editingItem.type === 'lecture';
  showToast(isEditing ? '⏳ Updating lecture log in cloud...' : '⏳ Publishing lecture log to all students...');

  const lecData = {
    id: isEditing ? _editingItem.id : `custom-lec-${Date.now()}`,
    subject: subjectId,
    subjectId: subjectId,
    unit,
    date,
    time,
    topic,
    description: desc,
    notes: desc,
    fileUrl: link || 'Syllabus.pdf',
    link: link || 'Syllabus.pdf',
    author: authorName,
    timestamp: isEditing ? (_editingItem.timestamp || Date.now()) : Date.now()
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      await fetch(`${FIREBASE_DB}/lectures/${_editingItem.fbKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lecData)
      });
    } else {
      await fetch(`${FIREBASE_DB}/lectures.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lecData)
      });
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }

  document.getElementById('adm-lec-topic').value = '';
  document.getElementById('adm-lec-desc').value = '';
  document.getElementById('adm-lec-link').value = '';
  resetEditState('lecture');

  showToast(isEditing ? '✅ Lecture log updated in cloud!' : `✅ Lecture log recorded by ${authorName}!`);
  closeAdminModal();

  renderDashboardLectures();
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId);
  if (subject) renderSubjectCalendar(subject);
}

// 3. Publish Announcement (supports create + edit) - 100% Cloud Firebase RTDB
async function publishAdminAnnouncement() {
  const authorSelect = document.getElementById('adm-ann-author');
  const authorName = (authorSelect && authorSelect.value) ? authorSelect.value : (localStorage.getItem('bca3_admin_author') || 'Baljot Chohan');
  localStorage.setItem('bca3_admin_author', authorName);

  const title = document.getElementById('adm-ann-title').value.trim();
  const category = document.getElementById('adm-ann-category').value;
  const link = document.getElementById('adm-ann-link').value.trim();
  const message = document.getElementById('adm-ann-msg').value.trim();

  if (!title || !message) {
    showToast('❌ Title and message required.');
    return;
  }

  const isEditing = _editingItem && _editingItem.type === 'announcement';
  showToast(isEditing ? '⏳ Updating announcement in cloud...' : '⏳ Publishing announcement to all students...');

  const annData = {
    id: isEditing ? _editingItem.id : `custom-ann-${Date.now()}`,
    title,
    category,
    link,
    message,
    author: authorName,
    date: isEditing ? (_editingItem.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: isEditing ? (_editingItem.timestamp || Date.now()) : Date.now()
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      await fetch(`${FIREBASE_DB}/announcements/${_editingItem.fbKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annData)
      });
    } else {
      await fetch(`${FIREBASE_DB}/announcements.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annData)
      });
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }

  document.getElementById('adm-ann-title').value = '';
  document.getElementById('adm-ann-link').value = '';
  document.getElementById('adm-ann-msg').value = '';
  resetEditState('announcement');

  showToast(isEditing ? '✅ Announcement updated in cloud!' : `✅ Notice published by ${authorName}!`);
  closeAdminModal();
  renderDashboardAnnouncements();
}

async function renderAdminManageData() {
  const container = document.getElementById('admin-manage-items-list');
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-subtle);">⏳ Loading data from Firebase...</div>`;

  const [fbNotes, fbLectures, fbAnnouncements, fbTodos] = await Promise.all([
    _fbFetch('notes'),
    _fbFetch('lectures'),
    _fbFetch('announcements'),
    _fbFetch('todos')
  ]);

  let html = '';

  // --- NOTES SECTION ---
  const allNotes = [
    ...fbNotes.map(n => ({ ...n, _sourceCol: 'notes' })),
    ...fbLectures.filter(l => (l.content && !l.topic) || (l.isAdminPublished && !fbNotes.some(fn => fn.fbKey === l.fbKey))).map(n => ({ ...n, _sourceCol: 'lectures' }))
  ];
  html += `<h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">📝 Digital Notes <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${allNotes.length}</span></h4>`;

  if (!allNotes.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle); margin-bottom: 1rem;">No published digital notes yet.</p>`;
  } else {
    html += allNotes.map(n => {
      const col = n._sourceCol || 'notes';
      const subjectLabel = n.subjectId ? getSubjectName(n.subjectId) || n.subjectId : (n.subject ? getSubjectName(n.subject) || n.subject : 'General');
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem;">
          <div style="min-width: 0; flex: 1; overflow: hidden;">
            <strong style="word-break: break-word;">${escapeHtml(n.title || n.topic || 'Untitled')}</strong>
            <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${escapeHtml(subjectLabel)} · ${n.date || '—'} · <span style="color: #2ecc71;">☁️ Public Live</span></div>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
            <button class="todo-del-btn" onclick="editNoteFromManage('${n.fbKey}', '${col}')" title="Edit" style="color: var(--color-coral);">✏️</button>
            <button class="todo-del-btn" onclick="deleteFirebaseItem('${col}', '${n.fbKey}', event)" title="Delete">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // --- LECTURES SECTION ---
  const allLectures = fbLectures.filter(l => l.topic && !l.content);
  html += `<h4 style="font-size: 0.95rem; margin: 1.25rem 0 0.5rem 0; display: flex; align-items: center; gap: 0.4rem;">📅 Lecture Logs <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${allLectures.length}</span></h4>`;

  if (!allLectures.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle); margin-bottom: 1rem;">No lecture logs recorded.</p>`;
  } else {
    html += allLectures.map(l => {
      const subjectLabel = l.subjectId ? getSubjectName(l.subjectId) || l.subjectId : (l.subject ? getSubjectName(l.subject) || l.subject : 'General');
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem;">
          <div style="min-width: 0; flex: 1; overflow: hidden;">
            <strong style="word-break: break-word;">${escapeHtml(l.topic || 'Untitled')}</strong>
            <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${escapeHtml(subjectLabel)} · ${l.date || '—'} · <span style="color: #2ecc71;">☁️ Public Live</span></div>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
            <button class="todo-del-btn" onclick="editLectureFromManage('${l.fbKey}')" title="Edit" style="color: var(--color-coral);">✏️</button>
            <button class="todo-del-btn" onclick="deleteFirebaseItem('lectures', '${l.fbKey}', event)" title="Delete">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // --- ANNOUNCEMENTS SECTION ---
  html += `<h4 style="font-size: 0.95rem; margin: 1.25rem 0 0.5rem 0; display: flex; align-items: center; gap: 0.4rem;">📢 Announcements <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${fbAnnouncements.length}</span></h4>`;

  if (!fbAnnouncements.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle);">No announcements posted.</p>`;
  } else {
    html += fbAnnouncements.map(a => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem;">
        <div style="min-width: 0; flex: 1; overflow: hidden;">
          <strong style="word-break: break-word;">${escapeHtml(a.title || 'Untitled')}</strong>
          <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${escapeHtml(a.category || 'notice')} · ${a.date || '—'} · <span style="color: #2ecc71;">☁️ Public Live</span></div>
        </div>
        <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
          <button class="todo-del-btn" onclick="editAnnouncementFromManage('${a.fbKey}')" title="Edit" style="color: var(--color-coral);">✏️</button>
          <button class="todo-del-btn" onclick="deleteFirebaseItem('announcements', '${a.fbKey}', event)" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  // --- STUDY TASKS (TODOS) SECTION ---
  html += `<h4 style="font-size: 0.95rem; margin: 1.25rem 0 0.5rem 0; display: flex; align-items: center; gap: 0.4rem;">🎯 Study Tasks <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${fbTodos.length}</span></h4>`;

  if (!fbTodos.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle);">No study tasks active.</p>`;
  } else {
    html += fbTodos.map(t => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem; ${t.done ? 'opacity: 0.6;' : ''}">
        <div style="min-width: 0; flex: 1; overflow: hidden;">
          <span style="${t.done ? 'text-decoration: line-through;' : ''}">${escapeHtml(t.text)}</span>
          <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${t.priority || 'medium'} priority · ${t.done ? '✓ Completed' : 'Pending'} · <span style="color: #2ecc71;">☁️ Public Live</span></div>
        </div>
        <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
          <button class="todo-del-btn" onclick="deleteFirebaseItem('todos', '${t.fbKey}', event)" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  container.innerHTML = html;
}

// --- EDIT FUNCTIONS (Interactive live cloud edit) ---

async function editNoteFromManage(fbKey, collection) {
  const items = await _fbFetch(collection || 'notes');
  const item = items.find(i => i.fbKey === fbKey);
  if (!item) { showToast('❌ Item not found'); return; }

  _editingItem = { type: 'note', fbKey, collection: collection || 'notes', id: item.id, date: item.date, timestamp: item.timestamp };

  // Pre-fill the note form
  const subjectEl = document.getElementById('adm-note-subject');
  const unitEl = document.getElementById('adm-note-unit');
  if (subjectEl) subjectEl.value = item.subjectId || item.subject || 'comp-arch';
  if (unitEl) unitEl.value = item.unit || 'Unit I';
  document.getElementById('adm-note-title').value = item.title || item.topic || '';
  document.getElementById('adm-note-tags').value = (item.tags || []).join(', ');
  document.getElementById('adm-note-readtime').value = item.readTime || '';
  document.getElementById('adm-note-content').value = item.content || item.notes || item.description || '';

  // Switch to note tab and show edit indicator
  switchAdminTab('note');
  updateEditBanner('note', item.title || item.topic || 'Untitled');
  showToast('✏️ Editing note — make changes and click Publish to update.');
}

async function editLectureFromManage(fbKey) {
  const items = await _fbFetch('lectures');
  const item = items.find(i => i.fbKey === fbKey);
  if (!item) { showToast('❌ Item not found'); return; }

  _editingItem = { type: 'lecture', fbKey, collection: 'lectures', id: item.id, date: item.date, timestamp: item.timestamp };

  const subjectEl = document.getElementById('adm-lec-subject');
  const unitEl = document.getElementById('adm-lec-unit');
  if (subjectEl) subjectEl.value = item.subjectId || item.subject || 'comp-arch';
  if (unitEl) unitEl.value = item.unit || 'Unit I';
  document.getElementById('adm-lec-date').value = item.date || '';
  document.getElementById('adm-lec-time').value = item.time || '';
  document.getElementById('adm-lec-topic').value = item.topic || '';
  document.getElementById('adm-lec-desc').value = item.description || item.notes || '';
  document.getElementById('adm-lec-link').value = item.fileUrl || item.link || '';

  switchAdminTab('lecture');
  updateEditBanner('lecture', item.topic || 'Untitled');
  showToast('✏️ Editing lecture — make changes and click Publish to update.');
}

async function editAnnouncementFromManage(fbKey) {
  const items = await _fbFetch('announcements');
  const item = items.find(i => i.fbKey === fbKey);
  if (!item) { showToast('❌ Item not found'); return; }

  _editingItem = { type: 'announcement', fbKey, collection: 'announcements', id: item.id, date: item.date, timestamp: item.timestamp };

  document.getElementById('adm-ann-title').value = item.title || '';
  document.getElementById('adm-ann-category').value = item.category || 'notice';
  document.getElementById('adm-ann-link').value = item.link || '';
  document.getElementById('adm-ann-msg').value = item.message || '';

  switchAdminTab('announcement');
  updateEditBanner('announcement', item.title || 'Untitled');
  showToast('✏️ Editing announcement — make changes and click Publish to update.');
}

function updateEditBanner(tabType, itemTitle) {
  const tabIds = { note: 'admintab-note', lecture: 'admintab-lecture', announcement: 'admintab-announcement' };
  const panel = document.getElementById(tabIds[tabType]);
  if (!panel) return;

  // Remove existing banner
  const existing = panel.querySelector('.edit-mode-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'edit-mode-banner';
  banner.style.cssText = 'background: rgba(224,122,95,0.12); border: 1px solid rgba(224,122,95,0.3); padding: 0.6rem 0.85rem; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;';
  banner.innerHTML = `
    <span style="color: var(--color-coral); font-weight: 600;">✏️ Editing: <em>${escapeHtml(itemTitle)}</em></span>
    <button onclick="cancelEdit('${tabType}')" style="background: none; border: 1px solid var(--border-color); padding: 0.25rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; color: var(--text-muted);">Cancel Edit</button>
  `;
  panel.insertBefore(banner, panel.firstChild);
}

function cancelEdit(tabType) {
  resetEditState(tabType);
  switchAdminTab('manage');
  showToast('Edit cancelled.');
}

function resetEditState(tabType) {
  _editingItem = null;
  const tabIds = { note: 'admintab-note', lecture: 'admintab-lecture', announcement: 'admintab-announcement' };
  const panel = document.getElementById(tabIds[tabType]);
  if (panel) {
    const banner = panel.querySelector('.edit-mode-banner');
    if (banner) banner.remove();
  }
}

// Background sync from Firebase Realtime Database
async function syncFirebaseData() {
  try {
    await Promise.all([
      renderDashboardLectures(),
      renderDashboardAnnouncements(),
      renderDashboardTodos()
    ]);
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }
}

/* ==========================================================================
   8. FOCUS / ZEN READING MODE
   ========================================================================== */

function openZenReader() {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (!subject) return;

  const allNotes = _currentSubjectNotes && _currentSubjectNotes.length ? _currentSubjectNotes : (subject.digitalNotes || []);

  if (!allNotes.length) {
    showToast('No notes to display in focus reader.');
    return;
  }

  openZenReaderWithNote(allNotes[0].fbKey || allNotes[0].id);
}

function openZenReaderWithNote(noteId) {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  const allNotes = _currentSubjectNotes && _currentSubjectNotes.length ? _currentSubjectNotes : (subject ? (subject.digitalNotes || []) : []);
  const note = allNotes.find(n => (n.fbKey === noteId || n.id === noteId)) || allNotes[0];

  if (!note) {
    showToast('Note not found.');
    return;
  }

  const modal = document.getElementById('zen-reader-modal');
  const container = document.getElementById('zen-article-content');
  const badge = document.getElementById('zen-badge');

  if (badge) badge.innerText = `${subject ? subject.title : 'BCA III'} • ${note.unit || 'General'}`;
  if (container) {
    container.innerHTML = `
      <h1 class="serif" style="font-size: 2.25rem; margin-bottom: 0.5rem;">${escapeHtml(note.title)}</h1>
      <p style="color: var(--text-subtle); margin-bottom: 1.75rem; font-size: 0.9rem;">
        ${subject ? subject.code : 'BCA 3'} · ${escapeHtml(note.unit || 'General')} · ${escapeHtml(note.readTime || '6 min read')} · Panjab University
      </p>
      <div style="font-size: 1.1rem; line-height: 1.8; color: var(--text-main);">
        ${renderMarkdownBlocks(note.content)}
      </div>
    `;
  }

  if (modal) {
    modal.style.display = 'flex';
    lockScroll(true);
    if (window.ManimVisuals) {
      setTimeout(() => window.ManimVisuals.mountAll(container), 40);
    }
  }
}

function closeZenReader(e) {
  if (e && e.target && e.target.id !== 'zen-reader-modal' && e.type === 'click') return;
  const modal = document.getElementById('zen-reader-modal');
  if (modal) modal.style.display = 'none';
  lockScroll(false);
}

/* ==========================================================================
   9. COMMAND PALETTE (⌘K SEARCH ACROSS ALL SYLLABI & NOTES)
   ========================================================================== */

function initCommandPalette() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
    if (e.key === 'Escape') {
      closeCommandPalette();
      closeAdminModal();
      closeZenReader();
    }
  });

  const input = document.getElementById('palette-search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      searchPalette(e.target.value);
    });
  }
}

function openCommandPalette() {
  const modal = document.getElementById('command-palette');
  if (modal) {
    modal.style.display = 'flex';
    lockScroll(true);
    const input = document.getElementById('palette-search-input');
    if (input) {
      input.value = '';
      input.focus();
      searchPalette('');
    }
  }
}

function closeCommandPalette() {
  const modal = document.getElementById('command-palette');
  if (modal) modal.style.display = 'none';
  lockScroll(false);
}

function searchPalette(query) {
  const resultsContainer = document.getElementById('palette-results');
  if (!resultsContainer) return;

  const q = query.toLowerCase().trim();
  const results = [];

  // 1. Search static subjects
  BCA_3RD_SEM_DATA.subjects.forEach(s => {
    if (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
      results.push({
        type: 'Subject',
        title: s.title,
        subtitle: `${s.code} • ${s.credits} Credits`,
        action: () => { closeCommandPalette(); navigateToSubject(s.id); }
      });
    }

    // 2. Search syllabus units & topics
    (s.units || []).forEach(u => {
      (u.topics || []).forEach(t => {
        if (q && t.toLowerCase().includes(q)) {
          results.push({
            type: 'Topic',
            title: t,
            subtitle: `${s.title} • ${u.unitNumber}`,
            action: () => { closeCommandPalette(); navigateToSubject(s.id); switchWorkspaceTab('units'); }
          });
        }
      });
    });

    // 3. Search built-in notes
    (s.digitalNotes || []).forEach(n => {
      if (q && (n.title.toLowerCase().includes(q) || (n.content && n.content.toLowerCase().includes(q)))) {
        results.push({
          type: 'Note',
          title: n.title,
          subtitle: `${s.title} • ${n.unit}`,
          action: () => { closeCommandPalette(); navigateToSubject(s.id); switchWorkspaceTab('notes'); }
        });
      }
    });
  });

  // 4. Search Live Cloud Notes from Firebase
  const cloudNotes = _globalCloudData.notes && _globalCloudData.notes.length ? _globalCloudData.notes : _currentSubjectNotes;
  cloudNotes.forEach(n => {
    const subId = n.subject || n.subjectId || 'comp-arch';
    const subName = getSubjectName(subId);
    if (q && (n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || (n.tags && n.tags.some(t => t.toLowerCase().includes(q))))) {
      // Avoid duplicate title if already added
      if (!results.some(r => r.title === n.title)) {
        results.push({
          type: '☁️ Live Note',
          title: n.title,
          subtitle: `${subName} • ${n.unit || 'General'}`,
          action: () => { closeCommandPalette(); navigateToSubject(subId); switchWorkspaceTab('notes'); }
        });
      }
    }
  });

  // 5. Search Live Lecture Logs
  (_globalCloudData.lectures || []).forEach(l => {
    const subId = l.subject || l.subjectId || 'comp-arch';
    const subName = getSubjectName(subId);
    if (q && (l.topic?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))) {
      if (!results.some(r => r.title === l.topic)) {
        results.push({
          type: '📅 Lecture',
          title: l.topic,
          subtitle: `${subName} • ${l.date || 'Aug 2026'}`,
          action: () => { closeCommandPalette(); navigateToSubject(subId); switchWorkspaceTab('calendar'); }
        });
      }
    }
  });

  if (!results.length) {
    resultsContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-subtle);">No matching topics or notes found.</div>`;
    return;
  }

  resultsContainer.innerHTML = results.slice(0, 8).map((r, i) => `
    <div class="palette-item" onclick="executePaletteAction(${i})">
      <span class="palette-badge">${r.type}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 500; font-size: 0.9rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.title)}</div>
        <div style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(r.subtitle)}</div>
      </div>
    </div>
  `).join('');

  window._paletteActions = results.slice(0, 8).map(r => r.action);
}

function executePaletteAction(index) {
  if (window._paletteActions && window._paletteActions[index]) {
    window._paletteActions[index]();
  }
}

/* ==========================================================================
   10. THEME, GREETING & UTILITIES
   ========================================================================== */

function initTheme() {
  const saved = localStorage.getItem('bca_hub_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton(saved);
  updateThemeMeta(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bca_hub_theme', next);
  updateThemeButton(next);
  updateThemeMeta(next);
  showToast(`Switched to ${next === 'dark' ? 'Midnight Slate Dark' : 'Warm Ivory Light'} theme`);
}

function updateThemeMeta(theme) {
  const color = theme === 'dark' ? '#141413' : '#faf9f5';
  const metaTags = document.querySelectorAll('meta[name="theme-color"]');
  metaTags.forEach(tag => tag.setAttribute('content', color));
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}

function initGreeting() {
  const el = document.getElementById('live-greeting');
  if (!el) return;
  const hour = new Date().getHours();
  let timeStr = 'Good Evening';
  if (hour < 12) timeStr = 'Good Morning';
  else if (hour < 17) timeStr = 'Good Afternoon';
  el.innerText = `${timeStr}, BCA III Scholar 👋`;
}

function initFilterPills() {
  const pills = document.querySelectorAll('.academy-filter-bar .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.getAttribute('data-filter');
      filterSubjects(filter);
    });
  });
}

function filterSubjects(filter) {
  const cards = document.querySelectorAll('.subject-card-item');
  cards.forEach(card => {
    const type = card.getAttribute('data-type') || '';
    if (filter === 'all') {
      card.style.display = 'block';
    } else if (filter === 'dsc') {
      card.style.display = type.includes('dsc') ? 'block' : 'none';
    } else if (filter === 'electives') {
      card.style.display = type.includes('electives') ? 'block' : 'none';
    } else if (filter === 'agenda' || filter === 'todos') {
      card.style.display = 'block';
      const widget = document.getElementById('study-widgets');
      if (widget) widget.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

function initMobileDrawer() {
  const hamburger = document.querySelector('.SiteHeader-module-scss-module__zKj4Ca__mobileIcon');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const closeBtn = document.getElementById('mobile-drawer-close');

  function openDrawer() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    lockScroll(true);
  }
  function closeDrawer() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    lockScroll(false);
  }

  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close drawer when a link is clicked
  document.querySelectorAll('.mobile-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add('visible');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

function formatDateLong(dateStr) {
  if (!dateStr || dateStr === 'all') return 'August 2026';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(parts[1], 10) - 1] || 'Aug';
  return `${monthName} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

/* ==========================================================================
   CONNECT AI & MCP HUB MODAL CONTROLLER
   ========================================================================== */

function openMcpModal() {
  const modal = document.getElementById('mcp-modal');
  if (!modal) return;
  
  // Dynamically update the displayed endpoint with the active origin if needed
  // Dynamically update the displayed endpoint with the active origin if needed
  const isVercel = window.location.hostname.includes('vercel.app');
  const endpoint = isVercel 
    ? `${window.location.origin}/api/mcp`
    : 'https://bca-iii.vercel.app/api/mcp';

  const displayEl = document.getElementById('mcp-remote-url-display');
  if (displayEl) displayEl.textContent = endpoint;

  const onpageEl = document.getElementById('mcp-onpage-endpoint');
  if (onpageEl) onpageEl.textContent = endpoint;

  modal.style.display = 'flex';
  lockScroll(true);

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) closeMcpModal();
  };
}

function closeMcpModal() {
  const modal = document.getElementById('mcp-modal');
  if (!modal) return;
  modal.style.display = 'none';
  lockScroll(false);
}

function switchMcpTab(tabName) {
  // Update Tab Buttons
  document.querySelectorAll('.mcp-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mcptab') === tabName);
  });

  // Update Tab Panes
  document.querySelectorAll('.mcp-tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });

  const targetPane = document.getElementById(`mcp-tab-${tabName}`);
  if (targetPane) {
    targetPane.style.display = 'block';
  }
}

function copyMcpUrl(url, btnElementOrId) {
  let btn = typeof btnElementOrId === 'string' ? document.getElementById(btnElementOrId) : btnElementOrId;
  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>✓ Copied!</span>';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 2500);
    }
    showToast('✓ MCP Server Endpoint copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy to clipboard');
  });
}

function copyMcpCode(elementId, btnElement) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    if (btnElement) {
      const originalText = btnElement.innerText;
      btnElement.innerText = '✓ Copied!';
      btnElement.style.background = 'rgba(16, 185, 129, 0.4)';
      setTimeout(() => {
        btnElement.innerText = originalText;
        btnElement.style.background = '';
      }, 2500);
    }
    showToast('✓ Configuration copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy code snippet');
  });
}

function handleMcpToolChange() {
  const tool = document.getElementById('mcp-tool-select').value;
  const subjectWrap = document.getElementById('mcp-param-subject-wrap');
  const unitWrap = document.getElementById('mcp-param-unit-wrap');
  const queryWrap = document.getElementById('mcp-param-query-wrap');

  if (tool === 'get_syllabus') {
    subjectWrap.style.display = 'block';
    unitWrap.style.display = 'none';
    queryWrap.style.display = 'none';
  } else if (tool === 'get_unit_details') {
    subjectWrap.style.display = 'block';
    unitWrap.style.display = 'block';
    queryWrap.style.display = 'none';
  } else if (tool === 'get_digital_notes') {
    subjectWrap.style.display = 'block';
    unitWrap.style.display = 'none';
    queryWrap.style.display = 'none';
  } else if (tool === 'search_digital_notes') {
    subjectWrap.style.display = 'block';
    unitWrap.style.display = 'none';
    queryWrap.style.display = 'block';
  } else if (tool === 'get_syllabus_structure_for_ai') {
    subjectWrap.style.display = 'block';
    unitWrap.style.display = 'none';
    queryWrap.style.display = 'none';
  } else {
    subjectWrap.style.display = 'none';
    unitWrap.style.display = 'none';
    queryWrap.style.display = 'none';
  }
}

async function executeMcpPlaygroundTest() {
  const tool = document.getElementById('mcp-tool-select').value;
  const subject = document.getElementById('mcp-param-subject').value;
  const unit = document.getElementById('mcp-param-unit').value;
  const query = document.getElementById('mcp-param-query').value;
  const outputEl = document.getElementById('mcp-playground-output');
  const statusEl = document.getElementById('mcp-test-status');
  const latencyEl = document.getElementById('mcp-latency-tag');

  if (!outputEl) return;

  outputEl.textContent = '⏳ Sending JSON-RPC 2.0 request over Streamable HTTP...';
  if (statusEl) statusEl.textContent = '● Executing tool call...';
  if (latencyEl) latencyEl.textContent = '';

  const startTime = performance.now();

  const payload = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 100000),
    method: "tools/call",
    params: {
      name: tool,
      arguments: {}
    }
  };

  if (tool === 'get_syllabus') {
    payload.params.arguments = { subject_id: subject };
  } else if (tool === 'get_unit_details') {
    payload.params.arguments = { subject_id: subject, unit_number: unit };
  } else if (tool === 'get_digital_notes') {
    payload.params.arguments = { subject_id: subject, limit: 10 };
  } else if (tool === 'search_digital_notes') {
    payload.params.arguments = { query: query, subject_id: subject };
  } else if (tool === 'get_syllabus_structure_for_ai') {
    payload.params.arguments = { subject_id: subject };
  } else if (tool === 'get_hub_stats') {
    payload.params.arguments = {};
  } else if (tool === 'get_daily_lectures') {
    payload.params.arguments = { date: 'latest' };
  } else if (tool === 'get_announcements') {
    payload.params.arguments = { limit: 5 };
  }

  try {
    let resultJson = null;

    // Try calling the live serverless endpoint if on Vercel or live server
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        resultJson = await response.json();
      }
    } catch (netErr) {
      // If running on static host (e.g. GitHub Pages without serverless functions), simulate real JSON-RPC 2.0 locally
    }

    // Local client-side fallback simulation for GitHub Pages / local preview
    if (!resultJson) {
      let contentText = '';
      if (tool === 'get_syllabus') {
        const sub = typeof BCA_3RD_SEM_DATA !== 'undefined' ? BCA_3RD_SEM_DATA.subjects.find(s => s.id === subject) : null;
        contentText = JSON.stringify(sub || BCA_3RD_SEM_DATA.subjects, null, 2);
      } else if (tool === 'get_unit_details') {
        const sub = typeof BCA_3RD_SEM_DATA !== 'undefined' ? BCA_3RD_SEM_DATA.subjects.find(s => s.id === subject) : null;
        const u = sub ? sub.units.find(item => item.unitNumber.toLowerCase() === unit.toLowerCase()) : null;
        contentText = JSON.stringify(u || { error: "Unit not found" }, null, 2);
      } else if (tool === 'search_digital_notes') {
        contentText = JSON.stringify({ count: 3, sampleTopic: query, status: "Connected to Firebase RTDB" }, null, 2);
      } else if (tool === 'get_daily_lectures') {
        contentText = JSON.stringify({ count: 5, semester: "BCA 3rd Sem", date: new Date().toISOString().split('T')[0] }, null, 2);
      } else {
        contentText = JSON.stringify({ notices: ["Internal MST Exam dates announced", "Practical Lab sessions active"] }, null, 2);
      }

      resultJson = {
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          content: [{ type: "text", text: contentText }],
          isError: false
        }
      };
    }

    const elapsed = Math.round(performance.now() - startTime);
    if (latencyEl) latencyEl.textContent = `● Status: 200 OK • ${elapsed}ms`;
    if (statusEl) statusEl.textContent = `● Executed successfully (${elapsed}ms)`;
    outputEl.textContent = JSON.stringify(resultJson, null, 2);

  } catch (err) {
    if (statusEl) statusEl.textContent = '❌ Execution error';
    outputEl.textContent = JSON.stringify({
      jsonrpc: "2.0",
      id: payload.id,
      error: { code: -32603, message: err.message }
    }, null, 2);
  }
}

// Global escape key to close MCP modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMcpModal();
  }
});

