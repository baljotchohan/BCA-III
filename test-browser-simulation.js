const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('🧪 Simulating Browser Runtime for Real Published Firebase Notes...\n');

// 1. Read files
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const syllabusDataContent = fs.readFileSync(path.join(__dirname, 'syllabus-data.js'), 'utf8');
const paymentContent = fs.readFileSync(path.join(__dirname, 'payment.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const noteHtmlContent = fs.readFileSync(path.join(__dirname, 'note.html'), 'utf8');

// Verify note.html script syntax
const scriptMatches = [...noteHtmlContent.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
scriptMatches.forEach((m, i) => {
  if (m[1].trim()) {
    try {
      new Function(m[1]);
    } catch(e) {
      assert.fail(`note.html Script ${i} syntax error: ${e.message}`);
    }
  }
});
console.log('✅ Verified note.html inline scripts: 0 syntax errors.');

// 2. Setup minimal DOM Mock
class MockElement {
  constructor(tag, id = '') {
    this.tagName = (tag || 'div').toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) { if (force !== undefined) { force ? this.add(c) : this.remove(c); } else { this._classes.has(c) ? this.remove(c) : this.add(c); } },
      contains(c) { return this._classes.has(c); }
    };
    this.style = {};
    this.attributes = {};
    this.innerHTML = '';
    this.innerText = '';
    this.textContent = '';
    this.value = '';
    this.children = [];
    this.offsetWidth = 1000;
  }
  getAttribute(k) { return this.attributes[k] || null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  removeAttribute(k) { delete this.attributes[k]; }
  querySelector(sel) { return null; }
  querySelectorAll(sel) { return []; }
  addEventListener(evt, fn) {}
  focus() {}
  scrollIntoView() {}
}

const elementsById = new Map();
function getOrCreateElem(id, tag = 'div') {
  if (!elementsById.has(id)) {
    elementsById.set(id, new MockElement(tag, id));
  }
  return elementsById.get(id);
}

// Pre-create known elements from index.html
[
  'ws-notes-stream',
  'ws-notes-list-subview',
  'ws-notes-reader-subview',
  'ws-notes-filter-bar',
  'ws-units-list',
  'ws-tab-units',
  'ws-tab-notes',
  'ws-tab-calendar',
  'ws-hero-card',
  'ws-tags-row',
  'ws-breadcrumb-title',
  'ws-code-badge',
  'ws-credit-tag',
  'ws-subject-title',
  'ws-subject-desc',
  'ws-sidebar-subjects',
  'dashboard-view',
  'subject-workspace-view',
  'dash-lectures-grid',
  'dash-announcements-stream',
  'guest-signin-prompt-banner',
  'theme-toggle-btn',
  'content-container',
  'doc-badge',
  'doc-title',
  'doc-subtitle',
  'doc-meta',
  'tb-crumb',
  'ls',
  'topbar',
  'main',
  'reader-footer',
  'lang-group'
].forEach(id => getOrCreateElem(id));

const windowMock = {
  location: { hash: '#/subject/machine-learning', search: '', href: '' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); }
  },
  document: {
    getElementById(id) { return elementsById.get(id) || null; },
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    addEventListener(evt, fn) {
      if (evt === 'DOMContentLoaded') setTimeout(fn, 10);
    },
    body: new MockElement('body'),
    documentElement: new MockElement('html')
  },
  scrollTo() {},
  addEventListener() {},
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  console,
  Date,
  Math,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Promise,
  URLSearchParams: global.URLSearchParams,
  fetch: global.fetch || (() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))
};

windowMock.window = windowMock;
windowMock.document.defaultView = windowMock;

const sandbox = vm.createContext(windowMock);

// 3. Execute scripts in context
vm.runInContext(syllabusDataContent, sandbox);
console.log('✅ syllabus-data.js executed (pure curriculum without synthetic notes).');

vm.runInContext(paymentContent, sandbox);
console.log('✅ payment.js executed.');

vm.runInContext(appContent, sandbox);
console.log('✅ app.js executed.');

// 4. Test Live Firebase Sync with all 17 Real Published Notes
async function testRealNotes() {
  console.log('\n📡 Fetching Live Firebase RTDB notes...');
  const res = await fetch('https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/notes.json');
  const data = await res.json();
  const realNotes = Object.entries(data || {}).map(([k, v]) => ({ ...v, fbKey: k }));
  console.log(`✅ Loaded ${realNotes.length} real published notes from Firebase RTDB.`);
  assert(realNotes.length >= 17, 'Must have at least 17 published notes in Firebase RTDB');

  // Inject real notes into app.js
  vm.runInContext(`_globalCloudData.notes = ${JSON.stringify(realNotes)};`, sandbox);

  // Test Machine Learning (has real notes)
  const mlSubject = sandbox.BCA_3RD_SEM_DATA.subjects.find(s => s.id === 'machine-learning');
  sandbox.renderSubjectNotes(mlSubject);
  const mlContainer = elementsById.get('ws-notes-stream');
  assert(mlContainer.innerHTML.includes('Machine Learning Fundamentals'), 'Must contain ML note 1');
  assert(mlContainer.innerHTML.includes('Linear Regression'), 'Must contain ML note Linear Regression');
  assert(mlContainer.innerHTML.includes('Support Vector Machines'), 'Must contain ML note SVM');
  assert(mlContainer.innerHTML.includes('Artificial Neural Networks'), 'Must contain ML note ANN');
  console.log('✅ Machine Learning workspace: Successfully rendered real notes into cards.');

  // Test Data Structures (has real notes)
  const dsSubject = sandbox.BCA_3RD_SEM_DATA.subjects.find(s => s.id === 'data-structures');
  sandbox.renderSubjectNotes(dsSubject);
  const dsContainer = elementsById.get('ws-notes-stream');
  assert(dsContainer.innerHTML.includes('Basic Concepts: Introduction to Complexity'), 'Must contain DS note');
  console.log('✅ Data Structures workspace: Successfully rendered real published notes into cards.');

  // Test Unpublished subject (e.g., Computer Architecture - 0 notes -> shows clean empty state)
  const caSubject = sandbox.BCA_3RD_SEM_DATA.subjects.find(s => s.id === 'comp-arch');
  sandbox.renderSubjectNotes(caSubject);
  const caContainer = elementsById.get('ws-notes-stream');
  assert(caContainer.innerHTML.includes('No digital notes published yet for Computer Architecture'), 'Must show clean empty state for unpublished subject');
  assert(caContainer.innerHTML.includes('+ Create &amp; Publish Note as Admin'), 'Must have Admin create note button in empty state');
  console.log('✅ Unpublished subjects: Clean empty state with Admin creation button verified.');

  console.log('\n🎉 ALL REAL PUBLISHED NOTES & WORKSPACES VERIFIED 100/100!\n');
}

testRealNotes().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
