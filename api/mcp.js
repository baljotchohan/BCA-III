/**
 * Official Model Context Protocol (MCP) Serverless Endpoint for BCA III Hub
 * Compatible with Claude (Desktop & Web), ChatGPT, Gemini, Cursor & Windsurf.
 * Transport: Streamable HTTP (JSON-RPC 2.0 over HTTP POST & GET)
 * Protocol Version: 2024-11-05
 */

const https = require('https');

// Complete Panjab University BCA 3rd Sem Syllabus Data (Pre-indexed for fast execution)
const SYLLABUS_INDEX = {
  "comp-arch": {
    code: "BCA-DSC-3(Maj)-301",
    title: "Computer Architecture",
    type: "DSC - Major",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Digital Systems & ALU Design", topics: ["Definition of computer organization & architecture", "Digital Systems block diagram", "Register Transfer Language (RTL), bus and memory transfers", "Arithmetic, logic, and shift microoperations", "4-bit combinational shifter & ALSU Design"] },
      { unit: "Unit II", title: "Basic Computer Organization & Instruction Cycle", topics: ["Stored program organization & Von Neumann architecture", "Instruction code, format, direct/indirect addressing", "Basic computer registers (PC, AR, DR, AC, IR, TR, INPR, OUTR)", "Instruction cycle: Fetch, Decode, Execute, Interrupt cycle", "Assembly language vs machine language"] },
      { unit: "Unit III", title: "8086 Microprocessor & Control Unit", topics: ["Microprogrammed vs Hardwired Control Unit", "8086 Architecture: BIU (Bus Interface Unit) and EU (Execution Unit)", "Register organization (AX, BX, CX, DX, SI, DI, BP, SP, IP, CS, DS, SS, ES)", "Memory segmentation & 20-bit physical address calculation", "Pin diagram & minimum/maximum mode of 8086"] },
      { unit: "Unit IV", title: "Memory Hierarchy & I/O Organization", topics: ["Memory hierarchy: Main memory, Aux memory, Cache memory (Hit ratio)", "Associative memory & virtual memory mapping (Paging, TLB)", "Peripheral devices & I/O interface", "Asynchronous data transfer (Strobe control, Handshaking)", "Modes of transfer: Programmed I/O, Interrupt-driven I/O, DMA (Direct Memory Access)", "Priority interrupts (Daisy chaining) & IOP (I/O Processor)"] }
    ]
  },
  "data-structures": {
    code: "BCA-DSC-3(Min)-302",
    title: "Data Structures Using C/C++",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Arrays, Complexity & Stacks", topics: ["Classification of data structures (linear, non-linear)", "Time and space complexity (Big O, Omega, Theta)", "1D and 2D arrays, row-major and column-major address calculation", "Stack ADT, push/pop operations, array representation", "Infix, Prefix, Postfix conversions and evaluations", "Recursion & Tower of Hanoi problem"] },
      { unit: "Unit II", title: "Queues & Linked Lists", topics: ["Queue ADT, linear queue, circular queue, priority queue, Deque", "Singly linked lists, insertion, deletion, searching, traversal", "Doubly linked lists and circular linked lists", "Linked list representation of stacks and queues", "Polynomial representation and addition using linked lists"] },
      { unit: "Unit III", title: "Trees & Binary Search Trees", topics: ["Basic tree terminology: root, parent, child, leaf, depth, height", "Binary trees, properties, full and complete binary trees", "Tree traversals: Inorder, Preorder, Postorder (recursive & non-recursive)", "Binary Search Trees (BST): insertion, deletion, searching", "AVL trees: balance factor and rotations (LL, RR, LR, RL)", "B-trees and B+ trees overview"] },
      { unit: "Unit IV", title: "Graphs, Sorting & Searching", topics: ["Graph terminology, directed/undirected, adjacency matrix and adjacency list", "Graph traversals: BFS (Breadth First Search) and DFS (Depth First Search)", "Spanning trees, Prim's and Kruskal's algorithms", "Dijkstra's shortest path algorithm", "Searching: Linear search, Binary search", "Sorting algorithms: Bubble sort, Selection sort, Insertion sort, Merge sort, Quick sort, Heap sort"] }
    ]
  },
  "numerical-methods": {
    code: "BCA-DSC-3(Min)-303",
    title: "Numerical Methods & Scientific Computing",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Error Analysis & Transcendental Equations", topics: ["Errors in numerical calculations: absolute, relative, percentage errors", "Truncation error, round-off error, propagation of errors", "Bisection method", "Regula-Falsi (False Position) method", "Newton-Raphson method (formula, derivation, rate of convergence)", "Secant method"] },
      { unit: "Unit II", title: "Linear Equations & Interpolation", topics: ["Gauss Elimination method with partial pivoting", "Gauss-Jordan method", "Gauss-Seidel iterative method & Jacobi method", "Finite differences: forward, backward, shift operators", "Newton's Forward and Backward interpolation formulas", "Lagrange's interpolation formula for unequal intervals", "Newton's Divided Difference formula"] },
      { unit: "Unit III", title: "Numerical Differentiation & Integration", topics: ["Numerical differentiation using Newton's forward/backward formulas", "Trapezoidal rule", "Simpson's 1/3rd rule and Simpson's 3/8th rule", "Weddle's rule", "Error terms and geometric interpretation of integration rules"] },
      { unit: "Unit IV", title: "Ordinary Differential Equations (ODEs)", topics: ["Taylor's series method", "Euler's method and Modified Euler's method", "Runge-Kutta 2nd and 4th order (RK-4) methods", "Predictor-Corrector methods: Milne's and Adams-Bashforth methods"] }
    ]
  },
  "machine-learning": {
    code: "BCA-DSC-3(Min)-304",
    title: "Introduction to Machine Learning",
    type: "DSC - Minor",
    credits: 4,
    units: [
      { unit: "Unit I", title: "Foundations of AI & ML", topics: ["Definition and types of learning: Supervised, Unsupervised, Reinforcement Learning", "Machine learning pipeline: data collection, preprocessing, feature engineering, model training, evaluation", "Bias-Variance Tradeoff", "Overfitting and underfitting, regularization (L1 Lasso, L2 Ridge)"] },
      { unit: "Unit II", title: "Supervised Regression & Classification", topics: ["Linear Regression: cost function, gradient descent, multi-variable regression", "Logistic Regression for binary classification: sigmoid function, log loss", "Decision Trees: ID3 algorithm, Entropy, Information Gain, Gini Impurity", "Random Forests and ensemble methods (Bagging and Boosting)"] },
      { unit: "Unit III", title: "SVM, KNN & Model Evaluation", topics: ["Support Vector Machines (SVM): hyperplanes, margin, kernel trick", "K-Nearest Neighbors (KNN) algorithm and distance metrics (Euclidean, Manhattan)", "Evaluation metrics: Confusion Matrix, Accuracy, Precision, Recall, F1-Score, ROC-AUC curve", "Cross-validation techniques (K-Fold cross-validation)"] },
      { unit: "Unit IV", title: "Unsupervised Learning & Neural Networks Intro", topics: ["Clustering: K-Means clustering algorithm, Elbow method", "Hierarchical clustering (Agglomerative and Divisive)", "Dimensionality Reduction: Principal Component Analysis (PCA)", "Introduction to Artificial Neural Networks (ANN): Perceptron, activation functions, backpropagation overview"] }
    ]
  },
  "english-3": {
    code: "BCA-AEC-305",
    title: "English-3: Professional Communication",
    type: "AEC",
    credits: 2,
    units: [
      { unit: "Unit I", title: "Business Writing & Reports", topics: ["Technical writing principles", "Business letter formats", "Resume & Cover Letter preparation", "Technical project report structuring"] },
      { unit: "Unit II", title: "Oral Presentation & Interviews", topics: ["Group Discussion (GD) strategies", "Job interview techniques", "Technical presentation delivery", "Active listening and business etiquette"] }
    ]
  },
  "web-dev": {
    code: "BCA-MDC-306",
    title: "Web Development & UI Design",
    type: "MDC",
    credits: 3,
    units: [
      { unit: "Unit I", title: "HTML5, Semantic UI & Responsive CSS", topics: ["HTML5 semantic tags", "CSS Flexbox and CSS Grid layouts", "Responsive design with Media Queries", "Typography and modern design tokens"] },
      { unit: "Unit II", title: "JavaScript ES6+ & DOM APIs", topics: ["ES6 features (Arrow functions, Destructuring, Promises, Async/Await)", "DOM manipulation & event listeners", "Fetch API & REST JSON consumption", "Single Page Application (SPA) architecture"] }
    ]
  },
  "backend-dev": {
    code: "BCA-SEC-307",
    title: "Backend Web Development with Node/Python",
    type: "SEC",
    credits: 2,
    units: [
      { unit: "Unit I", title: "Server Architecture & REST APIs", topics: ["Client-Server architecture and HTTP methods (GET, POST, PUT, DELETE)", "Express.js / FastAPI fundamentals", "Routing, middleware, and request/response lifecycles", "JSON Schema validation"] },
      { unit: "Unit II", title: "Database Integration & Security", topics: ["Relational vs NoSQL databases", "CRUD operations with Firebase Realtime Database and MongoDB", "JWT authentication & Bearer tokens", "CORS handling, rate limiting, and API deployment"] }
    ]
  }
};

const PROTOCOL_VERSION = "2024-11-05";

// Tool Registry Definition
const TOOLS = [
  {
    name: "get_syllabus",
    description: "Get full Panjab University BCA 3rd Sem syllabus for a specific subject or all subjects.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Subject ID: 'comp-arch', 'data-structures', 'numerical-methods', 'machine-learning', 'english-3', 'web-dev', 'backend-dev', or 'all'",
          default: "all"
        }
      }
    }
  },
  {
    name: "get_unit_details",
    description: "Get specific Unit (Unit I to IV) topics, syllabus breakdown, and key exam focus points for a subject.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Subject ID (e.g. 'comp-arch', 'data-structures', 'numerical-methods', 'machine-learning')"
        },
        unit_number: {
          type: "string",
          description: "Unit string: 'Unit I', 'Unit II', 'Unit III', or 'Unit IV'"
        }
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
        query: {
          type: "string",
          description: "Search keyword or topic, e.g. 'pipeline', 'Newton Raphson', 'stack', '8086'"
        },
        subject_id: {
          type: "string",
          description: "Optional subject filter ID"
        }
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
        date: {
          type: "string",
          description: "ISO date format (YYYY-MM-DD), e.g. '2026-08-08' or 'latest'",
          default: "latest"
        }
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
        due: { type: "string", description: "Due date in YYYY-MM-DD format" }
      },
      required: ["text"]
    }
  },
  {
    name: "get_announcements",
    description: "Fetch live Panjab University and BCA 3rd Semester academic notices and announcements.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Maximum notices to return", default: 5 }
      }
    }
  }
];

// Resources Registry Definition
const RESOURCES = [
  {
    uri: "bca3://syllabus/all",
    name: "Complete BCA 3rd Sem Syllabus (PU 2026-27)",
    description: "Structured curriculum for all 7 DSC, AEC, MDC, and SEC courses.",
    mimeType: "application/json"
  },
  {
    uri: "bca3://notes/latest",
    name: "Latest Published Academic Notes",
    description: "Live real-time lecture and digital study notes from the BCA III repository.",
    mimeType: "application/json"
  }
];

// Prompts Registry Definition
const PROMPTS = [
  {
    name: "exam_preparation_guide",
    description: "Generate a targeted exam preparation and revision guide for a specific BCA 3rd semester unit.",
    arguments: [
      { name: "subject_id", description: "Subject ID (e.g. comp-arch)", required: true },
      { name: "unit_number", description: "Unit number (e.g. Unit I)", required: true }
    ]
  },
  {
    name: "generate_lecture_summary",
    description: "Synthesize lecture notes and generate key formula sheets and practice questions.",
    arguments: [
      { name: "topic", description: "Topic name", required: true }
    ]
  }
];

// Helper: Fetch JSON from Firebase RTDB
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

// Helper: Post JSON to Firebase RTDB
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

// Main MCP Dispatcher
async function handleMcpRpc(payload) {
  const method = payload.method;
  const reqId = payload.id;
  const params = payload.params || {};

  // 1. Ping
  if (method === "ping") {
    return { jsonrpc: "2.0", id: reqId, result: {} };
  }

  // 2. Initialize
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: reqId,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
          logging: {}
        },
        serverInfo: {
          name: "BCA III Academic Hub MCP Server",
          version: "2.0.0"
        },
        instructions: (
          "BCA III Hub MCP Server provides real-time access to official Panjab University " +
          "BCA 3rd Semester syllabi (Comp Arch, Data Structures, Numerical Methods, ML, English, Web Dev), " +
          "live lecture notes, daily classroom logs, and study tasks. Use get_syllabus or get_unit_details " +
          "to fetch accurate syllabus breakdowns for exam preparation and answering student questions."
        )
      }
    };
  }

  // 3. Tools
  if (method === "tools/list") {
    return { jsonrpc: "2.0", id: reqId, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};

    if (name === "get_syllabus") {
      const subId = args.subject_id || "all";
      if (subId === "all" || !SYLLABUS_INDEX[subId]) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{
              type: "text",
              text: JSON.stringify({
                university: "Panjab University, Chandigarh",
                semester: "BCA 3rd Semester (2026-27 Batch)",
                subjects: SYLLABUS_INDEX
              }, null, 2)
            }],
            isError: false
          }
        };
      }
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify(SYLLABUS_INDEX[subId], null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "get_unit_details") {
      const sub = SYLLABUS_INDEX[args.subject_id];
      if (!sub) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{ type: "text", text: `Subject '${args.subject_id}' not found. Available: ${Object.keys(SYLLABUS_INDEX).join(", ")}` }],
            isError: true
          }
        };
      }
      const unit = sub.units.find(u => u.unit.toLowerCase() === (args.unit_number || "").toLowerCase());
      if (!unit) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{ type: "text", text: `Unit '${args.unit_number}' not found in ${sub.title}. Available: ${sub.units.map(u => u.unit).join(", ")}` }],
            isError: true
          }
        };
      }
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({
              subject: sub.title,
              code: sub.code,
              unit: unit.unit,
              title: unit.title,
              topics: unit.topics
            }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "search_digital_notes") {
      const query = (args.query || "").toLowerCase();
      const notes = await fetchFirebaseData('notes');
      const filtered = notes.filter(n => {
        const matchesQuery = (n.title || "").toLowerCase().includes(query) ||
                             (n.content || "").toLowerCase().includes(query) ||
                             (n.topic || "").toLowerCase().includes(query);
        const matchesSub = !args.subject_id || n.subject === args.subject_id;
        return matchesQuery && matchesSub;
      });

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: filtered.length > 0
              ? JSON.stringify({ count: filtered.length, results: filtered }, null, 2)
              : `No digital notes found matching '${args.query}'.`
          }],
          isError: false
        }
      };
    }

    if (name === "get_daily_lectures") {
      const lectures = await fetchFirebaseData('lectures');
      let result = lectures;
      if (args.date && args.date !== "latest") {
        result = lectures.filter(l => l.date === args.date);
      }
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({ count: result.length, lectures: result.slice(0, 10) }, null, 2)
          }],
          isError: false
        }
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
        result: {
          content: [{ type: "text", text: `✅ Study task added to BCA III Hub! Task ID: ${key}` }],
          isError: false
        }
      };
    }

    if (name === "get_announcements") {
      const announcements = await fetchFirebaseData('announcements');
      const limit = args.limit || 5;
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify(announcements.slice(0, limit), null, 2)
          }],
          isError: false
        }
      };
    }

    return {
      jsonrpc: "2.0",
      id: reqId,
      error: { code: -32601, message: `Tool '${name}' not recognized` }
    };
  }

  // 4. Resources
  if (method === "resources/list") {
    return { jsonrpc: "2.0", id: reqId, result: { resources: RESOURCES } };
  }

  if (method === "resources/read") {
    const uri = params.uri;
    if (uri === "bca3://syllabus/all") {
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(SYLLABUS_INDEX, null, 2)
          }]
        }
      };
    }
    if (uri === "bca3://notes/latest") {
      const notes = await fetchFirebaseData('notes');
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(notes.slice(0, 10), null, 2)
          }]
        }
      };
    }
    return {
      jsonrpc: "2.0",
      id: reqId,
      error: { code: -32602, message: `Resource '${uri}' not found` }
    };
  }

  // 5. Prompts
  if (method === "prompts/list") {
    return { jsonrpc: "2.0", id: reqId, result: { prompts: PROMPTS } };
  }

  if (method === "prompts/get") {
    const promptName = params.name;
    const promptArgs = params.arguments || {};
    if (promptName === "exam_preparation_guide") {
      const sub = SYLLABUS_INDEX[promptArgs.subject_id] || { title: promptArgs.subject_id };
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          description: `Exam revision blueprint for ${sub.title} ${promptArgs.unit_number}`,
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: `Generate a comprehensive exam preparation guide for Panjab University BCA 3rd Sem: Subject: ${sub.title}, Unit: ${promptArgs.unit_number}. Include high-yield 2-mark definitions, 6-mark derivations/algorithms, and practical C++/assembly code snippets.`
            }
          }]
        }
      };
    }
    return {
      jsonrpc: "2.0",
      id: reqId,
      error: { code: -32601, message: `Prompt '${promptName}' not found` }
    };
  }

  return {
    jsonrpc: "2.0",
    id: reqId,
    error: { code: -32601, message: `Unsupported method '${method}'` }
  };
}

// Serverless Handler (Vercel Node.js Function)
module.exports = async (req, res) => {
  // Set CORS Headers for browser clients & AI hosts
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Request: Return Server Info & Open Endpoints
  if (req.method === 'GET') {
    return res.status(200).json({
      status: "online",
      service: "BCA III Hub Official MCP Server",
      protocolVersion: PROTOCOL_VERSION,
      transportsSupported: ["Streamable HTTP", "JSON-RPC 2.0"],
      capabilities: {
        tools: TOOLS.length,
        resources: RESOURCES.length,
        prompts: PROMPTS.length
      },
      endpoints: {
        mcpEndpoint: "https://bca-iii.vercel.app/api/mcp",
        openApiSchema: "https://bca-iii.vercel.app/api/openapi",
        protectedResourceMetadata: "https://bca-iii.vercel.app/.well-known/oauth-protected-resource"
      },
      availableSubjects: Object.keys(SYLLABUS_INDEX).map(k => ({ id: k, ...SYLLABUS_INDEX[k] }))
    });
  }

  // POST Request: Handle JSON-RPC 2.0 (Single or Batch)
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (Array.isArray(body)) {
        const results = await Promise.all(body.map(item => handleMcpRpc(item)));
        return res.status(200).json(results.filter(r => r.id !== undefined));
      } else {
        const result = await handleMcpRpc(body);
        return res.status(200).json(result);
      }
    } catch (err) {
      return res.status(500).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal server error: " + err.message }
      });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
};
