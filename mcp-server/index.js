#!/usr/bin/env node
/**
 * BCA III Hub — Official Model Context Protocol (MCP) Server
 * Supports:
 *   1. Stdio Mode (default): Claude Desktop, Cursor, Gemini CLI, Zed, Antigravity
 *   2. HTTP/SSE Mode (--http or --port=8080): Remote connections & testing
 */

const readline = require('readline');
const http = require('http');
const https = require('https');

// Complete Panjab University BCA 3rd Sem Syllabus Data
const SYLLABUS_INDEX = {
  "comp-arch": {
    code: "BCA-DSC-3(Maj)-301",
    title: "Computer Architecture",
    type: "DSC - Major",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Digital Systems & ALU Design", topics: ["Definition of computer organization & architecture", "Digital Systems block diagram", "Register Transfer Language (RTL), bus and memory transfers", "Arithmetic, logic, and shift microoperations", "4-bit combinational shifter & ALSU Design"] },
      { unit: "Unit II", title: "Basic Computer Organization & Instruction Cycle", topics: ["Stored program organization & Von Neumann architecture", "Instruction code, format, direct/indirect addressing", "Basic computer registers (PC, AR, DR, AC, IR, TR, INPR, OUTR)", "Instruction cycle: Fetch, Decode, Execute, Interrupt cycle", "Assembly language vs machine language"] },
      { unit: "Unit III", title: "8086 Microprocessor & Control Unit", topics: ["Microprogrammed vs Hardwired Control Unit", "8086 Architecture: BIU and EU", "Register organization (AX, BX, CX, DX, SI, DI, BP, SP, IP, CS, DS, SS, ES)", "Memory segmentation & 20-bit physical address calculation", "Pin diagram & minimum/maximum mode of 8086"] },
      { unit: "Unit IV", title: "Memory Hierarchy & I/O Organization", topics: ["Memory hierarchy: Main, Aux, Cache (Hit ratio)", "Associative memory & virtual memory mapping", "Peripheral devices & I/O interface", "Asynchronous data transfer (Strobe, Handshaking)", "Programmed I/O, Interrupt-driven I/O, DMA Controller", "Priority interrupts & IOP"] }
    ]
  },
  "data-structures": {
    code: "BCA-DSC-3(Min)-302",
    title: "Data Structures Using C/C++",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Arrays, Complexity & Stacks", topics: ["Classification of data structures", "Time and space complexity (Big O)", "1D and 2D arrays address calculation", "Stack ADT, push/pop operations", "Infix, Prefix, Postfix conversions", "Recursion & Tower of Hanoi"] },
      { unit: "Unit II", title: "Queues & Linked Lists", topics: ["Queue ADT, circular queue, priority queue, Deque", "Singly linked lists, insertion, deletion, searching", "Doubly and circular linked lists", "Linked list representation of stacks and queues"] },
      { unit: "Unit III", title: "Trees & Binary Search Trees", topics: ["Tree terminology, binary trees", "Tree traversals: Inorder, Preorder, Postorder", "Binary Search Trees (BST): insertion, deletion, search", "AVL trees: balance factor and rotations"] },
      { unit: "Unit IV", title: "Graphs, Sorting & Searching", topics: ["Graph terminology, adjacency matrix and list", "BFS and DFS traversals", "Spanning trees, Prim's and Kruskal's algorithms", "Dijkstra's shortest path", "Searching (Linear, Binary)", "Sorting (Bubble, Selection, Insertion, Merge, Quick, Heap)"] }
    ]
  },
  "numerical-methods": {
    code: "BCA-DSC-3(Min)-303",
    title: "Numerical Methods & Scientific Computing",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Error Analysis & Transcendental Equations", topics: ["Absolute, relative, percentage errors", "Truncation and round-off errors", "Bisection method", "Regula-Falsi method", "Newton-Raphson method (derivation & convergence)", "Secant method"] },
      { unit: "Unit II", title: "Linear Equations & Interpolation", topics: ["Gauss Elimination & Gauss-Jordan methods", "Gauss-Seidel & Jacobi iterative methods", "Newton's Forward and Backward interpolation", "Lagrange's interpolation formula", "Newton's Divided Difference"] },
      { unit: "Unit III", title: "Numerical Differentiation & Integration", topics: ["Numerical differentiation", "Trapezoidal rule", "Simpson's 1/3rd and 3/8th rules", "Weddle's rule"] },
      { unit: "Unit IV", title: "Ordinary Differential Equations", topics: ["Taylor's series method", "Euler's and Modified Euler's methods", "Runge-Kutta 2nd & 4th order (RK-4) methods", "Predictor-Corrector methods (Milne's)"] }
    ]
  },
  "machine-learning": {
    code: "BCA-DSC-3(Min)-304",
    title: "Introduction to Machine Learning",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Foundations of AI & ML", topics: ["Supervised, Unsupervised, Reinforcement Learning", "Machine learning pipeline", "Bias-Variance Tradeoff", "Overfitting, underfitting, L1/L2 regularization"] },
      { unit: "Unit II", title: "Supervised Regression & Classification", topics: ["Linear Regression & Gradient Descent", "Logistic Regression & Sigmoid function", "Decision Trees (ID3, Entropy, Information Gain, Gini)", "Random Forests & Ensemble learning"] },
      { unit: "Unit III", title: "SVM, KNN & Evaluation", topics: ["Support Vector Machines (hyperplanes, kernels)", "K-Nearest Neighbors (KNN)", "Confusion Matrix, Precision, Recall, F1-Score, ROC-AUC", "K-Fold cross-validation"] },
      { unit: "Unit IV", title: "Unsupervised Learning & ANN Intro", topics: ["K-Means clustering & Elbow method", "Hierarchical clustering", "Principal Component Analysis (PCA)", "Artificial Neural Networks (Perceptron, Backpropagation)"] }
    ]
  },
  "english-3": {
    code: "BCA-AEC-305",
    title: "English-3: Professional Communication",
    type: "AEC",
    credits: 2,
    units: [
      { unit: "Unit I", title: "Business Writing & Reports", topics: ["Technical writing principles", "Business letters & Resume", "Project reports"] },
      { unit: "Unit II", title: "Oral Presentation & Interviews", topics: ["Group Discussion (GD)", "Interview techniques", "Technical presentation"] }
    ]
  },
  "web-dev": {
    code: "BCA-MDC-306",
    title: "Web Development & UI Design",
    type: "MDC",
    credits: 3,
    units: [
      { unit: "Unit I", title: "HTML5, Semantic UI & Responsive CSS", topics: ["HTML5 semantic tags", "CSS Flexbox & Grid", "Media Queries & Responsive UI"] },
      { unit: "Unit II", title: "JavaScript ES6+ & DOM APIs", topics: ["ES6 features", "DOM manipulation", "Fetch API & SPA routing"] }
    ]
  },
  "backend-dev": {
    code: "BCA-SEC-307",
    title: "Backend Web Development with Node/Python",
    type: "SEC",
    credits: 2,
    units: [
      { unit: "Unit I", title: "Server Architecture & REST APIs", topics: ["HTTP methods & REST architecture", "Express.js / FastAPI fundamentals", "Routing & Middleware"] },
      { unit: "Unit II", title: "Database Integration & Security", topics: ["NoSQL / Firebase Realtime DB", "JWT & Bearer Auth", "Deployment & Security"] }
    ]
  }
};

const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "get_syllabus",
    description: "Get full Panjab University BCA 3rd Sem syllabus for a specific subject or all subjects.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Subject ID (e.g. comp-arch, data-structures, all)", default: "all" }
      }
    }
  },
  {
    name: "get_unit_details",
    description: "Get specific Unit (Unit I-IV) topics, syllabus breakdown, and key exam focus points for a subject.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Subject ID" },
        unit_number: { type: "string", description: "Unit string (e.g. Unit I, Unit II)" }
      },
      required: ["subject_id", "unit_number"]
    }
  },
  {
    name: "search_digital_notes",
    description: "Search community and lecture notes published live on the BCA III Hub across all subjects.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword" },
        subject_id: { type: "string", description: "Optional subject filter" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_daily_lectures",
    description: "Retrieve lecture log records and classroom notes for a specific date or recent days.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "ISO date (YYYY-MM-DD) or 'latest'", default: "latest" }
      }
    }
  },
  {
    name: "add_study_task",
    description: "Add a study task or homework reminder to the BCA III Hub To-Do tracker.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Task description" },
        priority: { type: "string", enum: ["high", "medium", "low"], default: "medium" },
        subject: { type: "string", default: "general" },
        due: { type: "string", description: "Due date (YYYY-MM-DD)" }
      },
      required: ["text"]
    }
  }
];

const RESOURCES = [
  {
    uri: "bca3://syllabus/all",
    name: "Complete BCA 3rd Sem Syllabus",
    description: "Full PU curriculum breakdown",
    mimeType: "application/json"
  }
];

const PROMPTS = [
  {
    name: "exam_prep",
    description: "Generate an exam preparation blueprint for a BCA 3rd Sem subject unit.",
    arguments: [
      { name: "subject_id", description: "Subject ID", required: true },
      { name: "unit_number", description: "Unit number (e.g. Unit I)", required: true }
    ]
  }
];

function fetchFirebaseData(endpoint) {
  return new Promise((resolve) => {
    const url = `https://bca2nd-5c622-default-rtdb.firebaseio.com/bca3/${endpoint}.json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed) return resolve([]);
          if (typeof parsed === 'object') {
            return resolve(Object.keys(parsed).map(key => ({ id: key, ...parsed[key] })));
          }
          resolve(parsed);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

function pushFirebaseData(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'bca2nd-5c622-default-rtdb.firebaseio.com',
      path: `/bca3/${endpoint}.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.name || 'success');
        } catch (e) {
          resolve('success');
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function handleMcpRpc(payload) {
  const method = payload.method;
  const reqId = payload.id;
  const params = payload.params || {};

  if (method === "ping") {
    return { jsonrpc: "2.0", id: reqId, result: {} };
  }

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: reqId,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: { name: "BCA III Hub MCP Server", version: "2.0.0" }
      }
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id: reqId, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};

    if (name === "get_syllabus") {
      const subId = args.subject_id || "all";
      const data = (subId === "all" || !SYLLABUS_INDEX[subId]) ? SYLLABUS_INDEX : SYLLABUS_INDEX[subId];
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: false
        }
      };
    }

    if (name === "get_unit_details") {
      const sub = SYLLABUS_INDEX[args.subject_id];
      if (!sub) return { jsonrpc: "2.0", id: reqId, result: { content: [{ type: "text", text: "Subject not found" }], isError: true } };
      const unit = sub.units.find(u => u.unit.toLowerCase() === (args.unit_number || "").toLowerCase());
      if (!unit) return { jsonrpc: "2.0", id: reqId, result: { content: [{ type: "text", text: "Unit not found" }], isError: true } };
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: { content: [{ type: "text", text: JSON.stringify(unit, null, 2) }], isError: false }
      };
    }

    if (name === "search_digital_notes") {
      const notes = await fetchFirebaseData('notes');
      const q = (args.query || "").toLowerCase();
      const filtered = notes.filter(n => (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q));
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }], isError: false }
      };
    }

    if (name === "get_daily_lectures") {
      const lectures = await fetchFirebaseData('lectures');
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: { content: [{ type: "text", text: JSON.stringify(lectures.slice(0, 10), null, 2) }], isError: false }
      };
    }

    if (name === "add_study_task") {
      const payload = {
        text: args.text,
        priority: args.priority || "medium",
        subject: args.subject || "general",
        due: args.due || new Date().toISOString().split("T")[0],
        done: false,
        timestamp: Date.now()
      };
      const key = await pushFirebaseData('todos', payload);
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: { content: [{ type: "text", text: `Task added! ID: ${key}` }], isError: false }
      };
    }

    return { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Tool '${name}' not recognized` } };
  }

  if (method === "resources/list") {
    return { jsonrpc: "2.0", id: reqId, result: { resources: RESOURCES } };
  }

  if (method === "resources/read") {
    return {
      jsonrpc: "2.0",
      id: reqId,
      result: { contents: [{ uri: params.uri, mimeType: "application/json", text: JSON.stringify(SYLLABUS_INDEX, null, 2) }] }
    };
  }

  if (method === "prompts/list") {
    return { jsonrpc: "2.0", id: reqId, result: { prompts: PROMPTS } };
  }

  return { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Method '${method}' not supported` } };
}

// Check execution mode
const args = process.argv.slice(2);
const isHttp = args.includes('--http') || args.some(a => a.startsWith('--port='));

if (isHttp) {
  const portArg = args.find(a => a.startsWith('--port='));
  const PORT = portArg ? parseInt(portArg.split('=')[1], 10) : 8080;

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: "online", protocolVersion: PROTOCOL_VERSION, tools: TOOLS.length }));
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const response = await handleMcpRpc(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }));
        }
      });
      return;
    }

    res.writeHead(405);
    res.end();
  });

  server.listen(PORT, () => {
    console.error(`\n🚀 BCA III Hub MCP Server running on http://localhost:${PORT}/mcp`);
    console.error(`📡 Streamable HTTP & JSON-RPC 2.0 active.\n`);
  });
} else {
  // Stdio Mode for Claude Desktop / Cursor
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const payload = JSON.parse(line);
      const response = await handleMcpRpc(payload);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + '\n');
    }
  });
}
