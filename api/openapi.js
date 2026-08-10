/**
 * OpenAPI 3.0.0 Specification for ChatGPT Custom GPT Actions
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const host = req.headers.host || 'bca-iii.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';

  res.status(200).json({
    openapi: "3.0.0",
    info: {
      title: "BCA III Academic Hub AI Connector",
      description: "Official API allowing ChatGPT, Claude, and Gemini to access Panjab University BCA 3rd Sem syllabus, notes, lectures, and tasks.",
      version: "2.0.0"
    },
    servers: [{ url: `${proto}://${host}` }],
    paths: {
      "/api/mcp": {
        post: {
          summary: "Execute MCP JSON-RPC 2.0 Request",
          description: "Supports tools/list, tools/call (get_syllabus, search_digital_notes, get_daily_lectures, add_study_task), resources/read, and prompts/get.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    jsonrpc: { type: "string", example: "2.0" },
                    id: { type: "integer", example: 1 },
                    method: { type: "string", example: "tools/call" },
                    params: { type: "object" }
                  },
                  required: ["jsonrpc", "method"]
                }
              }
            }
          },
          responses: {
            "200": { description: "JSON-RPC 2.0 Response" }
          }
        },
        get: {
          summary: "Get MCP Server Status & Capabilities",
          responses: {
            "200": { description: "Server Status" }
          }
        }
      }
    }
  });
};
