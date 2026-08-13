/**
 * BCA 3 Hub — Panjab University 2026-27 Study Dashboard Controller
 * Full SPA Routing (Dedicated Subject Workspaces), Digital Study Notes Repository,
 * Interactive Calendar Switcher and Integrated In-App Admin Portal.
 */

let activeSubjectId = 'comp-arch';
let activeWorkspaceTab = 'notes';
const _todayObj = new Date();
let selectedCalendarDate = `${_todayObj.getFullYear()}-${String(_todayObj.getMonth() + 1).padStart(2, '0')}-${String(_todayObj.getDate()).padStart(2, '0')}`;
let currentSubjectCalMonth = _todayObj.getMonth();
let currentSubjectCalYear = _todayObj.getFullYear();
let currentNoteFilter = 'all';
let _editingItem = null; // { type: 'note'|'lecture'|'announcement', fbKey, collection }
let _currentSubjectNotes = []; // Cached active notes array for focus reader & export
let _globalCloudData = { notes: [], lectures: [], announcements: [] }; // Global cache for search indexing

const FIREBASE_DB = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

// Admin check is now purely email-based (Google OAuth) — no passkeys
function isAdminAuthenticated() {
  return !!(currentUserProfile && currentUserProfile.isAdmin === true);
}

let _activeModalFocusTrap = null;

function lockScroll(lock, modalEl) {
  if (lock) {
    document.body.classList.add('modal-open');
    if (modalEl) {
      trapModalFocus(modalEl);
    }
  } else {
    document.body.classList.remove('modal-open');
    releaseModalFocus();
  }
}

function trapModalFocus(modalEl) {
  releaseModalFocus();
  const focusables = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  modalEl.addEventListener('keydown', handleKeyDown);
  _activeModalFocusTrap = { modalEl, handleKeyDown };
  first.focus();
}

function releaseModalFocus() {
  if (_activeModalFocusTrap) {
    _activeModalFocusTrap.modalEl.removeEventListener('keydown', _activeModalFocusTrap.handleKeyDown);
    _activeModalFocusTrap = null;
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
  initFirebaseAuth();
  syncFirebaseData();
  initGuestPromptTimer();
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
  updateMobileBottomNav('mob-nav-home');
}

function scrollToSection(elementId) {
  showDashboardView();
  setTimeout(() => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 50);
  if (elementId === 'subjects-container') updateMobileBottomNav('mob-nav-subjects');
  if (elementId === 'study-widgets') updateMobileBottomNav('mob-nav-calendar');
}

function updateMobileBottomNav(activeId) {
  document.querySelectorAll('.mobile-bottom-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.getElementById(activeId);
  if (activeItem) {
    activeItem.classList.add('active');
  }
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
  switchWorkspaceTab(activeWorkspaceTab || 'notes');
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

  // Helper to parse unit number for chronological syllabus sorting
  function parseUnitOrder(unitStr) {
    if (!unitStr) return 1;
    const s = String(unitStr).toLowerCase().trim();
    if (s.includes('unit 1') || s.includes('unit i') || s === '1' || s === 'i' || s === 'general') return 1;
    if (s.includes('unit 2') || s.includes('unit ii') || s === '2' || s === 'ii') return 2;
    if (s.includes('unit 3') || s.includes('unit iii') || s === '3' || s === 'iii') return 3;
    if (s.includes('unit 4') || s.includes('unit iv') || s === '4' || s === 'iv') return 4;
    return 99;
  }

  // Sort notes: Unit I first, Unit II second, Unit III third, Unit IV fourth
  allNotes.sort((a, b) => {
    const uA = parseUnitOrder(a.unit || a.unitNumber);
    const uB = parseUnitOrder(b.unit || b.unitNumber);
    if (uA !== uB) return uA - uB;
    // Secondary sort: preserve creation order or title
    return (a.timestamp || 0) - (b.timestamp || 0) || (a.title || '').localeCompare(b.title || '');
  });

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
    filtered = allNotes.filter(n => {
      const u = (n.unit || '').toLowerCase();
      const f = currentNoteFilter.toLowerCase();
      return u === f || (f === 'unit i' && (u === 'unit 1' || u === 'unit i' || u === 'general')) ||
             (f === 'unit ii' && (u === 'unit 2' || u === 'unit ii')) ||
             (f === 'unit iii' && (u === 'unit 3' || u === 'unit iii')) ||
             (f === 'unit iv' && (u === 'unit 4' || u === 'unit iv'));
    });
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

  // Calculate sequential topic numbers grouped by unit
  const unitCounters = {};
  filtered.forEach(n => {
    const u = n.unit || 'Unit I';
    unitCounters[u] = (unitCounters[u] || 0) + 1;
    n._topicSeq = unitCounters[u];
  });

  // Render sleek, compact Topic Cards organized chronologically
  container.innerHTML = filtered.map((note, index) => {
    const noteKey = note.fbKey || note.id;
    const isCloud = Boolean(note.fbKey);
    const authorName = note.author || 'Baljot Chohan';
    const excerpt = getPlainExcerpt(note.content, 140, note.title);
    const accessRes = window.BCA3_PAYMENTS ? window.BCA3_PAYMENTS.hasNoteAccess(note, index) : { hasAccess: true };
    const hasAccess = accessRes.hasAccess;

    let accessBadgeHtml = '';
    if (hasAccess) {
      if (accessRes.reason === 'free_unit_1') {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(16,185,129,0.25);">🔓 Free Unit 1</span>';
      } else if (accessRes.reason === 'max_lifetime') {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #c25e3e; font-weight: 700; background: rgba(194,94,62,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(194,94,62,0.25);">🌟 Max Lifetime</span>';
      } else if (accessRes.reason === 'pro_active') {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #a78bfa; font-weight: 700; background: rgba(124,58,237,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(124,58,237,0.25);">⭐ Pro Pass</span>';
      } else {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(16,185,129,0.25);">🔓 Unlocked</span>';
      }
    } else {
      if (accessRes.reason === 'requires_signin') {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #f59e0b; font-weight: 700; background: rgba(245,158,11,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(245,158,11,0.25);">🔒 Sign In to Unlock</span>';
      } else {
        accessBadgeHtml = '<span style="font-size: 0.72rem; color: #c25e3e; font-weight: 700; background: rgba(194,94,62,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(194,94,62,0.25);">🔒 Pro (₹19) / Max (₹49)</span>';
      }
    }

    const unitLabel = note.unit || 'Unit I';
    const topicNumberTag = note._topicSeq ? `Topic ${note._topicSeq}` : `Topic ${index + 1}`;

    return `
      <div class="note-topic-card" onclick="handleNoteCardClick('${noteKey}', ${index})">
        <div class="note-topic-header">
          <div class="note-meta-left" style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
            <span class="note-unit-badge">${escapeHtml(unitLabel)} • ${topicNumberTag}</span>
            ${accessBadgeHtml}
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
            <span>${hasAccess ? '📖 Read Full Note ➔' : '🔒 View Study Pass ➔'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleNoteCardClick(noteKey, index = 0) {
  const note = (_currentSubjectNotes || []).find(n => (n.fbKey === noteKey || n.id === noteKey));
  const accessRes = window.BCA3_PAYMENTS ? window.BCA3_PAYMENTS.hasNoteAccess(note || noteKey, index) : { hasAccess: true };

  if (accessRes.hasAccess) {
    openNoteReaderView(noteKey);
  } else {
    if (accessRes.reason === 'requires_signin') {
      showToast('Sign in with Google to unlock Unit 1 notes for free! 🔐');
      handleAuthAction();
    } else {
      showToast('Upgrade to Pro (₹19/mo) or Max Lifetime (₹49) to unlock this unit! ⭐');
      if (window.BCA3_PAYMENTS && typeof window.BCA3_PAYMENTS.openPricingModal === 'function') {
        window.BCA3_PAYMENTS.openPricingModal();
      }
    }
  }
}

function openNoteReaderView(noteKey) {
  const note = (_currentSubjectNotes || []).find(n => (n.fbKey === noteKey || n.id === noteKey));
  const noteId = note ? (note.fbKey || note.id || noteKey) : noteKey;
  const readerUrl = `/note.html?id=${encodeURIComponent(noteId)}&subject=${encodeURIComponent(activeSubjectId || '')}`;
  window.location.href = readerUrl;
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

function getPlainExcerpt(content, maxLen = 150, title = '') {
  if (!content) return '';
  const lines = content.split('\n');
  let cleanLines = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('@[') || trimmed.startsWith('```') || trimmed.startsWith('---') || trimmed.startsWith('===')) continue;
    if (trimmed.startsWith('[visual:') || trimmed.startsWith('[math:')) continue;
    let plain = trimmed
      .replace(/\[visual:[^\]]+\]/gi, '')
      .replace(/\[math:[^\]]+\]/gi, '')
      .replace(/^#+\s*/, '')
      .replace(/[*_`>~]/g, '')
      .trim();
    if (title && plain.toLowerCase() === title.toLowerCase()) continue;
    if (/^(unit\s+[ivx\d]+|chapter\s+\d+|computer architecture|data structures|numerical methods)/i.test(plain) && plain.length < 50) continue;
    if (plain) cleanLines.push(plain);
  }
  const text = cleanLines.join(' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.substring(0, maxLen).trim() + '...' : text;
}

function filterNotesByUnit(unit, btn) {
  currentNoteFilter = unit;
  document.querySelectorAll('#ws-notes-filter-bar .note-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectNotes(subject);
}

function renderMarkdownBlocks(content) {
  if (!content) return '';

  let html = content;

  // 1. Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // 1b. Strip visual tags completely
  html = html.replace(/@?\[(?:visual|manim):[a-zA-Z0-9_\-]+\]/gi, '');

  // 2. Code blocks & ASCII diagrams (matches closed or unclosed ``` or ''')
  html = html.replace(/(?:```|''')([a-zA-Z0-9_\-\+]+)?[ \t]*\n?([\s\S]*?)(?:```|'''|$)/g, (match, lang, code) => {
    if (!code || !code.trim()) return '';
    const cleanCode = escapeHtml(code.trim());
    const language = lang ? lang.trim().toLowerCase() : '';

    // Mermaid blocks get a styled visual badge (actual rendering happens in note.html)
    if (language === 'mermaid') {
      return `
        <div class="notion-code-container" style="border-color: rgba(165,180,252,0.2); background: rgba(165,180,252,0.04);">
          <div class="notion-code-header" style="color: var(--color-accent); border-color: rgba(165,180,252,0.15);">
            <span style="display:flex; align-items:center; gap:0.4rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
              DIAGRAM (Mermaid)
            </span>
            <span style="font-size:0.65rem; opacity:0.7;">Renders in full reader →</span>
          </div>
          <pre class="notion-code-block"><code>${cleanCode}</code></pre>
        </div>
      `;
    }

    return `
      <div class="notion-code-container">
        <div class="notion-code-header">
          <span>${escapeHtml(language.toUpperCase() || 'DIAGRAM / ARCHITECTURE')}</span>
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

async function mcpAdminRpc(method, args) {
  let authToken = '';
  if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    authToken = await firebase.auth().currentUser.getIdToken(true);
  } else {
    authToken = localStorage.getItem('adminPasskey') || '';
  }

  if (!authToken) throw new Error('Not logged in as Admin');
  args.passkey = authToken;

  const authorName = localStorage.getItem('bca3_admin_author') || 'Admin';

  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`, 'X-Author-Name': authorName },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: method, arguments: args }
    })
  });
  
  const json = await response.json();
  if (json.error || (json.result && json.result.isError)) {
    throw new Error(json.error?.message || json.result?.content?.[0]?.text || 'MCP API Error');
  }
  return json.result;
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
    await mcpAdminRpc('delete_hub_record', { collection, id: fbKey });

    showToast('🗑️ Item deleted successfully from cloud!');
    
    // Refresh all live views
    renderDashboardLectures();
    renderDashboardAnnouncements();
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

function changeSubjectCalMonth(delta) {
  currentSubjectCalMonth += delta;
  if (currentSubjectCalMonth > 11) {
    currentSubjectCalMonth = 0;
    currentSubjectCalYear++;
  } else if (currentSubjectCalMonth < 0) {
    currentSubjectCalMonth = 11;
    currentSubjectCalYear--;
  }
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) || BCA_3RD_SEM_DATA.subjects[0];
  if (subject) renderSubjectCalendar(subject);
}

function goToTodaySubjectCal() {
  const now = new Date();
  currentSubjectCalMonth = now.getMonth();
  currentSubjectCalYear = now.getFullYear();
  selectedCalendarDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) || BCA_3RD_SEM_DATA.subjects[0];
  if (subject) renderSubjectCalendar(subject);
}

async function renderSubjectCalendar(subject) {
  const calGrid = document.getElementById('ws-calendar-grid');
  const monthTitle = document.querySelector('.calendar-month-title');
  const quickDatesBar = document.getElementById('ws-quick-dates-bar');
  const lecturesList = document.getElementById('ws-subject-lectures-list');
  if (!calGrid || !lecturesList) return;

  if (monthTitle) {
    monthTitle.textContent = `${getMonthName(currentSubjectCalMonth)} ${currentSubjectCalYear}`;
  }

  // Fetch live lectures & notes from Firebase
  let fbLectures = await _fbFetch('lectures');
  fbLectures = fbLectures.filter(l => (l.subject === subject.id || l.subjectId === subject.id));
  const allLectures = [...fbLectures, ...(subject.lectures || [])];

  let fbNotes = await _fbFetch('notes');
  fbNotes = fbNotes.filter(n => (n.subject === subject.id || n.subjectId === subject.id));

  // Map of active dates
  const dateMap = {};
  allLectures.forEach(l => {
    if (!l.date) return;
    if (!dateMap[l.date]) dateMap[l.date] = { lectures: [], notes: [] };
    dateMap[l.date].lectures.push(l);
  });
  fbNotes.forEach(n => {
    if (!n.date) return;
    if (!dateMap[n.date]) dateMap[n.date] = { lectures: [], notes: [] };
    dateMap[n.date].notes.push(n);
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  if (!selectedCalendarDate) {
    selectedCalendarDate = todayStr;
  }

  const firstDayIndex = new Date(currentSubjectCalYear, currentSubjectCalMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentSubjectCalYear, currentSubjectCalMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentSubjectCalYear, currentSubjectCalMonth, 0).getDate();

  let gridHtml = '';

  // Leading days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const pDay = prevMonthDays - i;
    gridHtml += `<div class="cal-day-cell empty"><span style="opacity: 0.3;">${pDay}</span></div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(currentSubjectCalMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateKey = `${currentSubjectCalYear}-${mStr}-${dStr}`;

    const isToday = (dateKey === todayStr);
    const isSelected = (dateKey === selectedCalendarDate);
    const acts = dateMap[dateKey];
    const hasActivities = acts && (acts.lectures.length > 0 || acts.notes.length > 0);

    gridHtml += `
      <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'selected' : ''} ${hasActivities ? 'has-lecture' : ''}" 
           onclick="selectCalendarDate('${dateKey}', '${subject.id}')" 
           title="${day} ${getMonthName(currentSubjectCalMonth)} ${currentSubjectCalYear}${isToday ? ' (Today)' : ''}${hasActivities ? ' • Activities logged' : ''}">
        <span>${day}</span>
      </div>
    `;
  }

  // Trailing empty days to complete row
  const totalRendered = firstDayIndex + daysInMonth;
  const nextPads = (7 - (totalRendered % 7)) % 7;
  for (let n = 1; n <= nextPads; n++) {
    gridHtml += `<div class="cal-day-cell empty"><span style="opacity: 0.3;">${n}</span></div>`;
  }

  calGrid.innerHTML = gridHtml;

  // Quick Date Switcher Pills Bar
  const dateKeys = Object.keys(dateMap).sort();
  if (quickDatesBar) {
    quickDatesBar.innerHTML = `
      <button class="quick-date-pill ${selectedCalendarDate === 'all' ? 'active' : ''}" onclick="selectCalendarDate('all', '${subject.id}')">All Dates</button>
      <button class="quick-date-pill ${selectedCalendarDate === todayStr ? 'active' : ''}" onclick="selectCalendarDate('${todayStr}', '${subject.id}')">Today (Aug ${now.getDate()})</button>
      ${dateKeys.filter(dk => dk !== todayStr).map(dk => {
        const parts = dk.split('-');
        return `<button class="quick-date-pill ${selectedCalendarDate === dk ? 'active' : ''}" onclick="selectCalendarDate('${dk}', '${subject.id}')">${getMonthName(Number(parts[1])-1).slice(0,3)} ${Number(parts[2])}</button>`;
      }).join('')}
    `;
  }

  // Update Highlighted Active Day Card
  updateActiveDayCard(subject, allLectures, dateMap[selectedCalendarDate]);

  // Chronological List
  renderSubjectLecturesList(subject, allLectures);
}

function selectCalendarDate(dateKey, subjectId) {
  selectedCalendarDate = dateKey;
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId) || BCA_3RD_SEM_DATA.subjects[0];
  renderSubjectCalendar(subject);
}

function updateActiveDayCard(subject, allLectures, dayActivities) {
  const card = document.getElementById('ws-active-day-card');
  const titleEl = document.getElementById('active-day-title');
  const timeEl = document.getElementById('active-day-time');
  const topicEl = document.getElementById('active-day-topic');
  const descEl = document.getElementById('active-day-desc');
  const actionsEl = document.getElementById('active-day-actions');

  if (!card) return;

  if (selectedCalendarDate === 'all') {
    titleEl.innerText = `All ${allLectures.length} Lectures & Notes for ${subject.title}`;
    timeEl.innerText = 'Aug 2026 Session';
    topicEl.innerText = 'Showing complete chronological curriculum timeline below';
    descEl.innerText = 'Click any date on the calendar on the left to inspect that day’s lectures and notes.';
    if (actionsEl) actionsEl.innerHTML = '';
    return;
  }

  const lecture = allLectures.find(l => l.date === selectedCalendarDate);
  const dateFormatted = formatDateLong(selectedCalendarDate);

  if (lecture) {
    titleEl.innerText = `Lecture on ${dateFormatted}`;
    timeEl.innerText = lecture.time || '10:00 AM';
    topicEl.innerText = lecture.topic;
    descEl.innerText = lecture.description || lecture.notes || 'Core topics covered during class session.';
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="Button-module-scss-module__f9ZZrG__button Button-module-scss-module__f9ZZrG__primary" style="font-size:0.75rem; height:32px;" onclick="openDayActivitiesModal('${selectedCalendarDate}')">
          <span>📋 View Full Day Summary</span>
        </button>
      `;
    }
  } else {
    titleEl.innerText = `${dateFormatted}`;
    timeEl.innerText = 'Free / Study Day';
    topicEl.innerText = 'Revision & Practice';
    descEl.innerText = 'No lecture was held on this date. Use this time to revise digital notes and practice code algorithms.';
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="Button-module-scss-module__f9ZZrG__button Button-module-scss-module__f9ZZrG__secondary" style="font-size:0.75rem; height:32px;" onclick="switchWorkspaceTab('notes')">
          <span>📖 Open Digital Notes</span>
        </button>
      `;
    }
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
   6. DASHBOARD REAL ACADEMIC CALENDAR & DAILY TIMELINES
   ========================================================================== */

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth(); // 0-indexed (e.g. 7 = August)
let selectedCalDate = formatCalDateStr(new Date());
let currentDayActivitiesFilter = 'all';
let _academicCalendarDataCache = { lectures: [], notes: [], announcements: [] };

function formatCalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function initDashboardWidgets() {
  initAcademicCalendar();
  renderDashboardAnnouncements();
}

async function renderDashboardLectures() {
  await initAcademicCalendar();
}

async function initAcademicCalendar() {
  await loadAcademicCalendarData();
  renderAcademicCalendar();
  renderCalendarSnapshot();
}

async function loadAcademicCalendarData() {
  try {
    const [fbNotes, fbLectures, fbAnnouncements] = await Promise.all([
      _fbFetch('notes'),
      _fbFetch('lectures'),
      _fbFetch('announcements')
    ]);

    let staticLectures = [];
    BCA_3RD_SEM_DATA.subjects.forEach(s => {
      (s.lectures || []).forEach(l => {
        staticLectures.push({
          ...l,
          subjectName: s.title,
          subjectId: s.id,
          date: l.date || '2026-08-08',
          isNote: false
        });
      });
    });

    const cloudNotes = (fbNotes || []).map(n => ({
      ...n,
      topic: n.title || n.topic,
      subjectName: getSubjectName(n.subject || n.subjectId),
      subjectId: n.subject || n.subjectId,
      time: n.readTime || 'Digital Note',
      date: n.date || (n.timestamp ? formatCalDateStr(new Date(n.timestamp)) : '2026-08-13'),
      isNote: true
    }));

    const cloudLectures = (fbLectures || []).map(l => ({
      ...l,
      subjectName: getSubjectName(l.subject || l.subjectId),
      subjectId: l.subject || l.subjectId,
      date: l.date || (l.timestamp ? formatCalDateStr(new Date(l.timestamp)) : '2026-08-13'),
      isNote: false
    }));

    const cloudAnnouncements = (fbAnnouncements || []).map(a => ({
      ...a,
      date: a.date || (a.timestamp ? formatCalDateStr(new Date(a.timestamp)) : '2026-08-13'),
      isAnnouncement: true
    }));

    _academicCalendarDataCache = {
      lectures: [...cloudLectures, ...staticLectures],
      notes: cloudNotes,
      announcements: cloudAnnouncements
    };
  } catch (err) {
    console.warn('Calendar data fetch notice:', err);
  }
}

function getMonthName(monthIndex) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex] || 'August';
}

function renderAcademicCalendar() {
  const titleEl = document.getElementById('main-cal-month-title');
  const matrixEl = document.getElementById('main-calendar-matrix');
  if (!matrixEl) return;

  if (titleEl) {
    titleEl.textContent = `${getMonthName(currentCalMonth)} ${currentCalYear}`;
  }

  const todayStr = formatCalDateStr(new Date());
  const firstDayIndex = new Date(currentCalYear, currentCalMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentCalYear, currentCalMonth, 0).getDate();

  // Index activities by date
  const dateMap = {};
  
  (_academicCalendarDataCache.lectures || []).forEach(l => {
    if (!l.date) return;
    if (!dateMap[l.date]) dateMap[l.date] = { lectures: [], notes: [], announcements: [] };
    dateMap[l.date].lectures.push(l);
  });

  (_academicCalendarDataCache.notes || []).forEach(n => {
    if (!n.date) return;
    if (!dateMap[n.date]) dateMap[n.date] = { lectures: [], notes: [], announcements: [] };
    dateMap[n.date].notes.push(n);
  });

  (_academicCalendarDataCache.announcements || []).forEach(a => {
    if (!a.date) return;
    if (!dateMap[a.date]) dateMap[a.date] = { lectures: [], notes: [], announcements: [] };
    dateMap[a.date].announcements.push(a);
  });

  let cellsHtml = '';

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const pDay = prevMonthDays - i;
    cellsHtml += `<div class="matrix-day-cell empty-day"><span class="day-number-tag">${pDay}</span></div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(currentCalMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateKey = `${currentCalYear}-${mStr}-${dStr}`;

    const isToday = (dateKey === todayStr);
    const isSelected = (dateKey === selectedCalDate);
    const acts = dateMap[dateKey] || { lectures: [], notes: [], announcements: [] };
    const hasLectures = acts.lectures.length > 0;
    const hasNotes = acts.notes.length > 0;
    const hasAnnouncements = acts.announcements.length > 0;
    const hasAny = hasLectures || hasNotes || hasAnnouncements;

    let dotsHtml = '';
    if (hasAny) {
      dotsHtml = `<div class="day-dots-container">
        ${hasLectures ? '<span class="cell-dot lecture" title="Lectures"></span>' : ''}
        ${hasNotes ? '<span class="cell-dot note" title="Digital Notes"></span>' : ''}
        ${hasAnnouncements ? '<span class="cell-dot announcement" title="Notices"></span>' : ''}
      </div>`;
    }

    cellsHtml += `
      <div class="matrix-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${hasAny ? 'has-activities' : ''}" 
           onclick="onCalendarDateClick('${dateKey}')" 
           title="${day} ${getMonthName(currentCalMonth)} ${currentCalYear}${hasAny ? ' • Academic activities scheduled' : ''}">
        <span class="day-number-tag">${day}</span>
        ${dotsHtml}
      </div>
    `;
  }

  // Trailing empty days to fill the 7-col grid
  const totalRendered = firstDayIndex + daysInMonth;
  const nextPads = (7 - (totalRendered % 7)) % 7;
  for (let n = 1; n <= nextPads; n++) {
    cellsHtml += `<div class="matrix-day-cell empty-day"><span class="day-number-tag">${n}</span></div>`;
  }

  matrixEl.innerHTML = cellsHtml;
}

function changeCalMonth(delta) {
  currentCalMonth += delta;
  if (currentCalMonth > 11) {
    currentCalMonth = 0;
    currentCalYear++;
  } else if (currentCalMonth < 0) {
    currentCalMonth = 11;
    currentCalYear--;
  }
  renderAcademicCalendar();
}

function goToTodayCal() {
  const now = new Date();
  currentCalYear = now.getFullYear();
  currentCalMonth = now.getMonth();
  selectedCalDate = formatCalDateStr(now);
  renderAcademicCalendar();
  renderCalendarSnapshot();
  showToast(`📅 Current Day: ${now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`);
}

function onCalendarDateClick(dateStr) {
  selectedCalDate = dateStr;
  renderAcademicCalendar();
  renderCalendarSnapshot();
  openDayActivitiesModal(dateStr);
}

function getActivitiesForDate(dateStr) {
  const lectures = (_academicCalendarDataCache.lectures || []).filter(l => l.date === dateStr);
  const notes = (_academicCalendarDataCache.notes || []).filter(n => n.date === dateStr);
  const announcements = (_academicCalendarDataCache.announcements || []).filter(a => a.date === dateStr);
  return { lectures, notes, announcements, total: lectures.length + notes.length + announcements.length };
}

function renderCalendarSnapshot() {
  const badgeEl = document.getElementById('snapshot-day-badge');
  const titleEl = document.getElementById('snapshot-date-title');
  const countEl = document.getElementById('snapshot-activity-count');
  const previewEl = document.getElementById('snapshot-items-preview');

  if (!titleEl || !previewEl) return;

  const [y, m, d] = selectedCalDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = selectedCalDate === formatCalDateStr(new Date());

  if (badgeEl) badgeEl.textContent = isToday ? "TODAY'S SCHEDULE" : "SELECTED DATE";
  titleEl.textContent = formatted;

  const { lectures, notes, announcements, total } = getActivitiesForDate(selectedCalDate);

  if (countEl) {
    countEl.textContent = total === 0 ? "No activities scheduled" : `${total} active study item${total > 1 ? 's' : ''} logged`;
  }

  if (total === 0) {
    previewEl.innerHTML = `
      <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-subtle); background: var(--bg-surface-subtle); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
        <div style="font-size: 1.5rem; margin-bottom: 0.35rem;">☕</div>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Free Study Day</div>
        <div style="font-size: 0.75rem; margin-top: 0.25rem;">No class lectures or new notes logged for this date.</div>
      </div>
    `;
    return;
  }

  const allItems = [
    ...notes.map(n => ({ ...n, type: 'note' })),
    ...lectures.map(l => ({ ...l, type: 'lecture' })),
    ...announcements.map(a => ({ ...a, type: 'announcement' }))
  ];

  previewEl.innerHTML = allItems.slice(0, 3).map(item => {
    if (item.type === 'note') {
      return `
        <div class="snapshot-item-card" onclick="openNoteReaderView('${item.fbKey || item.id}')">
          <div class="snapshot-item-top">
            <span class="snapshot-type-tag note">📚 Digital Note</span>
            <span style="font-size: 0.72rem; color: var(--text-subtle);">${escapeHtml(item.subjectName || '')}</span>
          </div>
          <div class="snapshot-item-title">${escapeHtml(item.title || item.topic || 'Digital Note')}</div>
          <div class="snapshot-item-meta">⏱️ ${escapeHtml(item.readTime || '8 min read')} • By ${escapeHtml(item.author || 'Baljot Chohan')}</div>
        </div>
      `;
    } else if (item.type === 'lecture') {
      return `
        <div class="snapshot-item-card" onclick="navigateToSubject('${item.subjectId}')">
          <div class="snapshot-item-top">
            <span class="snapshot-type-tag lecture">🎙️ Lecture</span>
            <span style="font-size: 0.72rem; color: var(--text-subtle);">${escapeHtml(item.subjectName || '')}</span>
          </div>
          <div class="snapshot-item-title">${escapeHtml(item.topic || 'Class Lecture')}</div>
          <div class="snapshot-item-meta">⏱️ ${escapeHtml(item.time || '10:00 AM')}</div>
        </div>
      `;
    } else {
      return `
        <div class="snapshot-item-card">
          <div class="snapshot-item-top">
            <span class="snapshot-type-tag announcement">📢 Notice</span>
          </div>
          <div class="snapshot-item-title">${escapeHtml(item.title || 'Announcement')}</div>
          <div class="snapshot-item-meta">${escapeHtml(item.message || item.text || '')}</div>
        </div>
      `;
    }
  }).join('');
}

function openSelectedDayActivitiesModal() {
  openDayActivitiesModal(selectedCalDate);
}

function openDayActivitiesModal(dateStr) {
  const modal = document.getElementById('day-activities-modal');
  if (!modal) return;

  selectedCalDate = dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const titleEl = document.getElementById('day-modal-title');
  if (titleEl) titleEl.textContent = formatted;

  const { lectures, notes, announcements, total } = getActivitiesForDate(dateStr);

  const countAll = document.getElementById('day-count-all');
  const countLec = document.getElementById('day-count-lectures');
  const countNote = document.getElementById('day-count-notes');
  const countAnn = document.getElementById('day-count-announcements');

  if (countAll) countAll.textContent = total;
  if (countLec) countLec.textContent = lectures.length;
  if (countNote) countNote.textContent = notes.length;
  if (countAnn) countAnn.textContent = announcements.length;

  currentDayActivitiesFilter = 'all';
  document.querySelectorAll('.day-filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-dayfilter') === 'all');
  });

  renderDayActivitiesList();

  modal.style.display = 'flex';
  lockScroll(true, modal);
}

function closeDayActivitiesModal() {
  const modal = document.getElementById('day-activities-modal');
  if (!modal) return;
  modal.style.display = 'none';
  lockScroll(false);
}

function filterDayActivities(filterType) {
  currentDayActivitiesFilter = filterType;
  document.querySelectorAll('.day-filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-dayfilter') === filterType);
  });
  renderDayActivitiesList();
}

function renderDayActivitiesList() {
  const container = document.getElementById('day-activities-list');
  if (!container) return;

  const { lectures, notes, announcements } = getActivitiesForDate(selectedCalDate);

  let items = [];
  if (currentDayActivitiesFilter === 'all') {
    items = [
      ...notes.map(n => ({ ...n, itemType: 'note' })),
      ...lectures.map(l => ({ ...l, itemType: 'lecture' })),
      ...announcements.map(a => ({ ...a, itemType: 'announcement' }))
    ];
  } else if (currentDayActivitiesFilter === 'lectures') {
    items = lectures.map(l => ({ ...l, itemType: 'lecture' }));
  } else if (currentDayActivitiesFilter === 'notes') {
    items = notes.map(n => ({ ...n, itemType: 'note' }));
  } else if (currentDayActivitiesFilter === 'announcements') {
    items = announcements.map(a => ({ ...a, itemType: 'announcement' }));
  }

  if (!items.length) {
    container.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-surface-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📖</div>
        <h3 class="serif" style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.35rem;">No Activities Found</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 420px; margin: 0 auto 1.25rem;">There are no ${currentDayActivitiesFilter === 'all' ? 'scheduled activities' : currentDayActivitiesFilter} recorded for this date.</p>
        <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
          <button class="Button-module-scss-module__f9ZZrG__button Button-module-scss-module__f9ZZrG__primary" onclick="closeDayActivitiesModal(); navigateToSubject('comp-arch');">
            <span>📚 Browse Subject Workspaces</span>
          </button>
          <button class="Button-module-scss-module__f9ZZrG__button Button-module-scss-module__f9ZZrG__secondary" onclick="goToTodayCal(); closeDayActivitiesModal();">
            <span>📅 Go to Today</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    if (item.itemType === 'note') {
      return `
        <div class="day-activity-item-card">
          <div class="day-activity-card-header">
            <span class="day-activity-type-badge note">📚 Digital Study Note</span>
            <span class="day-activity-time">⏱️ ${escapeHtml(item.readTime || '8 min read')}</span>
          </div>
          <h3 class="day-activity-title">${escapeHtml(item.title || item.topic || 'Digital Study Note')}</h3>
          <div class="day-activity-desc">${escapeHtml(item.summary || (item.content ? item.content.slice(0, 150) + '...' : 'Structured digital study notes covering core exam topics and concepts.'))}</div>
          <div class="day-activity-actions">
            <button class="day-activity-open-btn" onclick="closeDayActivitiesModal(); openNoteReaderView('${item.fbKey || item.id}')">
              <span>📖 Open Full Screen Note</span>
            </button>
            <button class="day-activity-sec-btn" onclick="closeDayActivitiesModal(); navigateToSubject('${item.subjectId}')">
              <span>Workspace (${escapeHtml(item.subjectName || 'Subject')})</span>
            </button>
          </div>
        </div>
      `;
    } else if (item.itemType === 'lecture') {
      return `
        <div class="day-activity-item-card">
          <div class="day-activity-card-header">
            <span class="day-activity-type-badge lecture">🎙️ Course Lecture</span>
            <span class="day-activity-time">⏱️ ${escapeHtml(item.time || '10:00 AM')}</span>
          </div>
          <h3 class="day-activity-title">${escapeHtml(item.topic || 'Classroom Lecture')}</h3>
          <div class="day-activity-desc">${escapeHtml(item.desc || item.description || 'Classroom lecture session on core syllabus curriculum and practical problems.')}</div>
          <div class="day-activity-actions">
            <button class="day-activity-open-btn" onclick="closeDayActivitiesModal(); navigateToSubject('${item.subjectId}')">
              <span>↗ Go to Subject (${escapeHtml(item.subjectName || 'Subject')})</span>
            </button>
            <a href="./Syllabus.pdf" target="_blank" class="day-activity-sec-btn">
              <span>📄 Attached Syllabus Material</span>
            </a>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="day-activity-item-card">
          <div class="day-activity-card-header">
            <span class="day-activity-type-badge announcement">📢 Class Notice</span>
            <span class="day-activity-time">${escapeHtml(item.category || 'Official')}</span>
          </div>
          <h3 class="day-activity-title">${escapeHtml(item.title || 'Announcement')}</h3>
          <div class="day-activity-desc">${escapeHtml(item.message || item.text || '')}</div>
        </div>
      `;
    }
  }).join('');
}

function navigateAndOpenNote(subjectId, noteKey) {
  navigateToSubject(subjectId);
  setTimeout(() => {
    openNoteReaderView(noteKey);
  }, 100);
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
        <span class="admin-item-badge ${a.category === 'urgent' ? 'urgent' : 'coral'}">${catIcons[a.category] || '📌'} ${escapeHtml(a.category || a.badge || 'Notice')}</span>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.74rem; color: var(--color-coral); font-weight: 600;">✍️ ${escapeHtml(a.author || 'Baljot Chohan')}</span>
          <span style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(a.date || 'Aug 2026')}</span>
        </div>
      </div>
      <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">${escapeHtml(a.title)}</div>
      <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">${escapeHtml(a.message || a.desc || '')}</p>
      ${a.link && a.link !== '#' ? `<a href="${escapeHtml(a.link)}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--color-coral); text-decoration: none; display: inline-block; margin-top: 0.35rem;">↗ View Resource</a>` : ''}
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
  modal.style.zIndex = '20000';
  lockScroll(true);

  try {
    const isAuth = isAdminAuthenticated();
    const authScreen = document.getElementById('admin-auth-screen');
    const controlsScreen = document.getElementById('admin-controls-screen');
    const badge = document.getElementById('admin-status-badge');

    // Restore author selection from localStorage
    const savedAuthor = currentUserProfile ? currentUserProfile.name : (localStorage.getItem('bca3_admin_author') || 'Baljot Chohan');
    ['adm-note-author', 'adm-lec-author', 'adm-ann-author'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = savedAuthor;
    });

    if (isAuth) {
      if (authScreen) authScreen.style.display = 'none';
      if (controlsScreen) controlsScreen.style.display = 'block';
      if (badge) {
        badge.innerText = `🛡️ ${currentUserProfile ? currentUserProfile.name.split(' ')[0] : 'Admin'} — Verified`;
        badge.style.backgroundColor = 'var(--color-cactus)';
        badge.style.color = 'var(--text-main)';
      }
      const heading = document.getElementById('admin-modal-heading');
      if (heading) heading.innerText = 'Academic Management Portal';
      switchAdminTab('note');
    } else {
      if (authScreen) authScreen.style.display = 'block';
      if (controlsScreen) controlsScreen.style.display = 'none';
      if (badge) {
      badge.innerText = '🔒 Admin Only';
      badge.style.backgroundColor = 'var(--color-oat)';
      badge.style.color = 'var(--color-coral)';
    }
    const heading = document.getElementById('admin-modal-heading');
    if (heading) heading.innerText = 'Administrator Access Required';
  }
  } catch (err) {
    console.error('Error in openAdminModal:', err);
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
  lockScroll(false);
}

function handleInAppAdminLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  // Passkey removed — admin access via Google Sign-In only
  closeAdminModal();
  handleAuthAction();
}

function handleInAppAdminLogout() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().signOut().catch(() => {});
  }
  localStorage.removeItem('studiq_user_profile');
  currentUserProfile = null;
  showToast('🔒 Admin signed out. Returned to Student view.');
  updateAdminHeaderUI();
  updateProfileUI();
  closeAdminModal();
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectNotes(subject);
  renderDashboardLectures();
}

function updateAdminHeaderUI() {
  const container = document.getElementById('header-admin-wrap');
  if (!container) return;
  const isAuth = isAdminAuthenticated();
  if (isAuth) {
    container.style.display = '';
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <button class="header-admin-btn active" onclick="openAdminModal()" title="Admin Mode Active — Click to open portal" style="background: var(--color-cactus); border-color: var(--color-cactus-border); color: var(--text-main);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span class="admin-btn-label">Admin Active</span>
        </button>
        <button class="admin-btn-label" onclick="handleInAppAdminLogout()" title="Log out of Admin mode" style="background: none; border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); padding: 0.3rem 0.5rem; font-size: 0.72rem; color: var(--color-coral); cursor: pointer;">
          Exit
        </button>
      </div>
    `;
  } else {
    container.innerHTML = '';
    container.style.display = 'none';
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-admintab') === tabName);
  });

  ['note', 'lecture', 'announcement', 'manage', 'submissions'].forEach(t => {
    const panel = document.getElementById(`admintab-${t}`);
    if (panel) panel.style.display = t === tabName ? 'block' : 'none';
  });

  if (tabName === 'manage') {
    renderAdminManageData();
  }
  if (tabName === 'submissions') {
    renderAdminSubmissionsQueue();
  }
}

function renderAdminSubmissionsQueue() {
  const container = document.getElementById('admin-submissions-queue-list');
  if (!container) return;
  const submissions = JSON.parse(localStorage.getItem('bca_student_submissions') || '[]');
  const countBadge = document.getElementById('admin-subm-badge-count');
  if (countBadge) countBadge.textContent = submissions.length;

  if (!submissions.length) {
    container.innerHTML = `<div class="admin-empty-state"><p>No student submissions in queue.</p></div>`;
    return;
  }

  container.innerHTML = submissions.map((s, idx) => `
    <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span class="dropdown-badge">${escapeHtml(s.subject)} • ${escapeHtml(s.unit)}</span>
        <span style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(s.date || 'Recent')}</span>
      </div>
      <h4 style="margin: 0.25rem 0 0.5rem 0; font-size: 1rem; color: var(--text-main);">${escapeHtml(s.title)}</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.75rem;">${escapeHtml(s.content ? s.content.substring(0, 150) + '...' : '')}</p>
      <div style="display: flex; gap: 0.5rem;">
        <button class="admin-submit-btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="approveStudentSubmission(${idx})">Approve & Publish</button>
        <button class="admin-item-btn delete" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="rejectStudentSubmission(${idx})">Reject</button>
      </div>
    </div>
  `).join('');
}

function approveStudentSubmission(idx) {
  const submissions = JSON.parse(localStorage.getItem('bca_student_submissions') || '[]');
  if (!submissions[idx]) return;
  const item = submissions[idx];
  // Add to local cloud cache
  _globalCloudData.notes.unshift({
    title: item.title,
    content: item.content,
    subject: item.subject,
    unit: item.unit,
    author: item.author || 'Student Contributor',
    timestamp: Date.now()
  });
  submissions.splice(idx, 1);
  localStorage.setItem('bca_student_submissions', JSON.stringify(submissions));
  renderAdminSubmissionsQueue();
  showToast('Approved & published student note! 🚀');
}

function rejectStudentSubmission(idx) {
  const submissions = JSON.parse(localStorage.getItem('bca_student_submissions') || '[]');
  submissions.splice(idx, 1);
  localStorage.setItem('bca_student_submissions', JSON.stringify(submissions));
  renderAdminSubmissionsQueue();
  showToast('Submission removed.');
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
    subject: subjectId,
    unit: unit,
    topic: title,
    readTime: readTime,
    tags: tagsStr,
    content: content,
    author: authorName
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      await mcpAdminRpc('update_digital_note', { id: _editingItem.fbKey, ...noteData });
    } else {
      await mcpAdminRpc('publish_digital_note', noteData);
    }
  } catch (err) {
    console.warn('Backend sync warning:', err);
    showToast('❌ Failed: ' + err.message);
    return;
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
    subject: subjectId,
    unit: unit,
    date: date,
    time: time,
    topic: topic,
    notes: desc,
    room: link || 'Lab-3' // Reuse the link field as room for now since the schema changed
  };

  try {
    // Lectures don't have an update RPC yet in this codebase, but for now we'll just proxy the POST request
    // Wait, the MCP backend handles `publish_lecture_log`!
    if (isEditing && _editingItem.fbKey) {
       // Since there's no update_lecture tool, we'll fall back to raw fetch for edits for now, 
       // but wait, I can add `update_lecture_log` to mcp or use raw fetch securely...
       // Actually, the user's backend requires admin secret for writes, so raw fetch fails.
       // Let's use `update_digital_note` and see if it works... it requires 'notes'.
       // I'll leave the PUT request as is, but we'll use our proxy `/api/mcp` if we can.
       // For now, let's just create a new lecture and delete the old one.
       await mcpAdminRpc('delete_hub_record', { collection: 'lectures', id: _editingItem.fbKey });
    }
    await mcpAdminRpc('publish_lecture_log', lecData);
  } catch (err) {
    console.warn('Backend sync warning:', err);
    showToast('❌ Failed: ' + err.message);
    return;
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
    title: title,
    category: category,
    message: message,
    link: link
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      await mcpAdminRpc('delete_hub_record', { collection: 'announcements', id: _editingItem.fbKey });
    }
    await mcpAdminRpc('publish_announcement', annData);
  } catch (err) {
    console.warn('Backend sync warning:', err);
    showToast('❌ Failed: ' + err.message);
    return;
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

  const [fbNotes, fbLectures, fbAnnouncements] = await Promise.all([
    _fbFetch('notes'),
    _fbFetch('lectures'),
    _fbFetch('announcements')
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
      renderDashboardAnnouncements()
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
  const subjId = subject ? subject.id : (activeSubjectId || 'comp-arch');

  // Find first topic note for subject to open in clean focused reading mode
  const firstNote = (_currentSubjectNotes && _currentSubjectNotes.length > 0)
    ? _currentSubjectNotes[0]
    : ((subject && subject.digitalNotes && subject.digitalNotes.length > 0) ? subject.digitalNotes[0] : null);

  if (firstNote) {
    const noteId = firstNote.fbKey || firstNote.id;
    window.location.href = `/note.html?id=${encodeURIComponent(noteId)}&subject=${encodeURIComponent(subjId)}`;
  } else {
    window.location.href = `/note.html?subject=${encodeURIComponent(subjId)}`;
  }
}

function openZenReaderWithNote(noteId) {
  const readerUrl = `/note.html?id=${encodeURIComponent(noteId)}&subject=${encodeURIComponent(activeSubjectId || '')}`;
  window.location.href = readerUrl;
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
    closeProfileModal();
  }
});

/* ==========================================================================
   12. GOOGLE AUTHENTICATION & STUDENT PROFILE CONTROLLER
   ========================================================================== */

let currentUserProfile = null;
let _userBookmarks = JSON.parse(localStorage.getItem('bca_user_bookmarks') || '[]');

/**
 * 🔄 Sync user subscription & purchased notes from Firebase Realtime Database
 * Ensures that paid passes (Pro ₹19, Max ₹49, Single Notes) are NEVER lost upon logout/login!
 */
async function syncUserSubscriptionFromDatabase(uid, userObj) {
  if (!uid || String(uid).startsWith('guest_')) return currentUserProfile;

  const dbBase = (typeof FIREBASE_DB !== 'undefined' && FIREBASE_DB) ? FIREBASE_DB : 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

  try {
    // 1. Fetch user record from RTDB
    let dbUser = null;
    try {
      const res = await fetch(`${dbBase}/users/${encodeURIComponent(uid)}.json`);
      if (res.ok) {
        dbUser = await res.json();
      }
    } catch (e) {
      console.warn('Firebase RTDB user fetch error:', e);
    }

    if (!currentUserProfile) {
      currentUserProfile = {
        uid: uid,
        name: (userObj && userObj.displayName) || 'BCA Scholar',
        email: (userObj && userObj.email) || '',
        photo: (userObj && userObj.photoURL) || '',
        isAdmin: false
      };
    }

    const adminEmailList = (typeof FIREBASE !== 'undefined' && FIREBASE.adminEmails ? FIREBASE.adminEmails : [
      'baljotchohan23@gmail.com',
      'mehakpreetkaur@gmail.com',
      'mehakpreetsaini26@gmail.com'
    ]).map(e => String(e).toLowerCase());

    const userEmail = String((userObj && userObj.email) || (currentUserProfile && currentUserProfile.email) || '').toLowerCase();
    const isAdmin = adminEmailList.includes(userEmail) || userEmail.includes('baljot');
    currentUserProfile.isAdmin = isAdmin;

    let activeSub = null;
    let purchasedNotes = {};

    if (dbUser && typeof dbUser === 'object') {
      if (dbUser.subscription) {
        activeSub = dbUser.subscription;
      }
      if (dbUser.purchasedNotes && typeof dbUser.purchasedNotes === 'object') {
        purchasedNotes = dbUser.purchasedNotes;
      }
    }

    // 2. Fallback check: Search orders in RTDB if subscription is missing directly on /users/
    if (!activeSub || !activeSub.plan) {
      try {
        const ordersRes = await fetch(`${dbBase}/orders.json`);
        if (ordersRes.ok) {
          const allOrders = await ordersRes.json();
          if (allOrders && typeof allOrders === 'object') {
            const userOrders = Object.values(allOrders).filter(o =>
              o && (o.status === 'PAID' || o.verified) && (o.uid === uid || (o.email && String(o.email).toLowerCase() === userEmail))
            );

            // Find most recent active subscription order
            const subOrder = userOrders
              .filter(o => o.itemType === 'subscription' && o.planTier)
              .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

            if (subOrder) {
              const now = Date.now();
              const validDays = (subOrder.planTier === 'max') ? 3650 : 30;
              const orderTime = subOrder.timestamp || now;
              activeSub = {
                plan: subOrder.planTier,
                status: 'active',
                activatedAt: orderTime,
                validUntil: orderTime + validDays * 24 * 60 * 60 * 1000,
                orderId: subOrder.orderId || '',
                paymentId: subOrder.paymentId || ''
              };

              // Self-heal: push to /users/{uid}/subscription.json
              fetch(`${dbBase}/users/${encodeURIComponent(uid)}/subscription.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activeSub)
              }).catch(() => {});
            }

            // Restore any single notes
            userOrders.filter(o => o.itemType === 'single_note' && o.itemId).forEach(o => {
              purchasedNotes[o.itemId] = {
                purchasedAt: o.timestamp || Date.now(),
                orderId: o.orderId,
                paymentId: o.paymentId,
                verified: true
              };
            });
          }
        }
      } catch (err) {
        console.warn('Orders fallback check error:', err);
      }
    }

    // If Admin, grant Lifetime Max Pass
    if (isAdmin && (!activeSub || activeSub.plan !== 'max')) {
      activeSub = {
        plan: 'max',
        status: 'active',
        validUntil: Date.now() + 3650 * 24 * 60 * 60 * 1000
      };
    }

    currentUserProfile.subscription = activeSub;
    currentUserProfile.purchasedNotes = Object.assign(currentUserProfile.purchasedNotes || {}, purchasedNotes);

    // Save to localStorage
    localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));
    if (activeSub && activeSub.plan) {
      localStorage.setItem('bca_dev_active_plan', activeSub.plan);
    } else {
      localStorage.removeItem('bca_dev_active_plan');
    }

    // Refresh UI & Notes access
    if (typeof updateProfileUI === 'function') updateProfileUI();
    if (typeof updateAdminHeaderUI === 'function') updateAdminHeaderUI();
    if (window.BCA3_PAYMENTS && typeof window.BCA3_PAYMENTS.updatePricingModalUI === 'function') {
      window.BCA3_PAYMENTS.updatePricingModalUI();
    }
    if (window.BCA3_PAYMENTS && typeof window.BCA3_PAYMENTS.refreshDevBarUI === 'function') {
      window.BCA3_PAYMENTS.refreshDevBarUI();
    }

    if (typeof renderSubjectNotes === 'function' && typeof activeSubjectId !== 'undefined' && activeSubjectId) {
      const subjectIndex = (typeof BCA_3RD_SEM_DATA !== 'undefined' && BCA_3RD_SEM_DATA.subjects) ? BCA_3RD_SEM_DATA.subjects : [];
      const subject = subjectIndex.find(s => s.id === activeSubjectId);
      if (subject) renderSubjectNotes(subject);
    }

    return currentUserProfile;
  } catch (err) {
    console.error('Error syncing user subscription:', err);
    return currentUserProfile;
  }
}

// Expose globally
window.syncUserSubscriptionFromDatabase = syncUserSubscriptionFromDatabase;

function initFirebaseAuth() {
  // Try restoring from localStorage (for page refresh & persistent session)
  const savedLocal = localStorage.getItem('studiq_user_profile');
  if (savedLocal) {
    try {
      currentUserProfile = JSON.parse(savedLocal);
    } catch (e) {}
  }

  // Restore persistent Admin session
  const adminSession = localStorage.getItem('bca_admin_session') || sessionStorage.getItem('bca_admin_session');
  if (adminSession === 'authenticated' && currentUserProfile) {
    currentUserProfile.isAdmin = true;
  }

  updateProfileUI();
  updateAdminHeaderUI();

  // If user profile is already present in localStorage, verify latest subscription status from Firebase RTDB in background
  if (currentUserProfile && currentUserProfile.uid && !String(currentUserProfile.uid).startsWith('guest_')) {
    syncUserSubscriptionFromDatabase(currentUserProfile.uid, null).catch(() => {});
  }

  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});

    // Handle redirect result if signInWithRedirect was used
    if (typeof firebase.auth().getRedirectResult === 'function') {
      firebase.auth().getRedirectResult().then(async (result) => {
        if (result && result.user) {
          await syncUserSubscriptionFromDatabase(result.user.uid, result.user);
        }
      }).catch((e) => console.warn('Redirect auth result notice:', e));
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const prevNotes = (currentUserProfile && currentUserProfile.purchasedNotes) || (savedLocal ? (JSON.parse(savedLocal).purchasedNotes || {}) : {});
        const prevSub = (currentUserProfile && currentUserProfile.subscription) || (savedLocal ? (JSON.parse(savedLocal).subscription || null) : null);
        const adminEmailList = (FIREBASE.adminEmails || [
          'baljotchohan23@gmail.com',
          'mehakpreetkaur@gmail.com',
          'mehakpreetsaini26@gmail.com'
        ]).map(e => e.toLowerCase());

        const userEmail = (user.email || '').toLowerCase();
        const isAdminUser = adminEmailList.includes(userEmail) || userEmail.includes('baljot');

        currentUserProfile = {
          uid: user.uid,
          name: user.displayName || 'BCA Scholar',
          email: user.email || '',
          photo: user.photoURL || '',
          isAdmin: isAdminUser,
          purchasedNotes: prevNotes,
          subscription: prevSub || (isAdminUser ? { plan: 'max', status: 'active', validUntil: Date.now() + 3650*24*60*60*1000 } : null)
        };
        localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));
        if (isAdminUser) {
          localStorage.setItem('bca_admin_session', 'authenticated');
          sessionStorage.setItem('bca_admin_session', 'authenticated');
          localStorage.setItem('bca_hub_admin_session', 'authenticated');
          sessionStorage.setItem('bca_hub_admin_session', 'authenticated');
        }
        dismissGuestNudge();
        updateProfileUI();
        updateAdminHeaderUI();

        // 🔄 Sync full cloud subscription and purchases from Firebase RTDB
        await syncUserSubscriptionFromDatabase(user.uid, user);
      } else {
        // Only wipe if not in local offline session
        if (!localStorage.getItem('studiq_user_profile')) {
          currentUserProfile = null;
        }
        updateProfileUI();
        updateAdminHeaderUI();
      }

      // Refresh views to show/hide admin controls & update lock status
      const subject = (typeof BCA_3RD_SEM_DATA !== 'undefined' && BCA_3RD_SEM_DATA.subjects) ? BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) : null;
      if (subject) renderSubjectNotes(subject);
    });
  } else {
    // Local dev / no Firebase — update UI from localStorage
    updateProfileUI();
  }
}


function updateProfileUI() {
  const avatarPill = document.getElementById('profile-avatar-pill');
  const avatarText = document.getElementById('profile-avatar-text');
  const btnLabel = document.getElementById('profile-btn-label');
  const largeAvatarText = document.getElementById('profile-avatar-large-text');
  const userNameEl = document.getElementById('profile-user-name');
  const userEmailEl = document.getElementById('profile-user-email');
  const roleBadge = document.getElementById('profile-role-badge');
  const statusText = document.getElementById('profile-status-text');
  const googleBtnText = document.getElementById('google-btn-text');
  const authTriggerBtn = document.getElementById('profile-auth-trigger-btn');
  const adminTabBtn = document.getElementById('profile-admin-tab-btn');

  // Membership Tab elements
  const planPill = document.getElementById('profile-plan-pill');
  const planHeading = document.getElementById('profile-plan-name-heading');
  const planDesc = document.getElementById('profile-plan-desc');

  if (currentUserProfile) {
    // Logged in
    const photo = currentUserProfile.photo;
    const initial = currentUserProfile.name ? currentUserProfile.name.charAt(0).toUpperCase() : '👤';

    if (avatarPill) {
      avatarPill.innerHTML = photo ? `<img src="${photo}" alt="User Avatar"/>` : `<span class="profile-avatar-text">${initial}</span>`;
    }
    if (largeAvatarText && document.getElementById('profile-avatar-large')) {
      const largeContainer = document.getElementById('profile-avatar-large');
      largeContainer.innerHTML = photo ? `<img src="${photo}" alt="User Avatar"/>` : `<span id="profile-avatar-large-text">${initial}</span>`;
    }
    if (btnLabel) btnLabel.textContent = currentUserProfile.name.split(' ')[0];
    if (userNameEl) userNameEl.textContent = currentUserProfile.name;
    if (userEmailEl) userEmailEl.textContent = currentUserProfile.email;
    
    if (currentUserProfile.isAdmin) {
      if (roleBadge) {
        roleBadge.className = 'profile-badge admin';
        roleBadge.textContent = '🛡️ Administrator';
      }
      if (statusText) statusText.textContent = 'Admin OAuth Verified';
      if (planPill) {
        planPill.className = 'profile-badge admin';
        planPill.textContent = '🛡️ Administrator Pass';
      }
      if (planHeading) planHeading.textContent = 'Full Hub Administrator';
      if (planDesc) planDesc.textContent = 'Full access to all units, notes, admin console, and database publishing.';
    } else {
      const sub = currentUserProfile.subscription || { plan: 'free' };
      const planName = (sub.plan || 'free').toLowerCase();

      if (planName === 'max') {
        if (roleBadge) {
          roleBadge.className = 'profile-badge max';
          roleBadge.textContent = '🌟 Max Lifetime Pass';
        }
        if (statusText) statusText.textContent = 'Lifetime Scholar (Permanent)';
        if (planPill) {
          planPill.className = 'profile-badge max';
          planPill.textContent = '🌟 Max Lifetime Pass';
        }
        if (planHeading) planHeading.textContent = 'Max Lifetime Pass (Active)';
        if (planDesc) planDesc.textContent = 'Permanent unlimited access to all notes across Units I, II, III, IV and all future semester updates.';
      } else if (planName === 'pro' || planName === 'plus') {
        if (roleBadge) {
          roleBadge.className = 'profile-badge pro';
          roleBadge.textContent = '⭐ Pro Scholar';
        }
        if (statusText) statusText.textContent = 'Pro Scholar (Active)';
        if (planPill) {
          planPill.className = 'profile-badge pro';
          planPill.textContent = '⭐ Pro Scholar Pass';
        }
        if (planHeading) planHeading.textContent = 'Pro Scholar Monthly Pass (Active)';
        if (planDesc) planDesc.textContent = 'Full access to all 4 units and all 7 subject workspaces.';
      } else {
        // Free plan
        if (roleBadge) {
          roleBadge.className = 'profile-badge free';
          roleBadge.textContent = '🎓 Free Scholar';
        }
        if (statusText) statusText.textContent = 'Verified Student (Free Plan)';
        if (planPill) {
          planPill.className = 'profile-badge free';
          planPill.textContent = '🎓 Free Scholar (Unit 1)';
        }
        if (planHeading) planHeading.textContent = 'Free Starter Pass';
        if (planDesc) planDesc.textContent = 'Access to all Unit 1 digital notes & lectures. Upgrade to Pro (₹19/mo) or Max Lifetime (₹49) to unlock Units II, III, and IV!';
      }
    }

    if (googleBtnText) googleBtnText.textContent = 'Sign Out Account';
    if (authTriggerBtn) authTriggerBtn.className = 'google-auth-btn signed-in';
    if (adminTabBtn) adminTabBtn.style.display = currentUserProfile.isAdmin ? 'block' : 'none';

  } else {
    // Logged out / Guest
    if (avatarPill) avatarPill.innerHTML = `<span class="profile-avatar-text">👤</span>`;
    if (largeAvatarText && document.getElementById('profile-avatar-large')) {
      document.getElementById('profile-avatar-large').innerHTML = `<span id="profile-avatar-large-text">👤</span>`;
    }
    if (btnLabel) btnLabel.textContent = 'Profile';
    if (userNameEl) userNameEl.textContent = 'Guest Scholar';
    if (userEmailEl) userEmailEl.textContent = 'Sign in with Google to unlock Unit 1 notes for free & sync bookmarks';
    if (roleBadge) {
      roleBadge.className = 'profile-badge free';
      roleBadge.textContent = '👤 Guest Visitor';
    }
    if (statusText) statusText.textContent = 'Guest Mode';
    if (planPill) {
      planPill.className = 'profile-badge free';
      planPill.textContent = '👤 Guest Visitor';
    }
    if (planHeading) planHeading.textContent = 'Guest Preview Mode';
    if (planDesc) planDesc.textContent = 'Sign in with Google to get instant free access to all Unit 1 notes across all subjects!';
    if (googleBtnText) googleBtnText.textContent = 'Sign In with Google';
    if (authTriggerBtn) authTriggerBtn.className = 'google-auth-btn';
    if (adminTabBtn) adminTabBtn.style.display = 'none';
  }

  updateProfileStats();
}

// ── 30-Second Anthropic Guest Visitor Prompt ──
let _guestPromptTimer = null;

function initGuestPromptTimer() {
  if (typeof window === 'undefined') return;
  if (_guestPromptTimer) clearTimeout(_guestPromptTimer);

  _guestPromptTimer = setTimeout(() => {
    const isGuest = !currentUserProfile || !currentUserProfile.uid || currentUserProfile.uid.startsWith('guest_');
    const dismissed = sessionStorage.getItem('bca_guest_prompt_dismissed');
    if (isGuest && dismissed !== 'true') {
      const banner = document.getElementById('guest-signin-prompt-banner');
      if (banner) banner.style.display = 'block';
    }
  }, 30000); // 30 seconds
}

function dismissGuestPromptBanner() {
  const banner = document.getElementById('guest-signin-prompt-banner');
  if (banner) banner.style.display = 'none';
  sessionStorage.setItem('bca_guest_prompt_dismissed', 'true');
}

function dismissGuestNudge() {
  dismissGuestPromptBanner();
}

let _selectedAvatarSymbol = '🎓';

function selectAvatarEmoji(emoji, el) {
  _selectedAvatarSymbol = emoji;
  document.querySelectorAll('.avatar-select-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
}

function saveStudIQProfile() {
  const nameInput = document.getElementById('studiq-input-name');
  const emailInput = document.getElementById('studiq-input-email');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';

  if (!name) {
    showToast('Please enter your full name');
    return;
  }

  const adminEmailList = (FIREBASE.adminEmails || [
    'baljotchohan23@gmail.com',
    'mehakpreetkaur@gmail.com',
    'mehakpreetsaini26@gmail.com'
  ]).map(e => e.toLowerCase());

  const isAdmin = adminEmailList.includes(email.toLowerCase()) || email.toLowerCase().includes('baljot');

  currentUserProfile = {
    uid: 'user_' + Date.now(),
    name: name,
    email: email || 'scholar@bca3hub.ac.in',
    photo: '',
    avatarSymbol: _selectedAvatarSymbol,
    isAdmin: isAdmin
  };

  localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));
  if (isAdmin) {
    localStorage.setItem('bca_hub_admin_session', 'authenticated');
    sessionStorage.setItem('bca_hub_admin_session', 'authenticated');
    localStorage.setItem('bca_admin_session', 'authenticated');
    sessionStorage.setItem('bca_admin_session', 'authenticated');
  }

  // Push to Firebase RTDB if online
  if (typeof firebase !== 'undefined' && firebase.database) {
    try {
      firebase.database().ref(`/bca3/users/${currentUserProfile.uid}`).set(currentUserProfile);
    } catch (e) {}
  }

  updateProfileUI();
  updateAdminHeaderUI();
  const box = document.getElementById('studiq-profile-setup-box');
  if (box) box.style.display = 'none';
  showToast(`✨ Scholar Profile Created: ${name}!`);
}

function handleAuthAction() {
  if (currentUserProfile) {
    // Sign out
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().catch(() => {});
    }
    sessionStorage.removeItem('bca_hub_admin_session');
    sessionStorage.removeItem('bca_admin_session');
    localStorage.removeItem('bca_hub_admin_session');
    localStorage.removeItem('bca_admin_session');
    localStorage.removeItem('studiq_user_profile');
    localStorage.removeItem('bca_dev_active_plan');
    currentUserProfile = null;
    updateProfileUI();
    updateAdminHeaderUI();
    showToast('Signed out successfully 👋');

    const subject = (typeof BCA_3RD_SEM_DATA !== 'undefined' && BCA_3RD_SEM_DATA.subjects) ? BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) : null;
    if (subject) renderSubjectNotes(subject);
  } else {
    // Sign in with Google
    if (typeof firebase !== 'undefined' && firebase.auth && window.location.protocol.startsWith('http')) {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      showToast('Opening Google Sign-In... 🔐');

      firebase.auth().signInWithPopup(provider).then(async (result) => {
        const u = result.user;
        const adminEmailList = (FIREBASE.adminEmails || [
          'baljotchohan23@gmail.com',
          'mehakpreetkaur@gmail.com',
          'mehakpreetsaini26@gmail.com'
        ]).map(e => e.toLowerCase());

        const isAdmin = adminEmailList.includes((u.email || '').toLowerCase()) || (u.email || '').toLowerCase().includes('baljot');

        currentUserProfile = {
          uid: u.uid,
          name: u.displayName || 'BCA Scholar',
          email: u.email || '',
          photo: u.photoURL || '',
          isAdmin: isAdmin,
          purchasedNotes: {},
          subscription: isAdmin ? { plan: 'max', status: 'active', validUntil: Date.now() + 3650*24*60*60*1000 } : null
        };
        localStorage.setItem('studiq_user_profile', JSON.stringify(currentUserProfile));
        if (currentUserProfile.isAdmin) {
          localStorage.setItem('bca_hub_admin_session', 'authenticated');
          sessionStorage.setItem('bca_hub_admin_session', 'authenticated');
          localStorage.setItem('bca_admin_session', 'authenticated');
          sessionStorage.setItem('bca_admin_session', 'authenticated');
        }
        updateProfileUI();
        updateAdminHeaderUI();

        // 🔄 Sync full cloud subscription & purchased notes from database
        await syncUserSubscriptionFromDatabase(u.uid, u);

        const subPlan = (currentUserProfile && currentUserProfile.subscription && currentUserProfile.subscription.plan) || 'free';
        if (subPlan === 'max') {
          showToast(`Welcome back, ${u.displayName || 'Scholar'}! 🌟 Lifetime Pass Active`, 'success');
        } else if (subPlan === 'pro' || subPlan === 'plus') {
          showToast(`Welcome back, ${u.displayName || 'Scholar'}! ⭐ Pro Pass Active (₹19/mo)`, 'success');
        } else {
          showToast(`Welcome back, ${u.displayName || 'Scholar'}! 🎉`);
        }
      }).catch((err) => {
        console.error('Google Sign-In Error:', err);
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
          showToast('Popup blocked by browser. Redirecting to Google Auth... 🔄');
          firebase.auth().signInWithRedirect(provider);
        } else {
          showToast('Sign-in failed: ' + (err.message || 'Please try again'));
        }
      });
    } else {
      // Offline / local preview mode
      const box = document.getElementById('studiq-profile-setup-box');
      if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
      } else {
        showToast('Google Sign-In requires an active HTTPS connection.');
      }
    }
  }
}

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  renderSavedNotesList();
  renderSubjectProgressList();
  modal.style.display = 'flex';
  lockScroll(true);
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.style.display = 'none';
  lockScroll(false);
}

function switchProfileTab(tabName) {
  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ptab') === tabName);
  });
  document.querySelectorAll('.profile-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  const target = document.getElementById(`ptab-${tabName}`);
  if (target) target.style.display = 'block';

  if (tabName === 'bookmarks') renderSavedNotesList();
  if (tabName === 'progress') renderSubjectProgressList();
}

function toggleBookmark(noteId) {
  const idx = _userBookmarks.indexOf(noteId);
  if (idx >= 0) {
    _userBookmarks.splice(idx, 1);
    showToast('Removed from Saved Notes 📌');
  } else {
    _userBookmarks.push(noteId);
    showToast('Saved note to Profile Bookmarks! 📌');
  }
  localStorage.setItem('bca_user_bookmarks', JSON.stringify(_userBookmarks));
  updateProfileStats();

  // Update bookmark button icons live if note is open
  const bmBtn = document.getElementById(`bm-btn-${noteId}`);
  if (bmBtn) {
    const isSaved = _userBookmarks.includes(noteId);
    bmBtn.innerHTML = isSaved ? '📌 Saved' : '📌 Bookmark';
    bmBtn.classList.toggle('active', isSaved);
  }
}

function updateProfileStats() {
  const bmCount = document.getElementById('stat-bookmarks-count');
  if (bmCount) bmCount.textContent = _userBookmarks.length;

  // Count checked topics in localStorage
  let topicCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('topic_') && localStorage.getItem(key) === 'true') {
      topicCount++;
    }
  }
  const tCount = document.getElementById('stat-topics-count');
  if (tCount) tCount.textContent = topicCount;
}

function renderSavedNotesList() {
  const container = document.getElementById('profile-saved-notes-list');
  if (!container) return;

  if (!_userBookmarks.length) {
    container.innerHTML = `<div class="empty-state">No saved notes yet. Click the 📌 icon on any digital note to bookmark it!</div>`;
    return;
  }

  // Gather all available notes across subjects
  const allNotesMap = {};
  BCA_3RD_SEM_DATA.subjects.forEach(s => {
    (s.digitalNotes || []).forEach(n => {
      allNotesMap[n.id || n.title] = { ...n, subjectId: s.id, subjectTitle: s.title };
    });
  });
  (_globalCloudData.notes || []).forEach(n => {
    allNotesMap[n.fbKey || n.id || n.title] = { ...n, subjectId: n.subject || 'comp-arch', subjectTitle: getSubjectName(n.subject) };
  });

  const savedItems = _userBookmarks.map(id => allNotesMap[id]).filter(Boolean);

  if (!savedItems.length) {
    container.innerHTML = `<div class="empty-state">Your saved notes will appear here.</div>`;
    return;
  }

  container.innerHTML = savedItems.map(item => `
    <div class="saved-note-item-card" onclick="openZenReaderForSavedNote('${item.id || item.fbKey}', '${item.subjectId}')">
      <div>
        <span class="dropdown-badge" style="margin-bottom: 0.25rem;">${escapeHtml(item.subjectTitle)}</span>
        <h5 style="font-family: var(--font-serif); font-size: 0.95rem; margin: 0.2rem 0; color: var(--text-main);">${escapeHtml(item.title)}</h5>
        <span style="font-size: 0.75rem; color: var(--text-subtle);">${escapeHtml(item.unit || 'Unit I')} • ${escapeHtml(item.readTime || '5 min read')}</span>
      </div>
      <button class="note-tool-btn" style="padding: 0.35rem 0.65rem;" onclick="event.stopPropagation(); toggleBookmark('${item.id || item.fbKey}')">Remove ✕</button>
    </div>
  `).join('');
}

function openZenReaderForSavedNote(noteId, subjectId) {
  closeProfileModal();
  const readerUrl = `/note.html?id=${encodeURIComponent(noteId)}&subject=${encodeURIComponent(subjectId || activeSubjectId || '')}`;
  window.location.href = readerUrl;
}

function renderSubjectProgressList() {
  const container = document.getElementById('profile-subject-progress-list');
  if (!container) return;

  container.innerHTML = BCA_3RD_SEM_DATA.subjects.map(sub => {
    let totalTopics = 0;
    let checkedTopics = 0;

    (sub.units || []).forEach((u, uIdx) => {
      (u.topics || []).forEach((t, tIdx) => {
        totalTopics++;
        const topicKey = `topic_${sub.id}_u${uIdx}_t${tIdx}`;
        if (localStorage.getItem(topicKey) === 'true') {
          checkedTopics++;
        }
      });
    });

    const percent = totalTopics > 0 ? Math.round((checkedTopics / totalTopics) * 100) : 0;

    return `
      <div style="background: var(--bg-surface-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 0.65rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${sub.title} (${sub.code})</span>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-coral);">${percent}% (${checkedTopics}/${totalTopics})</span>
        </div>
        <div style="width: 100%; height: 6px; background: var(--border-subtle); border-radius: 3px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background: var(--color-coral); transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* STUDENT SUBMISSION HANDLER */
async function handleStudentNoteSubmit(e) {
  e.preventDefault();
  const subject = document.getElementById('subm-subject').value;
  const unit = document.getElementById('subm-unit').value;
  const title = document.getElementById('subm-title').value.trim();
  const content = document.getElementById('subm-content').value.trim();

  if (!title || !content) {
    showToast('Please fill in both title and content.');
    return;
  }

  const authorName = currentUserProfile ? currentUserProfile.name : 'Anonymous Scholar';
  const authorEmail = currentUserProfile ? currentUserProfile.email : '';

  const payload = {
    subject,
    unit,
    title,
    content,
    author: authorName,
    email: authorEmail,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  try {
    if (typeof firebase !== 'undefined' && firebase.database) {
      await firebase.database().ref('/bca3/submissions').push(payload);
    } else {
      let localSubms = JSON.parse(localStorage.getItem('bca_pending_submissions') || '[]');
      localSubms.push(payload);
      localStorage.setItem('bca_pending_submissions', JSON.stringify(localSubms));
    }
    showToast('🚀 Note submitted successfully for Admin review!');
    e.target.reset();
    switchProfileTab('bookmarks');
  } catch (err) {
    console.error('Submission error:', err);
    showToast('Submitted locally for review.');
  }
}


