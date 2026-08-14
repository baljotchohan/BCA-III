/**
 * OAuth 2.0 Token Endpoint — BCA III Hub
 * POST /api/token
 *
 * Handles four grant types:
 *  1. urn:bca3:firebase_token — exchanges a Firebase ID token for a short auth code
 *     (called by the authorize page after Google sign-in)
 *  2. authorization_code — exchanges the short auth code for an access token
 *     (called by Claude / Cursor / ChatGPT, supports PKCE RFC 7636)
 *  3. refresh_token — exchanges refresh token for new access token
 *  4. client_credentials — ADMIN_SECRET direct passthrough
 *
 * Auth codes are stored in Firebase RTDB and expire after 5 minutes.
 */

const https = require('https');
const crypto = require('crypto');

const FIREBASE_DB  = 'https://bca2nd-5c622-default-rtdb.firebaseio.com';
const FIREBASE_KEY = 'AIzaSyAM8tcsYAnJoLzY6ZUxp6M5h2z-M6AJzDI';
const ADMIN_EMAILS = [
  'baljotchohan23@gmail.com',
  'mehakpreetkaur@gmail.com',
  'mehakpreetsaini26@gmail.com'
];
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const CODE_TTL_MS  = 5 * 60 * 1000; // 5 minutes

// ── Firebase helpers ──────────────────────────────────────────────────────────

function firebaseRequest(method, path, body) {
  return new Promise((resolve) => {
    const secret = process.env.FIREBASE_DATABASE_SECRET || process.env.ADMIN_SECRET || '';
    const authQuery = secret ? `?auth=${encodeURIComponent(secret)}` : '';
    const url = `${FIREBASE_DB}${path}.json${authQuery}`;
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

function generateCode() {
  return crypto.randomBytes(24).toString('hex');
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

    // Generate short code, store it in Firebase with a TTL and PKCE challenge
    const code = generateCode();
    const isAdmin = ADMIN_EMAILS.includes(user.email);
    await firebaseRequest('PUT', `/bca3/auth_codes/${code}`, {
      idToken,
      uid: user.uid,
      email: user.email,
      name: user.name || 'BCA Scholar',
      isAdmin,
      codeChallenge: body.code_challenge || null,
      codeChallengeMethod: body.code_challenge_method || 'S256',
      redirectUri: body.redirect_uri || null,
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

    // PKCE verification if challenge was set
    if (record.codeChallenge) {
      const verifier = body.code_verifier || req.query?.code_verifier || '';
      if (!verifier) {
        return res.status(400).json({ error: 'invalid_request', error_description: 'code_verifier required for PKCE' });
      }
      let calculatedChallenge = verifier;
      if (record.codeChallengeMethod === 'S256') {
        calculatedChallenge = crypto.createHash('sha256').update(verifier).digest('base64url');
      }
      if (calculatedChallenge !== record.codeChallenge) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      }
    }

    // Delete code (single use)
    await firebaseRequest('DELETE', `/bca3/auth_codes/${code}`, null);

    const isAdmin = ADMIN_EMAILS.includes(record.email);

    // Create long-lived persistent session token & refresh token (1 year TTL)
    const sessionToken = 'mcp_sk_' + crypto.randomBytes(32).toString('hex');
    const refreshToken  = 'mcp_rf_' + crypto.randomBytes(32).toString('hex');
    const ONE_YEAR_MS   = 365 * 24 * 60 * 60 * 1000;
    const expiresAt     = Date.now() + ONE_YEAR_MS;

    await firebaseRequest('PUT', `/bca3/session_tokens/${sessionToken}`, {
      uid: record.uid,
      email: record.email,
      name: record.name || 'BCA Scholar',
      isAdmin,
      idToken: record.idToken,
      createdAt: Date.now(),
      expiresAt
    });

    await firebaseRequest('PUT', `/bca3/refresh_tokens/${refreshToken}`, {
      sessionToken,
      uid: record.uid,
      email: record.email,
      name: record.name || 'BCA Scholar',
      isAdmin,
      createdAt: Date.now(),
      expiresAt
    });

    return res.status(200).json({
      access_token: sessionToken,
      token_type: 'Bearer',
      expires_in: 31536000, // 1 year in seconds
      refresh_token: refreshToken,
      scope: isAdmin ? 'admin read write' : 'read',
      user_email: record.email,
      user_name: record.name || 'BCA Scholar',
      is_admin: isAdmin
    });
  }

  // ── GRANT 3: Refresh Token → New Access Token ──────────────────────────────
  if (grantType === 'refresh_token') {
    const refreshToken = body.refresh_token || req.query?.refresh_token || '';
    if (!refreshToken) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token required' });
    }

    const record = await firebaseRequest('GET', `/bca3/refresh_tokens/${refreshToken}`, null);
    if (!record || !record.email) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Refresh token invalid or expired. Please sign in again.' });
    }

    if (Date.now() > record.expiresAt) {
      await firebaseRequest('DELETE', `/bca3/refresh_tokens/${refreshToken}`, null);
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Refresh token expired. Please sign in again.' });
    }

    const newSessionToken = 'mcp_sk_' + crypto.randomBytes(32).toString('hex');
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + ONE_YEAR_MS;

    await firebaseRequest('PUT', `/bca3/session_tokens/${newSessionToken}`, {
      uid: record.uid,
      email: record.email,
      name: record.name,
      isAdmin: record.isAdmin,
      createdAt: Date.now(),
      expiresAt
    });

    await firebaseRequest('PUT', `/bca3/refresh_tokens/${refreshToken}`, {
      ...record,
      sessionToken: newSessionToken,
      updatedAt: Date.now()
    });

    return res.status(200).json({
      access_token: newSessionToken,
      token_type: 'Bearer',
      expires_in: 31536000,
      refresh_token: refreshToken,
      scope: record.isAdmin ? 'admin read write' : 'read'
    });
  }

  // ── GRANT 4: ADMIN_SECRET passthrough (for Cursor / Claude Desktop config) ──
  if (grantType === 'client_credentials') {
    let secret = body.client_secret;
    if (!secret && req.headers['authorization']) {
      const authHeader = req.headers['authorization'].trim();
      if (authHeader.startsWith('Basic ')) {
        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
        const parts = credentials.split(':');
        secret = parts.length > 1 ? parts[1] : parts[0];
      } else if (authHeader.startsWith('Bearer ')) {
        secret = authHeader.slice(7);
      }
    }
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
    error_description: `Supported: authorization_code, refresh_token, urn:bca3:firebase_token, client_credentials`
  });
};
