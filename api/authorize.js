/**
 * OAuth 2.0 Authorization Endpoint — BCA III Hub
 * GET /api/authorize
 *
 * Anthropic-Inspired Warm Obsidian Glass Aesthetic.
 * Mobile-First Google OAuth with Automatic Popup/Redirect fallback.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { redirect_uri = '', state = '', client_id = 'MCP Client' } = req.query || {};

  const safeRedirect = encodeURIComponent(redirect_uri);
  const safeState = encodeURIComponent(state);
  const safeClientId = encodeURIComponent(client_id);
  const displayClient = client_id.toLowerCase().includes('chatgpt') ? 'ChatGPT' 
                      : client_id.toLowerCase().includes('claude') ? 'Claude' 
                      : client_id.toLowerCase().includes('cursor') ? 'Cursor' 
                      : 'AI Assistant';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>BCA III Hub — Authorize ${displayClient}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --bg-dark: #0c0c14;
      --card-bg: rgba(18, 18, 28, 0.85);
      --border-light: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(204, 120, 92, 0.45);
      --terracotta: #cc785c;
      --terracotta-glow: rgba(204, 120, 92, 0.18);
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
      padding: 1.25rem;
      position: relative;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient Warm Glow */
    body::before {
      content: '';
      position: absolute;
      top: -10vh;
      left: 50%;
      transform: translateX(-50%);
      width: 100vw;
      max-width: 900px;
      height: 500px;
      background: radial-gradient(ellipse 60% 50% at 50% 0%, var(--terracotta-glow), transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      background: var(--card-bg);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid var(--border-light);
      border-radius: 28px;
      padding: 2.75rem 2rem 2.25rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 96px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: border-color 0.3s ease;
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 2rem 1.25rem 1.75rem;
        border-radius: 22px;
      }
      .title {
        font-size: 1.85rem !important;
      }
    }

    /* Top Badging */
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 99px;
      background: rgba(204, 120, 92, 0.1);
      border: 1px solid var(--border-accent);
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--terracotta);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
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

    .logo-container {
      position: relative;
      width: 72px;
      height: 72px;
      margin: 0 auto 1.25rem;
    }

    .logo-ring {
      width: 100%;
      height: 100%;
      border-radius: 22px;
      background: linear-gradient(145deg, #1e1e2d, #141420);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    }

    .title {
      font-family: 'Instrument Serif', Georgia, serif;
      font-size: 2.1rem;
      font-weight: 400;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 0.35rem;
      letter-spacing: -0.01em;
    }

    .subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
      font-weight: 500;
    }

    .university-tag {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .connection-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
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

    /* Primary Buttons */
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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      -webkit-tap-highlight-color: transparent;
    }

    .google-btn:hover {
      background: #f4f4f6;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    }

    .google-btn:active {
      transform: translateY(0);
    }

    .google-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .action-link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.85rem 1.25rem;
      background: linear-gradient(135deg, #cc785c, #e08b6e);
      color: #ffffff;
      text-decoration: none;
      border: none;
      border-radius: 14px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.75rem;
      box-shadow: 0 4px 16px rgba(204, 120, 92, 0.3);
      transition: transform 0.2s ease;
    }

    .action-link-btn:hover {
      transform: translateY(-2px);
    }

    .user-info-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--terracotta);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 0.9rem;
      overflow: hidden;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-meta-name {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text-main);
    }

    .user-meta-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .status-msg {
      margin-top: 1.25rem;
      font-size: 0.82rem;
      color: var(--text-dim);
      min-height: 1.4em;
      transition: color 0.2s ease;
      line-height: 1.4;
    }

    .status-msg.success { color: var(--cactus-green); font-weight: 600; }
    .status-msg.error   { color: #ef4444; font-weight: 600; }

    .divider {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin: 1.5rem 0 1.15rem 0;
    }

    .permissions-note {
      font-size: 0.75rem;
      color: var(--text-dim);
      line-height: 1.5;
      text-align: center;
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
      <span>Model Context Protocol (MCP)</span>
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

    <div id="authArea">
      <button class="google-btn" id="signInBtn" onclick="startSignIn()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>

    <div id="manualRedirectArea" style="display: none;"></div>

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

    const params = new URLSearchParams(window.location.search);
    let serverRedirect = "${safeRedirect}" ? decodeURIComponent("${safeRedirect}") : '';
    let serverState = "${safeState}" ? decodeURIComponent("${safeState}") : '';

    let redirectUri = params.get('redirect_uri') || params.get('redirectUri') || serverRedirect || sessionStorage.getItem('bca_mcp_redirect_uri') || '';
    let state = params.get('state') || serverState || sessionStorage.getItem('bca_mcp_state') || '';

    // Cache parameters for mobile redirect survival
    if (redirectUri) sessionStorage.setItem('bca_mcp_redirect_uri', redirectUri);
    if (state) sessionStorage.setItem('bca_mcp_state', state);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent) || window.innerWidth <= 768;
    let authProcessed = false;

    function setStatus(msg, type = '') {
      const el = document.getElementById('statusMsg');
      if (!el) return;
      el.textContent = msg;
      el.className = 'status-msg ' + type;
    }

    async function handleAuthSuccess(user) {
      if (authProcessed) return;
      authProcessed = true;

      const authArea = document.getElementById('authArea');
      if (authArea) {
        authArea.innerHTML = \`
          <div class="user-info-box">
            <div class="user-avatar">
              \${user.photoURL ? \`<img src="\${user.photoURL}" alt="\${user.displayName || 'User'}"/>\` : (user.displayName ? user.displayName.charAt(0).toUpperCase() : '👤')}
            </div>
            <div style="flex:1; min-width:0; overflow:hidden;">
              <div class="user-meta-name">\${user.displayName || 'BCA Scholar'}</div>
              <div class="user-meta-email" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">\${user.email || ''}</div>
            </div>
          </div>
        \`;
      }

      setStatus('✨ Authenticated as ' + (user.displayName || user.email) + '! Generating grant token...', 'success');

      try {
        const idToken = await user.getIdToken(true);
        const resp = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grant_type: 'urn:bca3:firebase_token', id_token: idToken })
        });
        const data = await resp.json();

        if (!data.code) throw new Error(data.error_description || data.error || 'Failed to generate auth code');

        setStatus('🚀 Authorized! Redirecting to ${displayClient}...', 'success');

        const targetRedirect = redirectUri || sessionStorage.getItem('bca_mcp_redirect_uri') || '';
        const targetState = state || sessionStorage.getItem('bca_mcp_state') || '';

        if (targetRedirect && targetRedirect !== 'undefined' && targetRedirect.length > 5) {
          const sep = targetRedirect.includes('?') ? '&' : '?';
          const finalUrl = targetRedirect + sep + 'code=' + encodeURIComponent(data.code) + (targetState ? '&state=' + encodeURIComponent(targetState) : '');

          // Provide immediate fallback tap button for mobile WebViews that block automatic navigation
          const manualArea = document.getElementById('manualRedirectArea');
          if (manualArea) {
            manualArea.style.display = 'block';
            manualArea.innerHTML = \`
              <a href="\${finalUrl}" class="action-link-btn" id="manualRedirectBtn">
                <span>🚀 Complete Connection to ${displayClient} ➔</span>
              </a>
            \`;
          }

          setTimeout(() => {
            window.location.replace(finalUrl);
          }, 600);
        } else {
          setStatus('✅ Connected successfully! You may now return to ${displayClient}.', 'success');
        }
      } catch (err) {
        console.error('Grant exchange error:', err);
        authProcessed = false;
        setStatus('Grant generation error: ' + (err.message || 'Please try again'), 'error');
        resetSignInButton();
      }
    }

    function resetSignInButton() {
      const authArea = document.getElementById('authArea');
      if (authArea) {
        authArea.innerHTML = \`
          <button class="google-btn" id="signInBtn" onclick="startSignIn()">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Try Again</span>
          </button>
        \`;
      }
    }

    async function startSignIn() {
      const btn = document.getElementById('signInBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span><span>Connecting...</span>';
      }
      setStatus('Connecting to Google...');

      try {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        if (isMobile) {
          // Mobile browsers and in-app webviews perform best with direct redirect
          await firebase.auth().signInWithRedirect(provider);
        } else {
          // Desktop uses popup with instant fallback to redirect
          try {
            const result = await firebase.auth().signInWithPopup(provider);
            if (result && result.user) {
              await handleAuthSuccess(result.user);
            }
          } catch (popupErr) {
            console.warn('Popup blocked or failed, falling back to redirect:', popupErr);
            await firebase.auth().signInWithRedirect(provider);
          }
        }
      } catch (err) {
        console.error('Sign-in error:', err);
        resetSignInButton();
        setStatus(err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled. Tap Try Again.' : 'Error: ' + (err.message || err.code), 'error');
      }
    }

    // 1. Check for return from signInWithRedirect
    firebase.auth().getRedirectResult().then(async (result) => {
      if (result && result.user) {
        await handleAuthSuccess(result.user);
      }
    }).catch(err => {
      console.warn('Redirect result check error:', err);
    });

    // 2. Automatically detect active Google auth session on page load
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user && !authProcessed) {
        await handleAuthSuccess(user);
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
};
