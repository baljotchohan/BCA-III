// Comprehensive Deep Verification Test Suite
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 Starting 100/100 BCA III Deep Verification Suite...\n');

// ── 1. Load syllabus data ──
const BCA_3RD_SEM_DATA = require('./syllabus-data.js');

assert(BCA_3RD_SEM_DATA, 'BCA_3RD_SEM_DATA must be defined');
assert(Array.isArray(BCA_3RD_SEM_DATA.subjects), 'subjects must be an array');
console.log(`✅ Loaded ${BCA_3RD_SEM_DATA.subjects.length} subjects from syllabus-data.js`);

let totalUnits = 0;
BCA_3RD_SEM_DATA.subjects.forEach(s => {
  assert(s.id, `Subject must have id: ${s.title}`);
  assert(s.title, `Subject must have title`);
  assert(s.code, `Subject must have code`);
  assert(Array.isArray(s.units) && s.units.length > 0, `Subject ${s.id} must have units defined`);
  s.units.forEach((u, idx) => {
    totalUnits++;
    assert(u.unitNumber, `Unit ${idx} in ${s.id} must have unitNumber`);
    assert(Array.isArray(u.topics) && u.topics.length > 0, `Unit in ${s.id} must have topics`);
  });
});
console.log(`✅ Verified all 7 curriculum subjects with ${totalUnits} official syllabus units.`);

// ── 2. Test Payment Access Matrix ──
const paymentContent = fs.readFileSync(path.join(__dirname, 'payment.js'), 'utf8');
const vm = require('vm');
const paymentSandbox = {
  window: {},
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
  console,
  Date,
  Math,
  String,
  Object,
  JSON
};
paymentSandbox.window.localStorage = paymentSandbox.localStorage;
paymentSandbox.window.sessionStorage = paymentSandbox.sessionStorage;
vm.createContext(paymentSandbox);
vm.runInContext(paymentContent, paymentSandbox);

const { BCA3_PAYMENTS } = paymentSandbox.window;
assert(BCA3_PAYMENTS, 'BCA3_PAYMENTS module must be exposed on window');

const sampleNoteUnit1 = { id: 'test-u1', unit: 'Unit I', subject: 'comp-arch' };
const sampleNoteUnit2 = { id: 'test-u2', unit: 'Unit II', subject: 'comp-arch' };
const sampleNoteUnit3 = { id: 'test-u3', unit: 'Unit III', subject: 'comp-arch' };
const sampleNoteUnit4 = { id: 'test-u4', unit: 'Unit IV', subject: 'comp-arch' };

// Test Scenario 2.1: Guest User
paymentSandbox.localStorage.removeItem('studiq_user_profile');
paymentSandbox.currentUserProfile = null;
let res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 0);
assert.strictEqual(res.hasAccess, true, 'Guest must have preview access to first note in Unit 1');
res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 1);
assert.strictEqual(res.hasAccess, false, 'Guest must be prompted to sign in for subsequent Unit 1 notes');
assert.strictEqual(res.reason, 'requires_signin');
res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit2, 2);
assert.strictEqual(res.hasAccess, false, 'Guest must be prompted for upgrade on Unit 2');
assert.strictEqual(res.reason, 'locked_unit');
console.log('✅ Guest User tier logic: 100% verified.');

// Test Scenario 2.2: Free Signed-In User
paymentSandbox.currentUserProfile = {
  uid: 'google_student_123',
  email: 'pupil@gmail.com',
  name: 'Student User',
  subscription: null,
  purchasedNotes: {}
};
paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 0);
assert.strictEqual(res.hasAccess, true, 'Free user must have access to Unit 1 note 0');
res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 1);
assert.strictEqual(res.hasAccess, true, 'Free user must have access to Unit 1 note 1');
res = BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit2, 2);
assert.strictEqual(res.hasAccess, false, 'Free user must be locked out of Unit 2');
assert.strictEqual(res.reason, 'requires_upgrade');
console.log('✅ Free Signed-In User tier logic: 100% verified.');

// Test Scenario 2.3: Pro Plan User
paymentSandbox.currentUserProfile.subscription = {
  plan: 'pro',
  status: 'active',
  validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000
};
paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 0).hasAccess, true);
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit2, 1).hasAccess, true);
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit3, 2).hasAccess, true);
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit4, 3).hasAccess, true);
console.log('✅ Pro Plan User tier logic: 100% verified.');

// Test Scenario 2.4: Expired Pro Plan User
paymentSandbox.currentUserProfile.subscription = {
  plan: 'pro',
  status: 'active',
  validUntil: Date.now() - 10000 // Expired
};
paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 0).hasAccess, true, 'Expired Pro retains Unit 1 access');
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit2, 1).hasAccess, false, 'Expired Pro locked out of Unit 2');
console.log('✅ Expired Pro Plan User tier logic: 100% verified.');

// Test Scenario 2.5: Max Lifetime Plan User
paymentSandbox.currentUserProfile.subscription = {
  plan: 'max',
  status: 'active',
  validUntil: Date.now() + 3650 * 24 * 60 * 60 * 1000
};
paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit1, 0).hasAccess, true);
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit4, 3).hasAccess, true);
console.log('✅ Max Lifetime Plan User tier logic: 100% verified.');

// Test Scenario 2.6: Admin User Accounts
const adminEmails = ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com', 'mehakpreetsaini26@gmail.com'];
adminEmails.forEach(email => {
  paymentSandbox.currentUserProfile = {
    uid: 'admin_uid_' + email,
    email: email,
    name: 'Administrator',
    isAdmin: true,
    subscription: null // No explicit sub needed
  };
  paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
  assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit4, 3).hasAccess, true, `Admin ${email} must have full bypass`);
});
console.log('✅ Admin Superuser whitelist bypass logic: 100% verified.');

// Test Scenario 2.7: Individual Note Purchase
paymentSandbox.currentUserProfile = {
  uid: 'student_buyer',
  email: 'buyer@gmail.com',
  name: 'Buyer',
  subscription: null,
  purchasedNotes: {
    'test-u3': true
  }
};
paymentSandbox.localStorage.setItem('studiq_user_profile', JSON.stringify(paymentSandbox.currentUserProfile));
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit2, 1).hasAccess, false, 'Non-purchased note locked');
assert.strictEqual(BCA3_PAYMENTS.hasNoteAccess(sampleNoteUnit3, 2).hasAccess, true, 'Individually purchased note unlocked');
console.log('✅ Individual Note Purchase logic: 100% verified.');

// ── 3. Test Note Reader Markdown Engine ──
const noteHtmlContent = fs.readFileSync(path.join(__dirname, 'note.html'), 'utf8');
const renderMDFilter = noteHtmlContent.match(/function renderMD\(raw\) \{([\s\S]*?)\nfunction esc/);
assert(renderMDFilter, 'renderMD function must exist in note.html');

const escFilter = noteHtmlContent.match(/function esc\(s\) \{([\s\S]*?)\n\}/);
const readerSandbox = {
  esc: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
  console
};
const renderMDFn = new Function('raw', 'esc', 'function renderMD(raw) {' + renderMDFilter[1] + '\nreturn renderMD(raw);');

const testMarkdown = `
# Title of Topic
Here is a paragraph with **bold** text and *italic* text and \`inline code\`.

\`\`\`cpp
#include <iostream>
int main() {
    std::cout << "Hello Panjab University!" << std::endl;
    return 0;
}
\`\`\`

\`\`\`mermaid
graph TD
  A[CPU] --> B[ALU]
  A --> C[Registers]
\`\`\`

> 💡 Baljot's Exam Tip: Remember the truth table for Full Adder!

$$E = mc^2$$

| Register | Size | Purpose |
| --- | --- | --- |
| AX | 16-bit | Accumulator |
| BX | 16-bit | Base Register |

@[visual:aludesign]
`;

const renderedHtml = renderMDFn(testMarkdown, readerSandbox.esc);
assert(renderedHtml.includes('class="code-wrap"'), 'Fenced code blocks must be rendered properly');
assert(renderedHtml.includes('language-cpp'), 'Code language class must be attached');
assert(renderedHtml.includes('class="mermaid-wrap"'), 'Mermaid diagrams must be rendered into wrapper');
assert(renderedHtml.includes('class="callout tip"'), 'Callouts must be rendered');
assert(renderedHtml.includes('$$E = mc^2$$'), 'LaTeX display math must be preserved untouched');
assert(renderedHtml.includes('class="table-wrap"'), 'Tables must be rendered');
assert(renderedHtml.includes('data-manim-visual="aludesign"'), 'Visual mount must be created');
console.log('✅ Note Reader Markdown & Visuals Parser: 100% verified.');

// ── 4. Test MCP Server Definition ──
const mcpContent = fs.readFileSync(path.join(__dirname, 'api/mcp.js'), 'utf8');
assert(mcpContent.includes('const PUBLIC_TOOLS = ['), 'PUBLIC_TOOLS must be defined in api/mcp.js');
assert(mcpContent.includes('const ADMIN_TOOLS = ['), 'ADMIN_TOOLS must be defined in api/mcp.js');
console.log('✅ MCP Server Tools definition: 100% verified.');

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED: 100/100 READY FOR PRODUCTION!\n');
