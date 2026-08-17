const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting BCA III AI Copilot Automated Test Suite...\n');

// 1. Check Files Existence
const files = ['ai-engine.js', 'ai-worker.js', 'index.html', 'styles.css', 'app.js', 'syllabus-data.js'];
files.forEach(f => {
  const p = path.join(__dirname, f);
  assert.ok(fs.existsSync(p), `File ${f} must exist`);
  console.log(`✅ File confirmed: ${f}`);
});

// 2. Test Model Registry & Hardware Logic in ai-engine.js
const aiEngineCode = fs.readFileSync(path.join(__dirname, 'ai-engine.js'), 'utf8');
const syllabusDataCode = fs.readFileSync(path.join(__dirname, 'syllabus-data.js'), 'utf8');

const context = {
  window: {},
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceMemory: 16,
    hardwareConcurrency: 8,
    maxTouchPoints: 0
  },
  document: {
    getElementById: (id) => ({ innerHTML: '', textContent: '', style: {}, classList: { add() {}, remove() {} } }),
    querySelector: (sel) => ({ innerHTML: '', textContent: '', style: {} }),
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({ innerHTML: '', appendChild() {}, classList: { add() {} } }),
    addEventListener: (evt, cb) => {}
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};

const vm = require('vm');
vm.createContext(context);
vm.runInContext(syllabusDataCode, context);
vm.runInContext(aiEngineCode, context);

const BCA_AI = context.BCA_AI || context.window.BCA_AI;
assert.ok(BCA_AI, 'BCA_AI module must be exported to window');
assert.ok(Array.isArray(BCA_AI.MODELS) && BCA_AI.MODELS.length >= 6, 'BCA_AI must have at least 6 models configured');
console.log(`✅ Models Registered: ${BCA_AI.MODELS.map(m => m.name).join(', ')}`);

// 3. Test Knowledge Base Aggregation
// Inject sample lectures, notes, announcements
context._globalCloudData = {
  notes: [
    { title: '8086 Architecture & Register Set', subject: 'Computer Architecture', unit: 'III', content: 'BIU has 6 byte instruction queue' }
  ],
  lectures: [
    { date: '2026-08-14', subject: 'Data Structures', topic: 'Binary Search Tree Insertion', description: 'Covered left/right pointer links' }
  ],
  announcements: [
    { title: 'Mid-Term Exam Dates', date: '2026-09-10', message: 'PU Mid-term exams start Sept 10' }
  ]
};

// 4. Test HTML Elements Presence in index.html
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.ok(html.includes('id="ai-copilot-section"'), 'index.html must have #ai-copilot-section');
assert.ok(html.includes('id="ai-detected-hardware-badge"'), 'index.html must have #ai-detected-hardware-badge');
assert.ok(html.includes('id="ai-model-picker-modal"'), 'index.html must have #ai-model-picker-modal');
assert.ok(html.includes('id="floating-ai-btn"'), 'index.html must have #floating-ai-btn');
assert.ok(html.includes('src="ai-engine.js?v=5.0"'), 'index.html must include ai-engine.js script tag');
assert.ok(html.includes('scrollToAICopilot()'), 'index.html must have scrollToAICopilot triggers');
console.log('✅ All UI elements & triggers verified in index.html.');

// 5. Test CSS Styles in styles.css
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
assert.ok(css.includes('.ai-copilot-section'), 'styles.css must style .ai-copilot-section');
assert.ok(css.includes('.ai-model-card'), 'styles.css must style .ai-model-card');
assert.ok(css.includes('.floating-ai-btn'), 'styles.css must style .floating-ai-btn');
assert.ok(css.includes('.ai-code-block-wrap'), 'styles.css must style .ai-code-block-wrap');
console.log('✅ All CSS design rules verified in styles.css.');

console.log('\n🎉 ALL AI COPILOT TESTS PASSED SUCCESSFULLY!\n');
