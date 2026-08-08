/**
 * BCA 3 Hub — Panjab University 2026-27 Study Dashboard Controller
 * Full SPA Routing (Dedicated Subject Workspaces), Notion-Style Digital Notes Repository,
 * Interactive Calendar Switcher and Integrated In-App Admin Portal.
 */

let activeSubjectId = 'comp-arch';
let activeWorkspaceTab = 'units';
let selectedCalendarDate = '2026-08-08';
let currentNoteFilter = 'all';
let _editingItem = null; // { type: 'note'|'lecture'|'announcement', fbKey, collection }

const ADMIN_PASSKEY = 'Defenderbhabhiontop';
const ADMIN_SESSION_KEY = 'bca_admin_inapp_session';
const FIREBASE_DB = 'https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3';

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGreeting();
  initHashRouter();
  initDashboardWidgets();
  initFilterPills();
  initCommandPalette();
  initMobileDrawer();
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
   4. NOTION-STYLE DIGITAL NOTES REPOSITORY
   ========================================================================== */

async function renderSubjectNotes(subject) {
  const container = document.getElementById('ws-notes-stream');
  if (!container) return;

  // Fetch both built-in notes, local custom notes, and live Firebase AI notes
  let fbLectures = await _fbFetch('lectures');
  fbLectures = fbLectures.filter(l => (l.subject === subject.id || l.subjectId === subject.id));
  
  const localNotes = getCustomNotesForSubject(subject.id);
  // Map Firebase lectures to note format so they render properly
  const fbNotes = fbLectures.map(l => ({
    id: l.id || l.fbKey,
    fbKey: l.fbKey,
    unit: l.unit || 'General',
    title: l.title || l.topic || 'Untitled Note',
    content: l.content || l.notes || l.description || '',
    date: l.date,
    readTime: l.readTime || '6 min read',
    tags: l.tags || ['Study Guide'],
    imageUrl: l.imageUrl || '',
    isAdminPublished: true
  }));

  const allNotes = [...(subject.digitalNotes || []), ...localNotes, ...fbNotes];

  if (!allNotes.length) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-subtle);">
        <p style="font-size: 1rem; margin-bottom: 1rem;">No digital notes published yet for ${escapeHtml(subject.title)}.</p>
        <button class="admin-submit-btn" style="display: inline-flex; width: auto; padding: 0.6rem 1.25rem;" onclick="openAdminModal()">
          <span>+ Create Note as Admin</span>
        </button>
      </div>
    `;
    return;
  }

  let filtered = allNotes;
  if (currentNoteFilter && currentNoteFilter !== 'all') {
    filtered = allNotes.filter(n => n.unit === currentNoteFilter);
  }

  container.innerHTML = filtered.map(note => {
    const deleteAction = note.fbKey
      ? `deleteNoteLive('${note.fbKey}', event)`
      : `deleteCustomNote('${note.id}')`;

    return `
      <div class="digital-note-card">
        <div class="note-card-meta">
          <div class="note-meta-left">
            <span class="note-unit-badge">${escapeHtml(note.unit || 'General')}</span>
            <span class="note-read-time">⏱️ ${escapeHtml(note.readTime || '6 min read')}</span>
            ${note.isAdminPublished ? '<span class="note-unit-badge" style="background-color: var(--color-cactus); color: var(--text-main);">Verified Note</span>' : ''}
          </div>
          <div class="note-actions-bar">
            <button class="note-tool-btn" onclick="${deleteAction}" title="Delete Note" style="color: #d44f4f;">
              <span>🗑️ Delete</span>
            </button>
            <button class="note-tool-btn" onclick="copyNoteContent('${note.id}')" title="Copy note text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
            <button class="note-tool-btn" onclick="openZenReaderWithNote('${note.id}')" title="Focus view">
              <span>Focus ↗</span>
            </button>
          </div>
        </div>

        <h2 class="note-card-title">${escapeHtml(note.title)}</h2>

        <div class="note-content-body" id="note-body-${note.id}">
          ${renderMarkdownBlocks(note.content)}
        </div>

        ${note.tags && note.tags.length ? `
          <div class="topic-tags-row" style="margin-top: 1.25rem;">
            ${note.tags.map(t => `<span class="topic-badge">#${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
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

  // 2. Code blocks (support ```lang or '''lang or ``` with trailing spaces)
  html = html.replace(/(?:```|''')([a-zA-Z0-9_\-\+]+)?[ \t]*\n([\s\S]*?)(?:```|''')/g, (match, lang, code) => {
    const cleanCode = escapeHtml(code.trim());
    const language = lang ? lang.trim() : 'DIAGRAM / CODE';
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

  // 3. LaTeX / Math formulas
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (m, math) => `<div class="math-display-block" style="background: var(--bg-surface-subtle); padding: 0.85rem 1.25rem; border-radius: 8px; font-family: var(--font-serif); font-size: 1.15rem; text-align: center; margin: 1.25rem 0; border: 1px solid var(--border-color); color: var(--text-main); font-style: italic;">${escapeHtml(math.trim())}</div>`);
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (m, math) => `<div class="math-display-block" style="background: var(--bg-surface-subtle); padding: 0.85rem 1.25rem; border-radius: 8px; font-family: var(--font-serif); font-size: 1.15rem; text-align: center; margin: 1.25rem 0; border: 1px solid var(--border-color); color: var(--text-main); font-style: italic;">${escapeHtml(math.trim())}</div>`);
  html = html.replace(/\$([^\$\n]+)\$/g, (m, math) => `<span class="math-inline" style="font-family: var(--font-serif); font-style: italic; background: var(--color-oat); padding: 0.1rem 0.35rem; border-radius: 4px; color: var(--color-coral); font-size: 1.02em;">${escapeHtml(math)}</span>`);
  html = html.replace(/\\\(([^\)\n]+)\\\)/g, (m, math) => `<span class="math-inline" style="font-family: var(--font-serif); font-style: italic; background: var(--color-oat); padding: 0.1rem 0.35rem; border-radius: 4px; color: var(--color-coral); font-size: 1.02em;">${escapeHtml(math)}</span>`);

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

  // 6. Headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; font-weight: 600; margin: 1.25rem 0 0.4rem 0;">$1</h3>');
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

  const localNotes = getCustomNotesForSubject(subject.id);
  const allNotes = [...(subject.digitalNotes || []), ...localNotes];

  let md = `# ${subject.title} (${subject.code})\n\n`;
  md += `Panjab University BCA 3rd Semester — ${subject.type} (${subject.credits} Credits)\n\n---\n\n`;

  allNotes.forEach(n => {
    md += `## ${n.title}\nUnit: ${n.unit} | Date: ${n.date || 'Aug 2026'}\n\n`;
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
    return Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    return [];
  }
}

async function deleteNoteLive(fbKey, e) {
  if (e) e.stopPropagation();
  if (!fbKey) return;
  if (!confirm('Are you sure you want to permanently delete this item?')) return;

  showToast('⏳ Removing item from cloud...');
  try {
    const res = await fetch(`${FIREBASE_DB}/lectures/${fbKey}.json`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showToast('🗑️ Item deleted successfully from cloud!');
    renderDashboardLectures();
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId) || BCA_3RD_SEM_DATA.subjects[0];
    if (subject) {
      renderSubjectCalendar(subject);
      renderSubjectNotes(subject);
    }
  } catch (err) {
    showToast('❌ Deletion failed: ' + err.message);
  }
}

async function deleteFirebaseItem(collection, fbKey, e) {
  if (e) e.stopPropagation();
  if (!fbKey) return;
  if (!confirm('Are you sure you want to permanently delete this item?')) return;

  showToast('⏳ Removing item from cloud...');
  try {
    // Delete from primary collection
    await fetch(`${FIREBASE_DB}/${collection}/${fbKey}.json`, { method: 'DELETE' });
    // Also cleanup from secondary collection in case of legacy mapping
    if (collection === 'notes') {
      await fetch(`${FIREBASE_DB}/lectures/${fbKey}.json`, { method: 'DELETE' });
    } else if (collection === 'lectures') {
      await fetch(`${FIREBASE_DB}/notes/${fbKey}.json`, { method: 'DELETE' });
    }

    // Clean local cache
    let locNotes = getCustomNotes().filter(n => (n.fbKey !== fbKey && n.id !== fbKey));
    localStorage.setItem('bca3_custom_notes', JSON.stringify(locNotes));

    let locLecs = getCustomLectures().filter(l => (l.fbKey !== fbKey && l.id !== fbKey));
    localStorage.setItem('bca3_custom_lectures', JSON.stringify(locLecs));

    let locAnns = getStoredAnnouncements().filter(a => (a.fbKey !== fbKey && a.id !== fbKey));
    localStorage.setItem('bca3_announcements_cache', JSON.stringify(locAnns));

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
  fbLectures = fbLectures.filter(l => l.subject === subject.id);

  const localLectures = getCustomLecturesForSubject(subject.id);
  const allLectures = [...fbLectures, ...(subject.lectures || []), ...localLectures];

  // Map of active dates
  const lectureDateMap = {};
  allLectures.forEach(l => {
    lectureDateMap[l.date] = l;
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
    descEl.innerText = lecture.description || 'Core topics covered during class session.';
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
        ${l.fbKey ? `
          <div style="margin-top: 1rem;">
            <button onclick="deleteNoteLive('${l.fbKey}', event)" title="Delete AI Note Live" style="background: rgba(212, 79, 79, 0.15); color: #d44f4f; border: 1px solid rgba(212, 79, 79, 0.35); border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer;">
              🗑️ Delete this Note
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

  // Fetch live lectures from Firebase
  let fbLectures = await _fbFetch('lectures');

  // Gather static lectures
  let staticLectures = [];
  BCA_3RD_SEM_DATA.subjects.forEach(s => {
    (s.lectures || []).forEach(l => staticLectures.push({ ...l, subjectName: s.title, subjectId: s.id }));
  });

  const all = [...fbLectures.map(l => ({ ...l, subjectName: getSubjectName(l.subject), subjectId: l.subject })), ...staticLectures];

  const badge = document.getElementById('lecture-count-badge');
  if (badge) badge.innerText = `${all.length} Notes/Lectures`;

  if (!all.length) {
    container.innerHTML = `<div class="empty-state">No lectures or notes recorded yet.</div>`;
    return;
  }

  container.innerHTML = all.slice(0, 8).map(l => `
    <div class="lecture-item" onclick="navigateToSubject('${l.subjectId}')" style="cursor: pointer; position: relative;">
      <div class="lecture-date-box">
        <span class="lecture-month">AUG</span>
        <span class="lecture-day">${l.date ? l.date.split('-')[2] || '01' : '01'}</span>
      </div>
      <div class="lecture-info" style="flex: 1; min-width: 0;">
        <div class="lecture-topic-title">${escapeHtml(l.topic)}</div>
        <div class="lecture-meta-row">
          <span class="lecture-subject-badge">${escapeHtml(l.subjectName || l.subject)}</span>
          <span>⏱️ ${l.time || '10:00 AM'}</span>
          <span>${l.unit || ''}</span>
        </div>
      </div>
      ${l.fbKey ? `
        <button onclick="deleteNoteLive('${l.fbKey}', event)" title="Delete Note Live" style="background: rgba(212, 79, 79, 0.15); color: #d44f4f; border: 1px solid rgba(212, 79, 79, 0.35); border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; flex-shrink: 0; align-self: center;">
          🗑️ Delete
        </button>
      ` : ''}
    </div>
  `).join('');
}

function renderDashboardTodos() {
  const container = document.getElementById('dashboard-todos-list');
  const badge = document.getElementById('todo-progress-badge');
  if (!container) return;

  const todos = getStoredTodos();
  const doneCount = todos.filter(t => t.done).length;
  if (badge) badge.innerText = `${doneCount}/${todos.length} Done`;

  if (!todos.length) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-subtle); padding: 0.75rem 0;">No active study tasks. Add a study target above.</p>`;
    return;
  }

  container.innerHTML = todos.map(t => `
    <div class="todo-item-row ${t.done ? 'done' : ''}">
      <input type="checkbox" class="todo-checkbox" ${t.done ? 'checked' : ''} onchange="toggleTodo(${t.id})" id="todo-cb-${t.id}">
      <label for="todo-cb-${t.id}" class="todo-label-text">${escapeHtml(t.text)}</label>
      <button class="todo-del-btn" onclick="deleteTodo(${t.id})" title="Delete Task">✕</button>
    </div>
  `).join('');
}

function addNewTodo() {
  const input = document.getElementById('new-todo-input');
  if (!input || !input.value.trim()) return;

  const todos = getStoredTodos();
  const newTodo = {
    id: Date.now(),
    text: input.value.trim(),
    subject: 'General Study',
    done: false,
    date: new Date().toISOString().split('T')[0]
  };
  todos.push(newTodo);
  localStorage.setItem('bca3_todos_data', JSON.stringify(todos));
  input.value = '';
  renderDashboardTodos();
  showToast('New study target added! 🎯');
}

function toggleTodo(id) {
  const todos = getStoredTodos();
  const target = todos.find(t => t.id === id);
  if (target) {
    target.done = !target.done;
    localStorage.setItem('bca3_todos_data', JSON.stringify(todos));
    renderDashboardTodos();
  }
}

function deleteTodo(id) {
  let todos = getStoredTodos();
  todos = todos.filter(t => t.id !== id);
  localStorage.setItem('bca3_todos_data', JSON.stringify(todos));
  renderDashboardTodos();
  showToast('Study task removed.');
}

function getStoredTodos() {
  const stored = localStorage.getItem('bca3_todos_data');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return (BCA_3RD_SEM_DATA.todos && BCA_3RD_SEM_DATA.todos.length) ? BCA_3RD_SEM_DATA.todos : [];
}

function renderDashboardAnnouncements() {
  const container = document.getElementById('dashboard-announcements-list');
  if (!container) return;

  const announcements = getStoredAnnouncements();
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
      ${a.link ? `<a href="${a.link}" target="_blank" style="font-size: 0.75rem; color: var(--color-coral); text-decoration: none; display: inline-block; margin-top: 0.35rem;">↗ View Resource</a>` : ''}
    </div>
  `).join('');
}

function getStoredAnnouncements() {
  const stored = localStorage.getItem('bca3_announcements_cache');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

/* ==========================================================================
   7. INTEGRATED IN-APP ADMIN PORTAL
   ========================================================================== */

function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  const authScreen = document.getElementById('admin-auth-screen');
  const controlsScreen = document.getElementById('admin-controls-screen');
  const badge = document.getElementById('admin-status-badge');

  if (isAuth) {
    authScreen.style.display = 'none';
    controlsScreen.style.display = 'block';
    badge.innerText = '🛡️ Admin Verified';
    badge.style.backgroundColor = 'var(--color-cactus)';
    badge.style.color = 'var(--text-main)';
    switchAdminTab('note');
  } else {
    authScreen.style.display = 'block';
    controlsScreen.style.display = 'none';
    badge.innerText = '🔒 Admin Restricted';
    badge.style.backgroundColor = 'var(--color-oat)';
    badge.style.color = 'var(--color-coral)';
    setTimeout(() => {
      const passInput = document.getElementById('inapp-passkey');
      if (passInput) passInput.focus();
    }, 100);
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
}

function handleInAppAdminLogin(e) {
  e.preventDefault();
  const passkey = document.getElementById('inapp-passkey').value.trim();
  const errEl = document.getElementById('inapp-login-error');

  if (passkey === ADMIN_PASSKEY) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    errEl.style.display = 'none';
    showToast('🛡️ Admin verification successful! Portal unlocked.');
    openAdminModal();
  } else {
    errEl.style.display = 'block';
    document.getElementById('inapp-passkey').value = '';
    document.getElementById('inapp-passkey').focus();
  }
}

function handleInAppAdminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showToast('🔒 Admin signed out successfully.');
  openAdminModal();
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

// 1. Publish Note (supports create + edit)
async function publishAdminNote() {
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
  showToast(isEditing ? '⏳ Updating note...' : '⏳ Publishing note to all students...');

  const noteData = {
    id: isEditing ? _editingItem.id : `custom-note-${Date.now()}`,
    subjectId,
    unit,
    title,
    readTime,
    tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : ['Revision'],
    content,
    isAdminPublished: true,
    date: isEditing ? (_editingItem.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    timestamp: isEditing ? (_editingItem.timestamp || Date.now()) : Date.now()
  };

  try {
    if (isEditing && _editingItem.fbKey) {
      // UPDATE existing item in Firebase
      await fetch(`${FIREBASE_DB}/${_editingItem.collection}/${_editingItem.fbKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    } else {
      // CREATE new item
      const existing = getCustomNotes();
      existing.push(noteData);
      localStorage.setItem('bca3_custom_notes', JSON.stringify(existing));
      await fetch(`${FIREBASE_DB}/lectures.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
  }

  // Clear inputs & reset edit state
  document.getElementById('adm-note-title').value = '';
  document.getElementById('adm-note-tags').value = '';
  document.getElementById('adm-note-content').value = '';
  resetEditState('note');

  showToast(isEditing ? '✅ Digital note updated in cloud!' : '✅ Digital note published live to workspace!');
  closeAdminModal();

  if (activeSubjectId === subjectId) {
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId);
    if (subject) renderSubjectNotes(subject);
  }
}

// 2. Publish Lecture Log (supports create + edit)
async function publishAdminLecture() {
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
  showToast(isEditing ? '⏳ Updating lecture...' : '⏳ Publishing lecture log...');

  const lecData = {
    id: isEditing ? _editingItem.id : `custom-lec-${Date.now()}`,
    subjectId,
    unit,
    date,
    time,
    topic,
    description: desc,
    fileUrl: link || 'Syllabus.pdf',
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
      const existing = getCustomLectures();
      existing.push(lecData);
      localStorage.setItem('bca3_custom_lectures', JSON.stringify(existing));
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

  showToast(isEditing ? '✅ Lecture log updated in cloud!' : '✅ Lecture log recorded & calendar updated!');
  closeAdminModal();

  renderDashboardLectures();
  if (activeSubjectId === subjectId) {
    const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === subjectId);
    if (subject) renderSubjectCalendar(subject);
  }
}

// 3. Publish Announcement (supports create + edit)
async function publishAdminAnnouncement() {
  const title = document.getElementById('adm-ann-title').value.trim();
  const category = document.getElementById('adm-ann-category').value;
  const link = document.getElementById('adm-ann-link').value.trim();
  const message = document.getElementById('adm-ann-msg').value.trim();

  if (!title || !message) {
    showToast('❌ Title and message required.');
    return;
  }

  const isEditing = _editingItem && _editingItem.type === 'announcement';
  showToast(isEditing ? '⏳ Updating announcement...' : '⏳ Publishing announcement...');

  const annData = {
    id: isEditing ? _editingItem.id : `custom-ann-${Date.now()}`,
    title,
    category,
    link,
    message,
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
      const existing = getStoredAnnouncements();
      existing.unshift(annData);
      localStorage.setItem('bca3_announcements_cache', JSON.stringify(existing));
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

  showToast(isEditing ? '✅ Announcement updated in cloud!' : '✅ Announcement published to all students!');
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

  const localNotes = getCustomNotes();
  const localLectures = getCustomLectures();

  let html = '';

  // --- NOTES SECTION ---
  const allNotes = [
    ...fbNotes.map(n => ({ ...n, _sourceCol: 'notes' })),
    ...fbLectures.filter(l => l.notes || l.content || l.isAdminPublished).map(n => ({ ...n, _sourceCol: 'lectures' })),
    ...localNotes.filter(n => !fbNotes.some(fb => fb.id === n.id) && !fbLectures.some(fb => fb.id === n.id))
  ];
  html += `<h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">📝 Notes & Study Material <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${allNotes.length}</span></h4>`;

  if (!allNotes.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle); margin-bottom: 1rem;">No published notes yet.</p>`;
  } else {
    html += allNotes.map(n => {
      const col = n._sourceCol || (n.isAdminPublished ? 'lectures' : 'notes');
      const deleteAction = n.fbKey
        ? `deleteFirebaseItem('${col}', '${n.fbKey}', event)`
        : `deleteCustomNote('${n.id}')`;
      const subjectLabel = n.subjectId ? getSubjectName(n.subjectId) || n.subjectId : (n.subject ? getSubjectName(n.subject) || n.subject : 'General');
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem;">
          <div style="min-width: 0; flex: 1; overflow: hidden;">
            <strong style="word-break: break-word;">${escapeHtml(n.title || n.topic || 'Untitled')}</strong>
            <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${escapeHtml(subjectLabel)} · ${n.date || '—'}${n.fbKey ? ' · <span style="color: #2ecc71;">☁️ Firebase</span>' : ' · 💾 Local'}</div>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
            ${n.fbKey ? `<button class="todo-del-btn" onclick="editNoteFromManage('${n.fbKey}', '${col}')" title="Edit" style="color: var(--color-coral);">✏️</button>` : ''}
            <button class="todo-del-btn" onclick="${deleteAction}" title="Delete">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  // --- LECTURES SECTION ---
  const allLectures = [...fbLectures.filter(l => !l.isAdminPublished), ...localLectures.filter(l => !fbLectures.some(fb => fb.id === l.id))];
  html += `<h4 style="font-size: 0.95rem; margin: 1.25rem 0 0.5rem 0; display: flex; align-items: center; gap: 0.4rem;">📅 Lecture Logs <span style="font-size: 0.75rem; background: var(--bg-surface-subtle); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); color: var(--text-subtle);">${allLectures.length}</span></h4>`;

  if (!allLectures.length) {
    html += `<p style="font-size: 0.8125rem; color: var(--text-subtle); margin-bottom: 1rem;">No lecture logs recorded.</p>`;
  } else {
    html += allLectures.map(l => {
      const deleteAction = l.fbKey
        ? `deleteFirebaseItem('lectures', '${l.fbKey}', event)`
        : `deleteCustomLecture('${l.id}')`;
      const subjectLabel = l.subjectId ? getSubjectName(l.subjectId) || l.subjectId : (l.subject ? getSubjectName(l.subject) || l.subject : 'General');
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); margin-bottom: 0.35rem; font-size: 0.85rem;">
          <div style="min-width: 0; flex: 1; overflow: hidden;">
            <strong style="word-break: break-word;">${escapeHtml(l.topic || 'Untitled')}</strong>
            <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${escapeHtml(subjectLabel)} · ${l.date || '—'}${l.fbKey ? ' · <span style="color: #2ecc71;">☁️ Firebase</span>' : ' · 💾 Local'}</div>
          </div>
          <div style="display: flex; gap: 0.35rem; flex-shrink: 0; margin-left: 0.5rem;">
            ${l.fbKey ? `<button class="todo-del-btn" onclick="editLectureFromManage('${l.fbKey}')" title="Edit" style="color: var(--color-coral);">✏️</button>` : ''}
            <button class="todo-del-btn" onclick="${deleteAction}" title="Delete">🗑️</button>
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
          <div style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 0.15rem;">${a.category || 'notice'} · ${a.date || '—'} · <span style="color: #2ecc71;">☁️ Firebase</span></div>
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

// --- EDIT FUNCTIONS (Notion-style inline edit) ---

async function editNoteFromManage(fbKey, collection) {
  const items = await _fbFetch(collection);
  const item = items.find(i => i.fbKey === fbKey);
  if (!item) { showToast('❌ Item not found'); return; }

  _editingItem = { type: 'note', fbKey, collection, id: item.id, date: item.date, timestamp: item.timestamp };

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

  _editingItem = { type: 'lecture', fbKey, id: item.id, date: item.date, timestamp: item.timestamp };

  const subjectEl = document.getElementById('adm-lec-subject');
  const unitEl = document.getElementById('adm-lec-unit');
  if (subjectEl) subjectEl.value = item.subjectId || item.subject || 'comp-arch';
  if (unitEl) unitEl.value = item.unit || 'Unit I';
  document.getElementById('adm-lec-date').value = item.date || '';
  document.getElementById('adm-lec-time').value = item.time || '';
  document.getElementById('adm-lec-topic').value = item.topic || '';
  document.getElementById('adm-lec-desc').value = item.description || '';
  document.getElementById('adm-lec-link').value = item.fileUrl || '';

  switchAdminTab('lecture');
  updateEditBanner('lecture', item.topic || 'Untitled');
  showToast('✏️ Editing lecture — make changes and click Publish to update.');
}

async function editAnnouncementFromManage(fbKey) {
  const items = await _fbFetch('announcements');
  const item = items.find(i => i.fbKey === fbKey);
  if (!item) { showToast('❌ Item not found'); return; }

  _editingItem = { type: 'announcement', fbKey, id: item.id, date: item.date, timestamp: item.timestamp };

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

function deleteCustomNote(noteId) {
  let notes = getCustomNotes().filter(n => n.id !== noteId);
  localStorage.setItem('bca3_custom_notes', JSON.stringify(notes));
  showToast('🗑️ Note deleted.');
  renderAdminManageData();
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectNotes(subject);
}

function deleteCustomLecture(lecId) {
  let lectures = getCustomLectures().filter(l => l.id !== lecId);
  localStorage.setItem('bca3_custom_lectures', JSON.stringify(lectures));
  showToast('🗑️ Lecture deleted.');
  renderAdminManageData();
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (subject) renderSubjectCalendar(subject);
  renderDashboardLectures();
}

function getCustomNotes() {
  const stored = localStorage.getItem('bca3_custom_notes');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

function getCustomNotesForSubject(subjectId) {
  return getCustomNotes().filter(n => n.subjectId === subjectId);
}

function getCustomLectures() {
  const stored = localStorage.getItem('bca3_custom_lectures');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

function getCustomLecturesForSubject(subjectId) {
  return getCustomLectures().filter(l => l.subjectId === subjectId);
}

// Background sync from Firebase Realtime Database
async function syncFirebaseData() {
  try {
    // 1. Sync lectures (notes are stored here too)
    const resLec = await fetch(`${FIREBASE_DB}/lectures.json`);
    if (resLec.ok) {
      const data = await resLec.json();
      if (data) {
        const cloudLecs = Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }));
        localStorage.setItem('bca3_custom_lectures', JSON.stringify(cloudLecs));
      }
    }

    // 2. Sync announcements
    const resAnn = await fetch(`${FIREBASE_DB}/announcements.json`);
    if (resAnn.ok) {
      const data = await resAnn.json();
      if (data) {
        const cloudAnn = Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }));
        localStorage.setItem('bca3_announcements_cache', JSON.stringify(cloudAnn));
        renderDashboardAnnouncements();
      }
    }
  } catch (err) {
    // Fail gracefully with offline cache
  }
}

/* ==========================================================================
   8. FOCUS / ZEN READING MODE
   ========================================================================== */

function openZenReader() {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  if (!subject) return;

  const localNotes = getCustomNotesForSubject(subject.id);
  const allNotes = [...(subject.digitalNotes || []), ...localNotes];

  if (!allNotes.length) {
    showToast('No notes to display in focus reader.');
    return;
  }

  openZenReaderWithNote(allNotes[0].id);
}

function openZenReaderWithNote(noteId) {
  const subject = BCA_3RD_SEM_DATA.subjects.find(s => s.id === activeSubjectId);
  const localNotes = getCustomNotesForSubject(subject.id);
  const allNotes = [...(subject.digitalNotes || []), ...localNotes];
  const note = allNotes.find(n => n.id === noteId) || allNotes[0];

  const modal = document.getElementById('zen-reader-modal');
  const container = document.getElementById('zen-article-content');
  const badge = document.getElementById('zen-badge');

  if (badge) badge.innerText = `${subject.title} • ${note.unit}`;
  if (container) {
    container.innerHTML = `
      <h1 class="serif" style="font-size: 2.25rem; margin-bottom: 0.5rem;">${note.title}</h1>
      <p style="color: var(--text-subtle); margin-bottom: 1.75rem; font-size: 0.9rem;">
        ${subject.code} · ${note.unit} · ${note.readTime || '6 min read'} · Panjab University
      </p>
      <div style="font-size: 1.1rem; line-height: 1.8; color: var(--text-main);">
        ${renderMarkdownBlocks(note.content)}
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';
}

function closeZenReader(e) {
  if (e && e.target && e.target.id !== 'zen-reader-modal' && e.type === 'click') return;
  const modal = document.getElementById('zen-reader-modal');
  if (modal) modal.style.display = 'none';
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
}

function searchPalette(query) {
  const resultsContainer = document.getElementById('palette-results');
  if (!resultsContainer) return;

  const q = query.toLowerCase().trim();
  const results = [];

  // Search subjects
  BCA_3RD_SEM_DATA.subjects.forEach(s => {
    if (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
      results.push({
        type: 'Subject',
        title: s.title,
        subtitle: `${s.code} • ${s.credits} Credits`,
        action: () => { closeCommandPalette(); navigateToSubject(s.id); }
      });
    }

    // Search units & topics
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

    // Search notes
    (s.digitalNotes || []).forEach(n => {
      if (q && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))) {
        results.push({
          type: 'Note',
          title: n.title,
          subtitle: `${s.title} • ${n.unit}`,
          action: () => { closeCommandPalette(); navigateToSubject(s.id); switchWorkspaceTab('notes'); }
        });
      }
    });
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
  }
  function closeDrawer() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
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

