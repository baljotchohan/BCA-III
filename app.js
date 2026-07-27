// BCA 3rd Sem Dashboard Logic — PU 2026-27

// State management (with localStorage fallback)
let subjectsData = BCA_3RD_SEM_DATA.subjects;
let todoList = JSON.parse(localStorage.getItem('bca3_todos')) || INITIAL_TODOS;

let activeView = 'dashboard'; // 'dashboard' or 'subject'
let currentSubjectId = null;
let currentTab = 'lectures'; // 'lectures' or 'notes'
let selectedCalendarDate = new Date().toISOString().split('T')[0]; // Default to today 'YYYY-MM-DD'

const _today = new Date();
let calendarViewYear = _today.getFullYear();
let calendarViewMonth = _today.getMonth();
let calendarViewMode = 'month'; // 'month' or 'week'
let weekAnchor = new Date(); // any date within the week currently shown

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  setupEventListeners();
  updateCleanGreetingAndDate();
  renderSidebar();
  renderView();
  renderTodaysAgenda();
  renderMiniCalendar();
  renderTodoList();
  setupSearch();
  setupKeyboardShortcuts();
  initSidebarState();
  updateThemeIcon(savedTheme);
});

// Initialize Lucide Icons
function initLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Sidebar Toggle (Adjustable & Closable — doubles as the mobile drawer)
const MOBILE_BREAKPOINT = '(max-width: 860px)';
function isMobileViewport() {
  return window.matchMedia(MOBILE_BREAKPOINT).matches;
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  syncSidebarBackdrop(isCollapsed);

  // Only persist the preference on desktop — mobile always starts closed
  if (!isMobileViewport()) {
    localStorage.setItem('bca3_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar || sidebar.classList.contains('collapsed')) return;
  sidebar.classList.add('collapsed');
  syncSidebarBackdrop(true);
}

function syncSidebarBackdrop(isCollapsed) {
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) return;
  backdrop.classList.toggle('visible', isMobileViewport() && !isCollapsed);
}

function initSidebarState() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  if (isMobileViewport()) {
    sidebar.classList.add('collapsed'); // drawer always starts closed on mobile
  } else {
    const savedState = localStorage.getItem('bca3_sidebar_collapsed');
    if (savedState === 'true') sidebar.classList.add('collapsed');
  }
  syncSidebarBackdrop(sidebar.classList.contains('collapsed'));

  window.addEventListener('resize', () => {
    syncSidebarBackdrop(sidebar.classList.contains('collapsed'));
  });
}

// Clean Greeting (No progress bar box, no personal name, just clean text on screen)
function updateCleanGreetingAndDate() {
  const now = new Date();
  const hours = now.getHours();
  let greetingText = 'Good Morning';
  let greetingIcon = '☀️';

  if (hours >= 12 && hours < 17) {
    greetingText = 'Good Afternoon';
    greetingIcon = '🌤️';
  } else if (hours >= 17) {
    greetingText = 'Good Evening';
    greetingIcon = '🌙';
  }

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);

  const bannerGreeting = document.getElementById('banner-greeting');
  if (bannerGreeting) {
    bannerGreeting.innerHTML = `${greetingText} ${greetingIcon}`;
  }

  const dateWidget = document.getElementById('current-date-widget');
  if (dateWidget) {
    dateWidget.innerHTML = `<i data-lucide="calendar" style="width:13px; height:13px; color:var(--accent-color);"></i> <span>${formattedDate}</span>`;
  }
}

// Render Sidebar Navigation
function renderSidebar() {
  const subjectNavList = document.getElementById('sidebar-subjects-list');
  if (!subjectNavList) return;

  subjectNavList.innerHTML = subjectsData.map(subject => `
    <div class="nav-item ${currentSubjectId === subject.id && activeView === 'subject' ? 'active' : ''}" onclick="openSubjectFolder('${subject.id}')" title="${subject.title}">
      <i data-lucide="${subject.icon}"></i>
      <span class="nav-text">${subject.title}</span>
    </div>
  `).join('');

  initLucideIcons();
}

// Render Main Active View
function renderView() {
  const dashboardView = document.getElementById('dashboard-view');
  const subjectView = document.getElementById('subject-view');

  if (activeView === 'dashboard') {
    dashboardView.style.display = 'block';
    subjectView.style.display = 'none';
    renderSubjectCards();
    triggerFadeIn(dashboardView);
  } else {
    dashboardView.style.display = 'none';
    subjectView.style.display = 'block';
    renderSubjectFolderDetail();
    triggerFadeIn(subjectView);
  }

  renderSidebar();
}

// Small fade + slide-up on view switch — restarts the CSS animation each time
function triggerFadeIn(el) {
  if (!el) return;
  el.classList.remove('view-enter');
  void el.offsetWidth; // force reflow so the animation replays
  el.classList.add('view-enter');
}

// Render Subject Cards on Dashboard
function renderSubjectCards() {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;

  grid.innerHTML = subjectsData.map(sub => {
    const lectureCount = sub.lectures.length;
    const totalHours = sub.theoryHours || sub.practicalHours || 1;
    const progressPct = Math.min(100, Math.round((lectureCount / totalHours) * 100));

    return `
      <div class="subject-card" onclick="openSubjectFolder('${sub.id}')">
        <div class="subject-top">
          <div class="subject-icon-box" style="background-color: ${sub.accentBg}; color: ${sub.color};">
            <i data-lucide="${sub.icon}"></i>
          </div>
          <span class="subject-badge" style="background-color: ${sub.accentBg}; color: ${sub.color};">${sub.type}</span>
        </div>
        <div>
          <div class="subject-code">${sub.code}</div>
          <h3 class="subject-title">${sub.title}</h3>
          <div class="subject-meta">
            <span><i data-lucide="calendar-days" style="width:12px; height:12px"></i> ${lectureCount} Lecture${lectureCount === 1 ? '' : 's'}</span>
            <span><i data-lucide="award" style="width:12px; height:12px"></i> ${sub.credits} Credits</span>
          </div>
          <div class="subject-progress-track" title="${lectureCount} of ~${totalHours} lectures logged">
            <div class="subject-progress-fill" style="width:${progressPct}%; background-color:${sub.color};"></div>
          </div>
        </div>
        <div class="subject-footer">
          <span class="open-folder-btn">Open Folder <i data-lucide="arrow-right" style="width:13px; height:13px"></i></span>
          <span class="subject-progress-label">${progressPct}%</span>
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

// Render Today's Agenda Widget (pulls today's lectures across every subject)
function renderTodaysAgenda() {
  const container = document.getElementById('agenda-list');
  if (!container) return;

  const todayKey = new Date().toISOString().split('T')[0];
  const todaysLectures = [];

  subjectsData.forEach(sub => {
    (sub.lectures || []).forEach(lec => {
      if (lec.date === todayKey) {
        todaysLectures.push({
          ...lec,
          subjectId: sub.id,
          subjectTitle: sub.title,
          color: sub.color,
          accentBg: sub.accentBg,
          icon: sub.icon
        });
      }
    });
  });

  todaysLectures.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  if (todaysLectures.length === 0) {
    container.innerHTML = `
      <div class="todo-empty">
        <i data-lucide="coffee" style="width:16px; height:16px;"></i>
        <span>No lectures logged for today yet.</span>
      </div>
    `;
    initLucideIcons();
    return;
  }

  container.innerHTML = todaysLectures.map(lec => `
    <div class="agenda-item" onclick="openSubjectFolder('${lec.subjectId}')">
      <div class="agenda-icon" style="background-color:${lec.accentBg}; color:${lec.color};">
        <i data-lucide="${lec.icon}"></i>
      </div>
      <div class="agenda-info">
        <span class="agenda-topic">${lec.topic}</span>
        <span class="agenda-subject">${lec.subjectTitle}</span>
      </div>
      ${lec.time ? `<span class="agenda-time">${lec.time}</span>` : ''}
    </div>
  `).join('');
  initLucideIcons();
}

// Open Subject Folder View
function openSubjectFolder(subjectId) {
  currentSubjectId = subjectId;
  activeView = 'subject';
  currentTab = 'lectures';
  renderView();
  if (isMobileViewport()) closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format a 'YYYY-MM-DD' string as a readable date for lecture log headers
function formatLectureDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// Back to Dashboard
function openDashboard() {
  activeView = 'dashboard';
  currentSubjectId = null;
  renderView();
  if (isMobileViewport()) closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Detailed Subject View
function renderSubjectFolderDetail() {
  const subject = subjectsData.find(s => s.id === currentSubjectId);
  if (!subject) return;

  const folderContainer = document.getElementById('subject-view');

  folderContainer.innerHTML = `
    <div class="folder-header">
      <div class="folder-cover" style="background: linear-gradient(90deg, ${subject.color}, #3b82f6);"></div>
      <div class="breadcrumb">
        <span class="breadcrumb-link" onclick="openDashboard()"><i data-lucide="home" style="width:12px; height:12px"></i> Dashboard</span>
        <span>/</span>
        <span style="font-weight:600; color:var(--text-main);">${subject.code}</span>
      </div>
      <div class="folder-title-row">
        <h2>
          <i data-lucide="${subject.icon}" style="color: ${subject.color}"></i>
          ${subject.title}
        </h2>
        <button class="print-btn" onclick="window.print()" title="Print this subject or save it as a PDF">
          <i data-lucide="printer" style="width:14px; height:14px;"></i> Print / Export
        </button>
      </div>
      <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 14px; max-width: 820px; line-height: 1.5;">${subject.description}</p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12.5px; font-weight: 500; color: var(--text-muted); padding-top: 10px; border-top: 1px solid var(--border-color);">
        <span style="display:flex; align-items:center; gap:5px;"><i data-lucide="file-code" style="width:13px; height:13px; color:var(--accent-color)"></i> Code: ${subject.code}</span>
        <span style="display:flex; align-items:center; gap:5px;"><i data-lucide="tag" style="width:13px; height:13px; color:var(--accent-color)"></i> Type: ${subject.type}</span>
        <span style="display:flex; align-items:center; gap:5px;"><i data-lucide="star" style="width:13px; height:13px; color:var(--accent-color)"></i> Credits: ${subject.credits}</span>
        ${subject.theoryHours ? `<span style="display:flex; align-items:center; gap:5px;"><i data-lucide="book" style="width:13px; height:13px; color:var(--accent-color)"></i> Theory: ${subject.theoryHours} Hrs</span>` : ''}
        ${subject.practicalHours ? `<span style="display:flex; align-items:center; gap:5px;"><i data-lucide="flask-conical" style="width:13px; height:13px; color:var(--accent-color)"></i> Practical: ${subject.practicalHours} Hrs</span>` : ''}
      </div>
    </div>

    <!-- TABS BAR -->
    <div class="folder-tabs">
      <button class="tab-btn ${currentTab === 'lectures' ? 'active' : ''}" onclick="switchTab('lectures')">
        <i data-lucide="calendar-days" style="width:14px; height:14px"></i> Lecture Log${subject.lectures.length > 0 ? ` (${subject.lectures.length})` : ''}
      </button>
      <button class="tab-btn ${currentTab === 'units' ? 'active' : ''}" onclick="switchTab('units')">
        <i data-lucide="list-checks" style="width:14px; height:14px"></i> Syllabus Units${subject.units.length > 0 ? ` (${subject.units.length})` : ''}
      </button>
      <button class="tab-btn ${currentTab === 'notes' ? 'active' : ''}" onclick="switchTab('notes')">
        <i data-lucide="file-text" style="width:14px; height:14px"></i> Official PU Syllabus PDF
      </button>
    </div>

    <!-- TAB CONTENTS -->
    <div id="tab-content">
      ${renderTabContent(subject)}
    </div>
  `;

  initLucideIcons();
}

// Switch Active Folder Tab
function switchTab(tabName) {
  currentTab = tabName;
  renderSubjectFolderDetail();
}

// Render Folder Tab Contents
function renderTabContent(subject) {
  if (currentTab === 'lectures') {
    if (!subject.lectures || subject.lectures.length === 0) {
      return `
        <div class="empty-state">
          <i data-lucide="calendar-clock" style="width:32px; height:32px;"></i>
          <h4>No lectures added yet</h4>
          <p>Once classes start, each lecture's date, time and topic will show up here, grouped by day — click an entry to open its notes or PDF.</p>
        </div>
      `;
    }

    // Group lectures by date
    const grouped = {};
    subject.lectures.forEach(lec => {
      if (!grouped[lec.date]) grouped[lec.date] = [];
      grouped[lec.date].push(lec);
    });
    const sortedDates = Object.keys(grouped).sort();

    return `
      <div class="units-accordion">
        ${sortedDates.map(date => `
          <div class="unit-box">
            <div class="unit-header">
              <span>${formatLectureDate(date)}</span>
              <span style="font-size:11.5px; color:var(--text-muted); font-weight:500;">${grouped[date].length} Lecture${grouped[date].length > 1 ? 's' : ''}</span>
            </div>
            <div>
              ${grouped[date].map(lec => `
                <div class="topic-card" ${lec.fileUrl ? `onclick="window.open('${lec.fileUrl}', '_blank')" style="cursor:pointer;"` : ''}>
                  <div class="topic-card-title">
                    <i data-lucide="book-marked" style="width:15px; height:15px; color:var(--accent-color);"></i>
                    <span>${lec.topic}</span>
                    ${lec.time ? `<span style="margin-left:auto; font-size:11px; font-weight:500; color:var(--text-muted); white-space:nowrap;">${lec.time}</span>` : ''}
                  </div>
                  ${lec.description ? `<div class="topic-body"><p>${lec.description}</p></div>` : ''}
                  ${lec.fileUrl ? `<div class="topic-body" style="color:var(--accent-color); font-weight:600; font-size:12px; display:flex; align-items:center; gap:5px;"><i data-lucide="file-text" style="width:12px; height:12px;"></i> Open PDF / Notes</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (currentTab === 'units') {
    if (!subject.units || subject.units.length === 0) {
      return `
        <div class="empty-state">
          <i data-lucide="file-question" style="width:32px; height:32px;"></i>
          <h4>Not published in the official PU document</h4>
          <p>The syllabus PDF only lists this paper's code and credit split — it doesn't include a unit-wise breakdown. Check the "Official PU Syllabus PDF" tab, or your college notice board, for what's actually covered.</p>
        </div>
      `;
    }

    return `
      <div class="units-accordion">
        ${subject.units.map(unit => `
          <div class="unit-box">
            <div class="unit-header">
              <span>${unit.unitNumber}</span>
              <span style="font-size:11.5px; color:var(--text-muted); font-weight:500;">${unit.topics.length} Topics</span>
            </div>
            <ul class="unit-topic-list">
              ${unit.topics.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
        ${subject.practicals && subject.practicals.length > 0 ? `
          <div class="unit-box">
            <div class="unit-header">
              <span>Practical List</span>
              <span style="font-size:11.5px; color:var(--text-muted); font-weight:500;">${subject.practicals.length} Programs</span>
            </div>
            <ol class="practical-list">
              ${subject.practicals.map(prac => `<li>${prac}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (currentTab === 'notes') {
    return `
      <div class="unit-box" style="padding: 24px;">
        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Official Panjab University Syllabus Reference</h4>
        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
          The exact syllabus for <strong>${subject.title} (${subject.code})</strong> extracted directly from the Panjab University BCA III 2026-27 Syllabi document.
        </p>
        <div style="display: flex; gap: 12px;">
          <a href="./Syllabus.pdf" target="_blank" class="btn-primary" style="text-decoration:none;">
            <i data-lucide="file-text" style="width:14px; height:14px"></i> Open Syllabus.pdf
          </a>
        </div>
      </div>
    `;
  }
}

// Format a Date as a 'YYYY-MM-DD' key
function toDateKey(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Switch between the Month grid and the Week strip
function setCalendarMode(mode) {
  calendarViewMode = mode;
  document.getElementById('cal-mode-month-btn')?.classList.toggle('active', mode === 'month');
  document.getElementById('cal-mode-week-btn')?.classList.toggle('active', mode === 'week');
  document.getElementById('cal-dates-grid').style.display = mode === 'month' ? 'grid' : 'none';
  document.getElementById('cal-week-strip').style.display = mode === 'week' ? 'grid' : 'none';
  renderMiniCalendar();
}

// Step the calendar forward/back — a month at a time in Month mode, a week at a time in Week mode
function stepCalendar(delta) {
  if (calendarViewMode === 'week') {
    weekAnchor = new Date(weekAnchor);
    weekAnchor.setDate(weekAnchor.getDate() + delta * 7);
    renderMiniCalendar();
  } else {
    changeCalendarMonth(delta);
  }
}

// Mini Calendar Widget — dispatches to the active view mode
function renderMiniCalendar() {
  if (calendarViewMode === 'week') {
    renderWeekStrip();
  } else {
    renderMonthGrid();
  }
}

// Month Grid View (Fully Interactive Date Selection + Month Navigation)
function renderMonthGrid() {
  const calHeader = document.getElementById('cal-month-year');
  const calDatesGrid = document.getElementById('cal-dates-grid');
  const calSubhead = document.getElementById('cal-subhead');
  if (!calHeader || !calDatesGrid) return;

  const now = new Date();
  const year = calendarViewYear;
  const month = calendarViewMonth;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  calHeader.innerText = `${monthNames[month]} ${year}`;

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  if (calSubhead) {
    calSubhead.innerHTML = isCurrentMonth
      ? `Click any date`
      : `<span class="cal-today-link" onclick="jumpToToday()">Jump to Today</span>`;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  let html = `
    <div class="cal-day-label">Su</div>
    <div class="cal-day-label">Mo</div>
    <div class="cal-day-label">Tu</div>
    <div class="cal-day-label">We</div>
    <div class="cal-day-label">Th</div>
    <div class="cal-day-label">Fr</div>
    <div class="cal-day-label">Sa</div>
  `;

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = d.toString().padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const dayOfWeek = (firstDayIndex + d - 1) % 7;

    const isToday = isCurrentMonth && d === now.getDate();
    const isSelected = dateKey === selectedCalendarDate;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    html += `<div class="cal-date-num ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}" onclick="selectCalendarDate('${dateKey}')">${d}</div>`;
  }

  calDatesGrid.innerHTML = html;
}

// Week Strip View — 7 days centered on weekAnchor's week
function renderWeekStrip() {
  const calHeader = document.getElementById('cal-month-year');
  const calSubhead = document.getElementById('cal-subhead');
  const weekStrip = document.getElementById('cal-week-strip');
  if (!calHeader || !weekStrip) return;

  const now = new Date();
  const sunday = new Date(weekAnchor);
  sunday.setDate(weekAnchor.getDate() - weekAnchor.getDay());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const start = days[0];
  const end = days[6];
  calHeader.innerText = start.getMonth() === end.getMonth()
    ? `${monthNamesShort[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
    : `${monthNamesShort[start.getMonth()]} ${start.getDate()} – ${monthNamesShort[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

  const isCurrentWeek = days.some(d => d.toDateString() === now.toDateString());
  if (calSubhead) {
    calSubhead.innerHTML = isCurrentWeek
      ? `Click any date`
      : `<span class="cal-today-link" onclick="jumpToToday()">Jump to Today</span>`;
  }

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  weekStrip.innerHTML = days.map((d, i) => {
    const dateKey = toDateKey(d);
    const isToday = d.toDateString() === now.toDateString();
    const isSelected = dateKey === selectedCalendarDate;
    const isWeekend = i === 0 || i === 6;

    return `<div class="cal-week-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}" onclick="selectCalendarDate('${dateKey}')">
      <span class="cal-week-dow">${dayLabels[i]}</span>
      <span class="cal-week-num">${d.getDate()}</span>
    </div>`;
  }).join('');
}

// Step the calendar view forward/back a month without touching the selected date
function changeCalendarMonth(delta) {
  calendarViewMonth += delta;
  if (calendarViewMonth < 0) { calendarViewMonth = 11; calendarViewYear--; }
  if (calendarViewMonth > 11) { calendarViewMonth = 0; calendarViewYear++; }
  renderMiniCalendar();
}

// Snap the calendar view back to the current month/week
function jumpToToday() {
  const now = new Date();
  calendarViewYear = now.getFullYear();
  calendarViewMonth = now.getMonth();
  weekAnchor = new Date();
  renderMiniCalendar();
}

// Select Date on Calendar
function selectCalendarDate(dateKey) {
  selectedCalendarDate = dateKey;
  renderMiniCalendar();
  renderTodoList();

  const dateLabel = document.getElementById('selected-date-label');
  if (dateLabel) {
    const d = new Date(dateKey + 'T00:00:00');
    dateLabel.innerText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Render Working Notion To-Do List with Delete Button
function renderTodoList() {
  const container = document.getElementById('todo-list-container');
  if (!container) return;

  // Filter tasks for selected date (or show all if no tasks for selected date)
  const filteredTodos = todoList.filter(t => t.date === selectedCalendarDate || !t.date);

  if (filteredTodos.length === 0) {
    container.innerHTML = `
      <div class="todo-empty">
        <i data-lucide="check-circle-2" style="width:16px; height:16px;"></i>
        <span>No tasks for this date. Add one above.</span>
      </div>
    `;
    initLucideIcons();
    return;
  }

  container.innerHTML = filteredTodos.map(todo => `
    <div class="todo-item ${todo.completed ? 'completed' : ''}">
      <button class="todo-check-btn" onclick="toggleTodo('${todo.id}')" title="${todo.completed ? 'Mark incomplete' : 'Mark complete'}">
        <i data-lucide="${todo.completed ? 'check-circle-2' : 'circle'}"></i>
      </button>
      <span class="todo-text">${todo.text}</span>
      <button class="todo-delete-btn" onclick="deleteTodo('${todo.id}')" title="Delete Task">
        <i data-lucide="x" style="width:12px; height:12px;"></i>
      </button>
    </div>
  `).join('');
  initLucideIcons();
}

// Toggle Todo Item
function toggleTodo(todoId) {
  todoList = todoList.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
  localStorage.setItem('bca3_todos', JSON.stringify(todoList));
  renderTodoList();
}

// Delete Todo Item (Remove Functionality)
function deleteTodo(todoId) {
  todoList = todoList.filter(t => t.id !== todoId);
  localStorage.setItem('bca3_todos', JSON.stringify(todoList));
  renderTodoList();
}

// Add New Todo Item for Selected Date
function addNewTodo() {
  const input = document.getElementById('new-todo-input');
  if (!input || !input.value.trim()) return;

  const newTodo = {
    id: 'todo-' + Date.now(),
    text: input.value.trim(),
    completed: false,
    date: selectedCalendarDate
  };

  todoList.unshift(newTodo);
  localStorage.setItem('bca3_todos', JSON.stringify(todoList));
  input.value = '';
  renderTodoList();
}

// Setup Global Search
function setupSearch() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !dropdown) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      dropdown.classList.remove('active');
      return;
    }

    const results = [];

    // Search Subjects
    subjectsData.forEach(sub => {
      if (sub.title.toLowerCase().includes(query) || sub.code.toLowerCase().includes(query)) {
        results.push({
          type: 'Subject Folder',
          title: sub.title,
          sub: sub.code,
          action: () => openSubjectFolder(sub.id)
        });
      }

      // Search Lecture Topics
      (sub.lectures || []).forEach(lec => {
        if (lec.topic.toLowerCase().includes(query)) {
          results.push({
            type: `Lecture (${sub.code})`,
            title: lec.topic,
            sub: formatLectureDate(lec.date),
            action: () => openSubjectFolder(sub.id)
          });
        }
      });

      // Search Official Syllabus Units
      (sub.units || []).forEach(unit => {
        const matchedTopic = unit.topics.find(t => t.toLowerCase().includes(query));
        if (matchedTopic) {
          results.push({
            type: `Syllabus (${sub.code}) — ${unit.unitNumber}`,
            title: matchedTopic,
            sub: sub.title,
            action: () => { openSubjectFolder(sub.id); switchTab('units'); }
          });
        }
      });
    });

    if (results.length > 0) {
      dropdown.innerHTML = results.slice(0, 6).map((res, i) => `
        <div class="search-result-item" onclick="triggerSearchResult(${i})">
          <h4>${res.title}</h4>
          <p>${res.type} &bull; ${res.sub}</p>
        </div>
      `).join('');
      dropdown.classList.add('active');
      window._currentSearchResults = results;
    } else {
      dropdown.innerHTML = `<div class="search-result-item"><p>No results found for "${query}"</p></div>`;
      dropdown.classList.add('active');
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

function triggerSearchResult(index) {
  if (window._currentSearchResults && window._currentSearchResults[index]) {
    window._currentSearchResults[index].action();
    document.getElementById('search-results-dropdown').classList.remove('active');
    document.getElementById('global-search-input').value = '';
  }
}

// Toggle Theme (Dark / Light)
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('bca3_theme', newTheme);
  updateThemeIcon(newTheme);
}

// Keep the sidebar toggle icon (moon/sun) in sync with the active theme.
// Lucide replaces the <i data-lucide> tag with an <svg> on render, so the
// icon markup is rebuilt fresh each time rather than mutated in place.
function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" style="width:14px; height:14px;"></i>`;
  initLucideIcons();
}

// Apply Saved Theme (falls back to the OS/browser's light-dark preference on first visit)
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('bca3_theme') || (prefersDark ? 'dark' : 'light');
document.body.setAttribute('data-theme', savedTheme);

// Event Listeners
function setupEventListeners() {
  const newTodoInput = document.getElementById('new-todo-input');
  if (newTodoInput) {
    newTodoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addNewTodo();
    });
  }
}

// Global Keyboard Shortcuts: Cmd/Ctrl+K to search, Esc to close it
function setupKeyboardShortcuts() {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const badge = document.querySelector('.shortcut-badge');
  if (badge) badge.textContent = isMac ? '⌘K' : 'Ctrl K';

  document.addEventListener('keydown', (e) => {
    const searchInput = document.getElementById('global-search-input');
    const dropdown = document.getElementById('search-results-dropdown');

    if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }

    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.blur();
      dropdown?.classList.remove('active');
    }
  });
}
