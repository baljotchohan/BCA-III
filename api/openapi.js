/**
 * OpenAPI 3.0.0 Specification for ChatGPT Custom GPT Actions & AI Connectors
 * Official Panjab University BCA 3rd Semester Academic Hub
 * Author: Baljot Chohan
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const host = req.headers.host || 'bca-iii.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';

  res.status(200).json({
    openapi: "3.0.0",
    info: {
      title: "BCA III Academic Hub AI Connector (Panjab University)",
      description: "Official Model Context Protocol (MCP) API allowing ChatGPT, Claude, Gemini, and Antigravity to read and write syllabus topics, digital notes, lecture logs, and tasks authored by Baljot Chohan.",
      version: "2.5.0",
      contact: {
        name: "Baljot Chohan",
        url: "https://bca-iii.vercel.app"
      }
    },
    servers: [{ url: `${proto}://${host}` }],
    paths: {
      "/api/mcp": {
        post: {
          summary: "Execute MCP JSON-RPC 2.0 Request",
          description: "Execute tools including: get_syllabus, get_unit_details, get_digital_notes, search_digital_notes, get_note_by_id, create_and_publish_note, update_digital_note, get_daily_lectures, publish_lecture_log, get_announcements, publish_announcement, add_study_task, get_study_tasks, get_syllabus_structure_for_ai, and get_hub_stats.",
          operationId: "executeMcpTool",
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
                    params: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "get_digital_notes" },
                        arguments: { type: "object" }
                      },
                      required: ["name"]
                    }
                  },
                  required: ["jsonrpc", "method", "params"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "JSON-RPC 2.0 Response with tool result content",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      jsonrpc: { type: "string", example: "2.0" },
                      id: { type: "integer", example: 1 },
                      result: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        },
        get: {
          summary: "Get MCP Server Status & Capabilities",
          description: "Returns health status, protocol version, and list of available tools.",
          operationId: "getMcpStatus",
          responses: {
            "200": {
              description: "Server Status Information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "online" },
                      name: { type: "string" },
                      author: { type: "string", example: "Baljot Chohan" },
                      protocolVersion: { type: "string", example: "2024-11-05" },
                      toolsCount: { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
};
