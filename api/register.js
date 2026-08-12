/**
 * OAuth 2.0 Dynamic Client Registration Endpoint (RFC 7591)
 * POST /api/register
 *
 * Allows MCP clients like ChatGPT and Claude to automatically register themselves
 * and receive a client_id dynamically without manual user configuration.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const clientName = body.client_name || 'MCP Client';
  const redirectUris = body.redirect_uris || [];

  const crypto = require('crypto');
  const clientId = `bca3_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const clientSecret = `bca3_sec_${crypto.randomBytes(8).toString('hex')}`;

  return res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0, // Never expires
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code', 'refresh_token', 'urn:bca3:firebase_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none'
  });
};
