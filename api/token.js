/**
 * OAuth 2.0 Token Endpoint — BCA III Hub
 * POST /api/token
 *
 * Handles two grant types:
 *  1. urn:bca3:firebase_token — exchanges a Firebase ID token for a short auth code
 *     (called by the authorize page after Google sign-in)
 *  2. authorization_code — exchanges the short auth code for an access token
 *     (called by Claude / Cursor / ChatGPT)
 *
 * Auth codes are stored in Firebase RTDB and expire after 5 minutes.
 * Access tokens returned ARE the Firebase ID token (verified by mcp.js).
 */

const https = require('https');

const FIREBASE_DB  = 'https://bca2nd-5c622-default-rtdb.firebaseio.com';
const FIREBASE_KEY = 'AIzaSyAM8tcsYAnJoLzY6ZUxp6M5h2z-M6AJzDI';
const ADMIN_EMAILS = ['baljotchohan23@gmail.com', 'mehakpreetkaur@gmail.com'];
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const CODE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

// ── Firebase helpers ──────────────────────────────────────────────────────────

function firebaseRequest(method, path, body) {
  return new Promise((resolve) => {
    const url = `${FIREBASE_DB}${path}.json`;
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
    };
    const req = https.request(url, options, (res) => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    if (data) req.write(data);
    req.end();
  });
}

// ── Verify Firebase ID token via REST API ─────────────────────────────────────

function verifyFirebaseToken(idToken) {
  return new Promise((resolve) => {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_KEY}`;
    const body = JSON.stringify({ idToken });
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let buf = '';
      res.on('data', d => { buf += d; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(buf);
          const user = parsed.users && parsed.users[0];
          resolve(user ? { uid: user.localId, email: user.email, name: user.displayName } : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ── Generate a random short code ──────────────────────────────────────────────

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Main handler ──────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const grantType = body.grant_type || req.query?.grant_type || '';

  // ── GRANT 1: Firebase ID Token → Short Auth Code ────────────────────────────
  // Called by our /api/authorize login page after Google sign-in
  if (grantType === 'urn:bca3:firebase_token') {
    const idToken = body.id_token;
    if (!idToken) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'id_token required' });
    }

    // Verify the Firebase ID token
    const user = await verifyFirebaseToken(idToken);
    if (!user) {
      return res.status(401).json({ error: 'invalid_token', error_description: 'Firebase token verification failed' });
    }

    // Generate short code, store it in Firebase with a TTL
    const code = generateCode();
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    await firebaseRequest('PUT', `/bca3/auth_codes/${code}`, {
      idToken,
      uid: user.uid,
      email: user.email,
      name: user.name || 'BCA Scholar',
      isAdmin,
      createdAt: Date.now(),
      expiresAt: Date.now() + CODE_TTL_MS
    });

    return res.status(200).json({ code });
  }

  // ── GRANT 2: Auth Code → Access Token ───────────────────────────────────────
  // Called by Claude / Cursor / ChatGPT after redirect
  if (grantType === 'authorization_code') {
    const code = body.code || req.query?.code || '';
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'code required' });
    }

    // Look up the code in Firebase
    const record = await firebaseRequest('GET', `/bca3/auth_codes/${code}`, null);

    if (!record || !record.idToken) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Auth code not found or expired. Please sign in again.' });
    }

    // Check TTL
    if (Date.now() > record.expiresAt) {
      // Clean up expired code
      await firebaseRequest('DELETE', `/bca3/auth_codes/${code}`, null);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Auth code expired. Please sign in again.' });
    }

    // Delete code (single use)
    await firebaseRequest('DELETE', `/bca3/auth_codes/${code}`, null);

    const isAdmin = ADMIN_EMAILS.includes(record.email);

    return res.status(200).json({
      access_token: record.idToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: isAdmin ? 'admin read write' : 'read',
      user_email: record.email,
      user_name: record.name,
      is_admin: isAdmin
    });
  }

  // ── GRANT 3: ADMIN_SECRET passthrough (for Cursor / Claude Desktop config) ──
  if (grantType === 'client_credentials') {
    const secret = body.client_secret || (req.headers['authorization'] || '').replace(/^Basic\s+/i, '');
    if (ADMIN_SECRET && secret === ADMIN_SECRET) {
      return res.status(200).json({
        access_token: ADMIN_SECRET,
        token_type: 'Bearer',
        expires_in: 315360000, // 10 years
        scope: 'admin read write',
        is_admin: true
      });
    }
    return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  }

  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: `Supported: authorization_code, urn:bca3:firebase_token, client_credentials`
  });
};
