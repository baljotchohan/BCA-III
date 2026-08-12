/**
 * OAuth 2.0 Authorization Server Metadata
 * GET /.well-known/oauth-authorization-server
 *
 * Standard RFC 8414 metadata document. Claude, Cursor, and other MCP clients
 * discover this automatically to initiate the OAuth flow.
 */

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const base = 'https://bca-iii.vercel.app';

  return res.status(200).json({
    issuer: base,
    authorization_endpoint: `${base}/api/authorize`,
    token_endpoint: `${base}/api/token`,
    registration_endpoint: `${base}/api/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'client_credentials', 'urn:bca3:firebase_token'],
    code_challenge_methods_supported: ['S256', 'plain'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    scopes_supported: ['read', 'write', 'admin'],
    service_documentation: `${base}/api/mcp`,
    ui_locales_supported: ['en-IN', 'en'],
    op_tos_uri: `${base}/#/`,
    // MCP-specific
    bca3_hub: {
      name: 'BCA III Academic Hub',
      university: 'Panjab University, Chandigarh',
      semester: 'BCA 3rd Semester (2026-27)',
      mcp_endpoint: `${base}/api/mcp`
    }
  });
};
