/**
 * OAuth 2.0 Authorization Endpoint — BCA III Hub
 * GET /api/authorize
 *
 * Renders a Google Sign-In page. After sign-in, stores the Firebase ID token
 * as a short-lived auth code in Firebase RTDB, then redirects back to the
 * MCP client (Claude / Cursor / ChatGPT) with ?code=<shortCode>&state=<state>
 */

const https = require('https');

const FIREBASE_DB = 'https://bca2nd-5c622-default-rtdb.firebaseio.com';
const ADMIN_EMAILS = ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { redirect_uri = '', state = '', client_id = '' } = req.query || {};

  const safeRedirect = encodeURIComponent(redirect_uri);
  const safeState = encodeURIComponent(state);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BCA III Hub — Sign In</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0d0d1a;
      color: #e8e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: #13131f;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .logo-ring {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e1e3a, #111128);
      border: 2px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
    }
    h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.4rem; }
    .sub { font-size: 0.85rem; color: #888; margin-bottom: 0.25rem; }
    .university { font-size: 0.78rem; color: #555; margin-bottom: 2rem; }
    .google-btn {
      display: flex; align-items: center; justify-content: center; gap: 0.7rem;
      width: 100%; padding: 0.85rem 1.25rem;
      background: #fff; color: #1a1a1a;
      border: none; border-radius: 12px;
      font-size: 0.92rem; font-weight: 600; font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .google-btn:hover { background: #f5f5f5; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
    .google-btn:active { transform: translateY(0); }
    .google-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .status {
      margin-top: 1.25rem;
      font-size: 0.82rem;
      color: #666;
      min-height: 1.2em;
      transition: color 0.2s;
    }
    .status.success { color: #22c55e; }
    .status.error   { color: #ef4444; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 1.5rem 0; }
    .note { font-size: 0.76rem; color: #444; line-height: 1.5; }
    .admin-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.25);
      border-radius: 99px;
      font-size: 0.72rem;
      color: #22c55e;
      margin-bottom: 1.5rem;
    }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-ring">🎓</div>
    <h1>BCA III Academic Hub</h1>
    <p class="sub">Panjab University, Chandigarh</p>
    <p class="university">BCA 3rd Semester — 2026-27</p>
    <div class="admin-badge">🔐 MCP Authorization Required</div>

    <button class="google-btn" id="signInBtn" onclick="startSignIn()">
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
    <p class="status" id="statusMsg">Sign in to connect to BCA III Hub MCP</p>

    <hr class="divider"/>
    <p class="note">
      Admin accounts (<strong>baljotchohan23@gmail.com</strong> &amp; <strong>mehakpreetkaur@gmail.com</strong>)
      get full write access. All other Google accounts get student read-only access.
    </p>
  </div>

  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script>
    firebase.initializeApp({
      apiKey: "AIzaSyAM8tcsYAnJoLzY6ZUxp6M5h2z-M6AJzDI",
      authDomain: "bca2nd-5c622.firebaseapp.com",
      projectId: "bca2nd-5c622"
    });

    const redirectUri = decodeURIComponent("${safeRedirect}");
    const state = decodeURIComponent("${safeState}");

    function setStatus(msg, type = '') {
      const el = document.getElementById('statusMsg');
      el.textContent = msg;
      el.className = 'status ' + type;
    }

    async function startSignIn() {
      const btn = document.getElementById('signInBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in...';
      setStatus('Opening Google Sign-In...');

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        const idToken = await user.getIdToken(true);

        setStatus('Generating auth code...', '');

        // Exchange ID token for short auth code via our token endpoint
        const resp = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'urn:bca3:firebase_token', id_token: idToken })
        });
        const data = await resp.json();

        if (!data.code) throw new Error('Failed to generate auth code');

        setStatus('✅ Authenticated as ' + user.displayName + '! Redirecting...', 'success');

        // Redirect back to MCP client with auth code
        setTimeout(() => {
          const sep = redirectUri.includes('?') ? '&' : '?';
          window.location.href = redirectUri + sep + 'code=' + encodeURIComponent(data.code) + '&state=' + encodeURIComponent(state);
        }, 800);

      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Try Again';
        setStatus(err.code === 'auth/popup-closed-by-user' ? 'Popup closed. Try again.' : 'Sign-in failed: ' + (err.message || err.code), 'error');
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};
