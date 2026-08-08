#!/usr/bin/env node
/**
 * BCA III Hub — Enterprise Multi-AI MCP & REST Server
 * Supports:
 *  1. MCP Stdio Transport (Claude Desktop, Cursor, Antigravity)
 *  2. MCP SSE/HTTP Transport (Claude Web Connectors, OpenWebUI, Remote MCP clients)
 *  3. REST API & OpenAPI 3.0 Spec (ChatGPT Custom GPTs, Zapier, Webhooks)
 * 
 * Firebase Endpoint: https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3
 */

import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const FIREBASE_DB = "https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3";
const PORT = process.env.PORT || 3000;

const SUBJECTS = [
  { id: "comp-arch", name: "Computer Architecture & Organization", code: "BCA-16-301" },
  { id: "java", name: "Object Oriented Programming using Java", code: "BCA-16-302" },
  { id: "dbms", name: "Database Management System", code: "BCA-16-303" },
  { id: "web-dev", name: "Web Designing Front End Technologies", code: "BCA-16-304" },
  { id: "env-sci", name: "Environment, Road Safety & Violence Against Women", code: "BCA-16-305" }
];

// Firebase Helpers
async function fbGet(path) {
  const res = await fetch(`${FIREBASE_DB}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([fbKey, val]) => ({ ...val, fbKey }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function fbPush(path, data) {
  const res = await fetch(`${FIREBASE_DB}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase POST failed: HTTP ${res.status}`);
  const result = await res.json();
  return result.name;
}

async function fbDelete(path, fbKey) {
  const res = await fetch(`${FIREBASE_DB}/${path}/${fbKey}.json`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Firebase DELETE failed: HTTP ${res.status}`);
}

// Instantiate MCP Server Core
function createMcpServer() {
  const mcpServer = new Server(
    { name: "bca3-hub-notes-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_subjects",
        description: "Get list of all BCA 3rd Year subjects and their official codes.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_notes",
        description: "Retrieve study notes and lecture logs from the website database.",
        inputSchema: {
          type: "object",
          properties: {
            subject: { type: "string", description: "Subject ID (comp-arch, java, dbms, web-dev, env-sci)" }
          }
        }
      },
      {
        name: "add_note",
        description: "Create and publish a study note with explanations and optional AI Visual Diagram image URL.",
        inputSchema: {
          type: "object",
          properties: {
            subject: { type: "string", description: "Subject ID" },
            topic: { type: "string", description: "Topic title" },
            unit: { type: "string", description: "Syllabus unit (e.g. Unit 1)" },
            notes: { type: "string", description: "Detailed study content / explanation" },
            imageUrl: { type: "string", description: "Optional URL of an AI-generated visual diagram or infographic image" },
            link: { type: "string", description: "Optional reference URL (PDF, Video, Docs)" },
            date: { type: "string", description: "Date YYYY-MM-DD (defaults to today)" }
          },
          required: ["subject", "topic", "notes"]
        }
      },
      {
        name: "delete_note",
        description: "Delete a study note from the site by Firebase key.",
        inputSchema: {
          type: "object",
          properties: {
            fbKey: { type: "string", description: "Firebase Key of the note" }
          },
          required: ["fbKey"]
        }
      },
      {
        name: "get_todos",
        description: "Get all study tasks and revision items.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "add_todo",
        description: "Add a study task or revision item to the website to-do tracker.",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Task description" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            subject: { type: "string", description: "Related subject ID" },
            due: { type: "string", description: "Due date YYYY-MM-DD" }
          },
          required: ["text"]
        }
      },
      {
        name: "add_announcement",
        description: "Publish a major announcement visible to all students on the website dashboard.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Announcement title" },
            desc: { type: "string", description: "Announcement content" },
            badge: { type: "string", description: "Badge label (NOTICE, EXAM, UPDATE)" },
            link: { type: "string", description: "Optional link URL" }
          },
          required: ["title", "desc"]
        }
      }
    ]
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "list_subjects") {
      return { content: [{ type: "text", text: JSON.stringify(SUBJECTS, null, 2) }] };
    }
    if (name === "get_notes") {
      let list = await fbGet("lectures");
      if (args?.subject) list = list.filter(i => i.subject === args.subject);
      return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
    }
    if (name === "add_note") {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        subject: args.subject,
        topic: args.topic,
        unit: args.unit || "General",
        notes: args.notes,
        imageUrl: args.imageUrl || "",
        link: args.link || "",
        date: args.date || today,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now(),
      };
      const key = await fbPush("lectures", payload);
      return { content: [{ type: "text", text: `✅ Note published successfully to BCA III website! Key: ${key}` }] };
    }
    if (name === "delete_note") {
      await fbDelete("lectures", args.fbKey);
      return { content: [{ type: "text", text: `🗑️ Note (${args.fbKey}) deleted successfully.` }] };
    }
    if (name === "get_todos") {
      const todos = await fbGet("todos");
      return { content: [{ type: "text", text: JSON.stringify(todos, null, 2) }] };
    }
    if (name === "add_todo") {
      const payload = {
        text: args.text,
        priority: args.priority || "medium",
        subject: args.subject || "general",
        due: args.due || new Date().toISOString().split("T")[0],
        done: false,
        timestamp: Date.now(),
      };
      const key = await fbPush("todos", payload);
      return { content: [{ type: "text", text: `✅ Study task added! Task Key: ${key}` }] };
    }
    if (name === "add_announcement") {
      const payload = {
        title: args.title,
        desc: args.desc,
        badge: args.badge || "NOTICE",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        link: args.link || "#",
        timestamp: Date.now(),
      };
      const key = await fbPush("announcements", payload);
      return { content: [{ type: "text", text: `📢 Announcement published! Key: ${key}` }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return mcpServer;
}

// Determine Execution Mode: Stdio vs HTTP Server
const isHttpMode = process.argv.includes("--sse") || process.argv.includes("--http") || process.env.HTTP_MODE === "true";

if (isHttpMode) {
  // --- Professional Express HTTP / SSE Server Mode ---
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Active SSE connections map
  const sseTransports = new Map();

  // Root Status Dashboard
  app.get("/", (req, res) => {
    res.json({
      status: "online",
      server: "BCA III Hub Professional MCP & REST API Server",
      protocolVersion: "2024-11-05",
      endpoints: {
        mcpSseUrl: `http://${req.headers.host}/sse`,
        mcpMessagesUrl: `http://${req.headers.host}/messages`,
        openApiSchemaUrl: `http://${req.headers.host}/openapi.json`,
        healthCheck: `http://${req.headers.host}/health`,
        restNotes: `http://${req.headers.host}/api/notes`,
        restTodos: `http://${req.headers.host}/api/todos`,
      },
      availableSubjects: SUBJECTS,
    });
  });

  app.get("/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));

  // SSE Transport Endpoint for Claude Connectors / Remote MCP Clients
  app.get("/sse", async (req, res) => {
    console.log("🔗 New SSE Connection initialized by AI client");
    const transport = new SSEServerTransport("/messages", res);
    const mcp = createMcpServer();
    const sessionId = transport.sessionId;
    sseTransports.set(sessionId, transport);

    transport.onclose = () => sseTransports.delete(sessionId);
    await mcp.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = sseTransports.get(sessionId);
    if (!transport) {
      return res.status(404).send("Session not found");
    }
    await transport.handlePostMessage(req, res);
  });

  // REST API Endpoints for ChatGPT Custom GPT Actions
  app.get("/api/subjects", (req, res) => res.json({ success: true, subjects: SUBJECTS }));

  app.get("/api/notes", async (req, res) => {
    try {
      let list = await fbGet("lectures");
      if (req.query.subject) list = list.filter(i => i.subject === req.query.subject);
      res.json({ success: true, count: list.length, notes: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const { subject, topic, unit, notes, imageUrl, link, date } = req.body;
      if (!subject || !topic || !notes) {
        return res.status(400).json({ success: false, error: "subject, topic, and notes are required" });
      }
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        subject,
        topic,
        unit: unit || "General",
        notes,
        imageUrl: imageUrl || "",
        link: link || "",
        date: date || today,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now(),
      };
      const key = await fbPush("lectures", payload);
      res.json({ success: true, message: "Note published successfully!", key });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await fbGet("todos");
      res.json({ success: true, todos });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/todos", async (req, res) => {
    try {
      const { text, priority, subject, due } = req.body;
      if (!text) return res.status(400).json({ success: false, error: "text is required" });
      const payload = {
        text,
        priority: priority || "medium",
        subject: subject || "general",
        due: due || new Date().toISOString().split("T")[0],
        done: false,
        timestamp: Date.now(),
      };
      const key = await fbPush("todos", payload);
      res.json({ success: true, message: "Task added successfully", key });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ChatGPT Custom GPT OpenAPI 3.0 Schema
  app.get("/openapi.json", (req, res) => {
    const host = req.headers.host;
    res.json({
      openapi: "3.0.0",
      info: {
        title: "BCA III Hub AI Notes Connector",
        description: "Official API allowing ChatGPT and Claude to manage BCA 3rd Year notes, visuals, and study tasks.",
        version: "1.0.0"
      },
      servers: [{ url: `http://${host}` }],
      paths: {
        "/api/notes": {
          get: {
            summary: "Get notes",
            parameters: [{ name: "subject", in: "query", schema: { type: "string" } }],
            responses: { "200": { description: "Success" } }
          },
          post: {
            summary: "Publish a new note with explanation and visual image",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      subject: { type: "string" },
                      topic: { type: "string" },
                      unit: { type: "string" },
                      notes: { type: "string" },
                      imageUrl: { type: "string" },
                      link: { type: "string" }
                    },
                    required: ["subject", "topic", "notes"]
                  }
                }
              }
            },
            responses: { "200": { description: "Success" } }
          }
        },
        "/api/todos": {
          get: { summary: "Get study tasks", responses: { "200": { description: "Success" } } },
          post: {
            summary: "Add a study task",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      priority: { type: "string" },
                      subject: { type: "string" },
                      due: { type: "string" }
                    },
                    required: ["text"]
                  }
                }
              }
            },
            responses: { "200": { description: "Success" } }
          }
        }
      }
    });
  });

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 BCA III Hub MCP & REST Server Running!`);
    console.log(`📡 SSE MCP Connector:  http://localhost:${PORT}/sse`);
    console.log(`📋 OpenAPI Spec URL:   http://localhost:${PORT}/openapi.json`);
    console.log(`🌐 Server Status:      http://localhost:${PORT}/`);
    console.log(`=================================================\n`);
  });
} else {
  // --- Standard Stdio Transport Mode (Claude Desktop, Cursor, Antigravity) ---
  const mcpServer = createMcpServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}
