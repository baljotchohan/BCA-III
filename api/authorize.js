/**
 * OAuth 2.0 Authorization Endpoint — BCA III Hub
 * GET /api/authorize
 *
 * Anthropic-Inspired Warm Obsidian Glass Aesthetic.
 * Renders a Google OAuth authorization interface.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { redirect_uri = '', state = '', client_id = 'MCP Client' } = req.query || {};

  const safeRedirect = encodeURIComponent(redirect_uri);
  const safeState = encodeURIComponent(state);
  const displayClient = client_id.toLowerCase().includes('chatgpt') ? 'ChatGPT' 
                      : client_id.toLowerCase().includes('claude') ? 'Claude' 
                      : client_id.toLowerCase().includes('cursor') ? 'Cursor' 
                      : 'AI Assistant';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BCA III Hub — Authorize ${displayClient}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --bg-dark: #0c0c14;
      --card-bg: rgba(18, 18, 28, 0.75);
      --border-light: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(204, 120, 92, 0.35);
      --terracotta: #cc785c;
      --terracotta-glow: rgba(204, 120, 92, 0.15);
      --text-main: #f3f3f8;
      --text-muted: #9494a8;
      --text-dim: #636378;
      --cactus-green: #22c55e;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      overflow-x: hidden;
    }

    /* Ambient Warm Glow Background Effects */
    body::before {
      content: '';
      position: absolute;
      top: -15vh;
      left: 50%;
      transform: translateX(-50%);
      width: 900px;
      height: 500px;
      background: radial-gradient(ellipse 60% 50% at 50% 0%, var(--terracotta-glow), transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    body::after {
      content: '';
      position: absolute;
      bottom: -20vh;
      right: 10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(138, 92, 246, 0.08), transparent 60%);
      pointer-events: none;
      z-index: 0;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      background: var(--card-bg);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border-light);
      border-radius: 28px;
      padding: 3rem 2.25rem 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 96px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: transform 0.3s ease, border-color 0.3s ease;
    }

    .auth-card:hover {
      border-color: var(--border-accent);
    }

    /* Top Brand Badging */
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 99px;
      background: rgba(204, 120, 92, 0.08);
      border: 1px solid var(--border-accent);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--terracotta);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1.75rem;
    }

    .brand-badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--terracotta);
      box-shadow: 0 0 8px var(--terracotta);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Hub Logo Icon Ring */
    .logo-container {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
    }

    .logo-ring {
      width: 100%;
      height: 100%;
      border-radius: 24px;
      background: linear-gradient(145deg, #1e1e2d, #141420);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }

    /* Main Headline Typography (Anthropic Instrument Serif) */
    .title {
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 2.1rem;
      font-weight: 400;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }

    .subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .university-tag {
      font-size: 0.78rem;
      color: var(--text-dim);
      margin-bottom: 2rem;
      font-weight: 500;
    }

    /* Connection Target Box */
    .connection-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .connection-box strong {
      color: var(--text-main);
    }

    /* Premium Google Sign-In Button */
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.95rem 1.5rem;
      background: #ffffff;
      color: #121212;
      border: none;
      border-radius: 16px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .google-btn:hover {
      background: #f4f4f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    }

    .google-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .google-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Status Output */
    .status-msg {
      margin-top: 1.25rem;
      font-size: 0.82rem;
      color: var(--text-dim);
      min-height: 1.4em;
      transition: color 0.2s ease;
    }

    .status-msg.success { color: var(--cactus-green); font-weight: 600; }
    .status-msg.error   { color: #ef4444; font-weight: 600; }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin: 1.75rem 0 1.25rem 0;
    }

    /* Access Permissions Note */
    .permissions-note {
      font-size: 0.78rem;
      color: var(--text-dim);
      line-height: 1.6;
      text-align: center;
    }

    .permissions-note strong {
      color: var(--text-muted);
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #121212;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <div class="auth-card">
    <div class="brand-badge">
      <span class="brand-badge-dot"></span>
      <span>Official Model Context Protocol</span>
    </div>

    <div class="logo-container">
      <div class="logo-ring">🎓</div>
    </div>

    <h1 class="title">BCA III Academic Hub</h1>
    <p class="subtitle">Panjab University, Chandigarh</p>
    <p class="university-tag">BCA 3rd Semester Repository — 2026-27</p>

    <div class="connection-box">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <span>Connecting <strong>${displayClient}</strong> to Hub MCP</span>
    </div>

    <button class="google-btn" id="signInBtn" onclick="startSignIn()">
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>Continue with Google</span>
    </button>

    <p class="status-msg" id="statusMsg">Sign in with Google to authorize session</p>

    <hr class="divider"/>

    <p class="permissions-note">
      Authorized administrator Google accounts unlock live write privileges. Registered students receive read-only academic access.
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
      el.className = 'status-msg ' + type;
    }

    async function startSignIn() {
      const btn = document.getElementById('signInBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span><span>Verifying...</span>';
      setStatus('Opening Google Sign-In...');

      try {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        const idToken = await user.getIdToken(true);

        setStatus('Generating authorization grant...', '');

        const resp = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'urn:bca3:firebase_token', id_token: idToken })
        });
        const data = await resp.json();

        if (!data.code) throw new Error('Failed to generate auth code');

        setStatus('✨ Authenticated as ' + (user.displayName || user.email) + '! Connecting...', 'success');

        setTimeout(() => {
          const sep = redirectUri.includes('?') ? '&' : '?';
          window.location.href = redirectUri + sep + 'code=' + encodeURIComponent(data.code) + '&state=' + encodeURIComponent(state);
        }, 750);

      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg><span>Try Again</span>';
        setStatus(err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled. Try again.' : 'Authentication error: ' + (err.message || err.code), 'error');
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};
