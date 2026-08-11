/**
 * Official Model Context Protocol (MCP) Serverless Endpoint for BCA III Hub
 * Supports Public Student Mode and Authenticated Admin Mode.
 * Transport: Streamable HTTP (JSON-RPC 2.0 over HTTP POST & GET)
 * Protocol Version: 2024-11-05
 * 
 * Default Author for Notes: Baljot Chohan
 * Official Panjab University BCA 3rd Semester Academic Repository
 */

const https = require('https');

// Admin access is now purely email-based (no passkeys)
const ADMIN_EMAILS = [
  'baljotchohan23@gmail.com',
  'mehakpreetkaur@gmail.com'
];
// ADMIN_SECRET is a fallback for AI tool connections (Claude Desktop, Cursor, ChatGPT)
// Set this in Vercel env vars as ADMIN_SECRET (long random string, not the old passkey)
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const FIREBASE_PROJECT_ID = 'bca2nd-5c622';
const DEFAULT_AUTHOR = "Baljot Chohan";


// Complete Panjab University BCA 3rd Sem Syllabus Data (2026-27 NEP-2020 Framework)
const SYLLABUS_INDEX = {
  "comp-arch": {
    code: "BCA-DSC-3(Maj)-301",
    title: "Computer Architecture",
    type: "DSC - Major",
    credits: 4,
    theoryHours: 60,
    visualTag: "[visual:arch-cpu-pipeline]",
    units: [
      {
        unit: "Unit I",
        title: "Digital Systems & ALU Design",
        topics: [
          "Definition of computer organization, design and computer architecture",
          "Digital Systems: basic block diagram of computer",
          "ALU design: Register Transfer Language, bus and memory transfer",
          "Microoperations and their hardware implementation — Arithmetic microoperations: binary adder, binary adder-subtractor, binary incrementor, composite arithmetic circuit",
          "Logic microoperations: hardware implementation of 16 logic ops",
          "Shift microoperations — 4-bit combinational shifter",
          "Arithmetic Logic Shift Unit (ALSU)"
        ],
        keyPoints: [
          "RTL uses notation like R2 ← R1 to describe internal data transfers.",
          "Common bus system uses multiplexers (2^n:1 MUX) or 3-state bus buffers.",
          "ALSU combines arithmetic, logic, and shift operations using select lines (S3, S2, S1, S0, Cin)."
        ]
      },
      {
        unit: "Unit II",
        title: "Basic Computer Organization & Instruction Cycle",
        topics: [
          "Basic Computer Organization: stored program organization, Von Neumann architecture",
          "Micro-operations and macro-operations",
          "Instruction code, instruction format, direct and indirect addressing",
          "Basic computer registers (PC, AR, DR, AC, IR, TR, INPR, OUTR)",
          "Common bus system with multiplexers and 3-state buffers",
          "Computer Instructions — memory reference, register reference, input output instructions",
          "Instruction cycle: Fetch, Decode, Read Effective Address, Execute",
          "Interrupt cycle; types of interrupts (internal, external, software)",
          "Introduction to assembly language, assembly language vs machine language"
        ],
        keyPoints: [
          "Program Counter (PC) holds the address of the next instruction.",
          "Instruction Register (IR) holds the 16-bit instruction word currently being executed.",
          "Indirect addressing (I=1 in bit 15) requires an extra memory access cycle."
        ]
      },
      {
        unit: "Unit III",
        title: "Memory Organization & 8086 Microprocessor",
        topics: [
          "Memory organization: memory hierarchy (registers, cache, main, secondary)",
          "RAM and ROM chips, memory connection to CPU",
          "Associative memory (CAM)",
          "Cache memory and mapping procedures — associative, set associative, direct mapping",
          "Virtual memory — address space vs memory space, paging and segmentation",
          "Microprocessor architecture: 8086/8088 — features, internal block diagram (BIU & EU)",
          "8086/8088 memory and register organization, flag register, addressing modes"
        ],
        keyPoints: [
          "Cache mapping methods: Direct Mapping (fast, high conflict), Associative (flexible, expensive), Set-Associative (balanced).",
          "8086 BIU handles instruction fetching (6-byte queue) and physical address calculation (Segment:Offset).",
          "8086 EU executes instructions using the 16-bit ALU, general registers, and Flag Register."
        ]
      },
      {
        unit: "Unit IV",
        title: "Input-Output & DMA Organization",
        topics: [
          "Input-Output organization: I/O interface, connection of I/O bus to I/O devices",
          "Isolated I/O and memory mapped I/O",
          "Asynchronous data transfer: source-initiated and destination-initiated strobe control and handshaking",
          "Modes of transfer: programmed I/O data transfer, interrupt-initiated I/O data transfer",
          "Direct Memory Access (DMA): DMA controller, bus request/grant, burst & cycle-stealing transfer"
        ],
        keyPoints: [
          "Memory-mapped I/O uses common memory addresses and instructions for both RAM and I/O devices.",
          "Isolated I/O uses dedicated IN and OUT instructions with separate address spaces.",
          "DMA controller requests bus mastery (HOLD/HLDA) to transfer blocks directly without CPU intervention."
        ]
      }
    ]
  },
  "data-structures": {
    code: "BCA-DSC-3(Min)-302",
    title: "Data Structures Using C/C++",
    type: "DSC - Minor",
    credits: 4,
    theoryHours: 60,
    visualTag: "[visual:ds-bst]",
    units: [
      {
        unit: "Unit I",
        title: "Arrays, Complexity & Stacks",
        topics: [
          "Classification of data structures (linear, non-linear)",
          "Time and space complexity (Big O, Omega, Theta)",
          "1D and 2D arrays, row-major and column-major address calculation",
          "Stack ADT, push/pop operations, array representation",
          "Infix, Prefix, Postfix conversions and evaluations",
          "Recursion & Tower of Hanoi problem"
        ]
      },
      {
        unit: "Unit II",
        title: "Queues & Linked Lists",
        topics: [
          "Queue ADT, linear queue, circular queue, priority queue, Deque",
          "Singly linked lists, insertion, deletion, searching, traversal",
          "Doubly linked lists and circular linked lists",
          "Linked list representation of stacks and queues",
          "Polynomial representation and addition using linked lists"
        ]
      },
      {
        unit: "Unit III",
        title: "Trees & Binary Search Trees",
        topics: [
          "Basic tree terminology: root, parent, child, leaf, depth, height",
          "Binary trees, properties, full and complete binary trees",
          "Tree traversals: Inorder, Preorder, Postorder (recursive & non-recursive)",
          "Binary Search Trees (BST): insertion, deletion, searching",
          "AVL trees: balance factor and rotations (LL, RR, LR, RL)",
          "B-trees and B+ trees overview"
        ]
      },
      {
        unit: "Unit IV",
        title: "Graphs, Sorting & Searching",
        topics: [
          "Graph terminology, directed/undirected, adjacency matrix and adjacency list",
          "Graph traversals: BFS (Breadth First Search) and DFS (Depth First Search)",
          "Spanning trees, Prim's and Kruskal's algorithms",
          "Dijkstra's shortest path algorithm",
          "Searching: Linear search, Binary search",
          "Sorting algorithms: Bubble sort, Selection sort, Insertion sort, Merge sort, Quick sort, Heap sort"
        ]
      }
    ]
  },
  "numerical-methods": {
    code: "BCA-DSC-3(Min)-303",
    title: "Numerical Methods & Scientific Computing",
    type: "DSC - Minor",
    credits: 4,
    theoryHours: 60,
    visualTag: "[visual:numerical-bisection]",
    units: [
      {
        unit: "Unit I",
        title: "Error Analysis & Transcendental Equations",
        topics: [
          "Errors in numerical calculations: absolute, relative, percentage errors",
          "Truncation error, round-off error, propagation of errors",
          "Bisection method",
          "Regula-Falsi (False Position) method",
          "Newton-Raphson method (formula, derivation, rate of convergence)",
          "Secant method"
        ]
      },
      {
        unit: "Unit II",
        title: "Linear Equations & Interpolation",
        topics: [
          "Gauss Elimination method with partial pivoting",
          "Gauss-Jordan method",
          "Gauss-Seidel iterative method & Jacobi method",
          "Finite differences: forward, backward, shift operators",
          "Newton's Forward and Backward interpolation formulas",
          "Lagrange's interpolation formula for unequal intervals",
          "Newton's Divided Difference formula"
        ]
      },
      {
        unit: "Unit III",
        title: "Numerical Differentiation & Integration",
        topics: [
          "Numerical differentiation using Newton's forward/backward formulas",
          "Trapezoidal rule",
          "Simpson's 1/3rd rule and Simpson's 3/8th rule",
          "Weddle's rule",
          "Error terms and geometric interpretation of integration rules"
        ]
      },
      {
        unit: "Unit IV",
        title: "Ordinary Differential Equations (ODEs)",
        topics: [
          "Taylor's series method",
          "Euler's method and Modified Euler's method",
          "Runge-Kutta 2nd and 4th order (RK-4) methods",
          "Predictor-Corrector methods: Milne's and Adams-Bashforth methods"
        ]
      }
    ]
  },
  "machine-learning": {
    code: "BCA-DSC-3(Min)-304",
    title: "Introduction to Machine Learning",
    type: "DSC - Minor",
    credits: 4,
    theoryHours: 60,
    visualTag: "[visual:ml-gradient-descent]",
    units: [
      {
        unit: "Unit I",
        title: "Foundations of AI & ML",
        topics: [
          "Definition and types of learning: Supervised, Unsupervised, Reinforcement Learning",
          "Machine learning pipeline: data collection, preprocessing, feature engineering, model training, evaluation",
          "Bias-Variance Tradeoff",
          "Overfitting and underfitting, regularization (L1 Lasso, L2 Ridge)"
        ]
      },
      {
        unit: "Unit II",
        title: "Supervised Regression & Classification",
        topics: [
          "Linear Regression: cost function, gradient descent, multi-variable regression",
          "Logistic Regression for binary classification: sigmoid function, log loss",
          "Decision Trees: ID3 algorithm, Entropy, Information Gain, Gini Impurity",
          "Random Forests and ensemble methods (Bagging and Boosting)"
        ]
      },
      {
        unit: "Unit III",
        title: "SVM, KNN & Model Evaluation",
        topics: [
          "Support Vector Machines (SVM): hyperplanes, margin, kernel trick",
          "K-Nearest Neighbors (KNN) algorithm and distance metrics",
          "Evaluation metrics: Confusion Matrix, Accuracy, Precision, Recall, F1-Score, ROC-AUC curve",
          "Cross-validation techniques (K-Fold cross-validation)"
        ]
      },
      {
        unit: "Unit IV",
        title: "Unsupervised Learning & Neural Networks Intro",
        topics: [
          "Clustering: K-Means clustering algorithm, Elbow method",
          "Hierarchical clustering (Agglomerative and Divisive)",
          "Dimensionality Reduction: Principal Component Analysis (PCA)",
          "Introduction to Artificial Neural Networks (ANN): Perceptron, activation functions, backpropagation overview"
        ]
      }
    ]
  },
  "english-3": {
    code: "BCA-AEC-305",
    title: "English-3: Professional Communication",
    type: "AEC",
    credits: 2,
    theoryHours: 30,
    units: [
      {
        unit: "Unit I",
        title: "Business Writing & Reports",
        topics: [
          "Technical writing principles and formal register",
          "Business letter formats, enquiry, complaints, job application",
          "Resume & Curriculum Vitae (CV) preparation with modern portfolios",
          "Technical project report structuring and executive summaries"
        ]
      },
      {
        unit: "Unit II",
        title: "Oral Presentation & Interviews",
        topics: [
          "Group Discussion (GD) dynamics, leadership, and turn-taking",
          "Job interview techniques, behavioral questions (STAR method)",
          "Technical presentation delivery, slide visual design, body language",
          "Active listening, cross-cultural workplace etiquette"
        ]
      }
    ]
  },
  "web-dev": {
    code: "BCA-MDC-306",
    title: "Web Development & UI Design",
    type: "MDC",
    credits: 3,
    theoryHours: 45,
    units: [
      {
        unit: "Unit I",
        title: "HTML5, Semantic UI & Responsive CSS",
        topics: [
          "HTML5 semantic layout structure (header, nav, main, section, article, aside, footer)",
          "Modern CSS Flexbox (flex-direction, justify-content, align-items, flex-wrap)",
          "CSS Grid layouts (grid-template-columns, fr units, minmax, auto-fit)",
          "Responsive Web Design with Media Queries & fluid typography",
          "CSS custom properties (design tokens) and dark mode switching"
        ]
      },
      {
        unit: "Unit II",
        title: "JavaScript ES6+ & DOM APIs",
        topics: [
          "Modern JavaScript ES6+ (Arrow functions, destructuring, template literals, spread/rest)",
          "DOM manipulation, event delegation, and bubbling",
          "Asynchronous JS: Promises, Async/Await, and Fetch API for REST JSON",
          "Single Page Application (SPA) state architecture and client routing"
        ]
      }
    ]
  },
  "backend-dev": {
    code: "BCA-SEC-307",
    title: "Backend Web Development with Node/Python",
    type: "SEC",
    credits: 2,
    theoryHours: 30,
    units: [
      {
        unit: "Unit I",
        title: "Server Architecture & REST APIs",
        topics: [
          "Client-Server architecture and HTTP methods (GET, POST, PUT, DELETE, PATCH)",
          "Node.js / Express.js server initialization and route handling",
          "Middleware design: logging, error handling, CORS headers, and request body parsing",
          "RESTful API design principles and JSON schema data validation"
        ]
      },
      {
        unit: "Unit II",
        title: "Database Integration & Security",
        topics: [
          "Relational vs NoSQL databases: structure and querying",
          "CRUD operations with Firebase Realtime Database and MongoDB",
          "JWT (JSON Web Tokens) authentication and Bearer token verification",
          "Serverless deployment, rate limiting, and environment variable configuration"
        ]
      }
    ]
  }
};

const PROTOCOL_VERSION = "2024-11-05";

function normalizeSubjectId(input) {
  if (!input) return "comp-arch";
  const s = input.toLowerCase().trim();
  if (s.includes("arch") || s.includes("comp-arch") || s === "ca") return "comp-arch";
  if (s.includes("structure") || s.includes("data-structures") || s === "ds") return "data-structures";
  if (s.includes("numeric") || s.includes("numerical-methods") || s === "nm") return "numerical-methods";
  if (s.includes("machine") || s.includes("learning") || s === "ml") return "machine-learning";
  if (s.includes("english") || s.includes("communication")) return "english-3";
  if (s.includes("web") || s.includes("html") || s.includes("frontend")) return "web-dev";
  if (s.includes("backend") || s.includes("node") || s.includes("server")) return "backend-dev";
  return s;
}

// Public Tools List
const PUBLIC_TOOLS = [
  {
    name: "get_syllabus",
    description: "Get full official Panjab University BCA 3rd Sem syllabus for a specific subject or all subjects.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Subject ID ('comp-arch', 'data-structures', 'numerical-methods', 'machine-learning', 'english-3', 'web-dev', 'backend-dev', or 'all')",
          default: "all"
        }
      }
    }
  },
  {
    name: "get_unit_details",
    description: "Get specific Unit (Unit I–IV) topics, syllabus breakdown, key exam points, and visual simulation tags for a subject.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Subject ID (e.g. 'comp-arch', 'data-structures', 'numerical-methods', 'machine-learning')"
        },
        unit_number: {
          type: "string",
          description: "Unit identifier ('Unit I', 'Unit II', 'Unit III', or 'Unit IV')"
        }
      },
      required: ["subject_id", "unit_number"]
    }
  },
  {
    name: "get_digital_notes",
    description: "Retrieve published digital study notes and guides live from the BCA III Hub across all subjects with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Optional subject filter ('comp-arch', 'data-structures', etc., or 'all')",
          default: "all"
        },
        unit: {
          type: "string",
          description: "Optional unit filter (e.g. 'Unit I', 'Unit II', 'Unit III', 'Unit IV')"
        },
        author: {
          type: "string",
          description: "Optional author filter (e.g. 'Baljot Chohan')"
        },
        limit: {
          type: "integer",
          description: "Maximum number of notes to return (default 50)",
          default: 50
        }
      }
    }
  },
  {
    name: "search_digital_notes",
    description: "Search digital study notes, lecture summaries, and topics using keywords across all subjects.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword or topic (e.g. '8086', 'bisection', 'binary search tree', 'pipeline', 'Newton Raphson')",
          default: ""
        },
        subject_id: {
          type: "string",
          description: "Optional subject filter"
        }
      }
    }
  },
  {
    name: "get_note_by_id",
    description: "Retrieve a specific digital note in full detail by its unique Firebase or record ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The note ID or Firebase key"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "get_daily_lectures",
    description: "Retrieve classroom lecture log records, faculty notes, and homework assignments for a specific date or recent days.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: {
          type: "string",
          description: "Optional subject filter"
        },
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format or 'latest'",
          default: "latest"
        }
      }
    }
  },
  {
    name: "get_announcements",
    description: "Fetch live Panjab University and BCA 3rd Semester notices, MST exam schedules, and alerts.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Maximum notices to return", default: 5 }
      }
    }
  },
  {
    name: "add_study_task",
    description: "Add a study task, homework milestone, or exam target to the BCA III Hub To-Do tracker.",
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
    name: "get_study_tasks",
    description: "Retrieve all active and completed study targets from the BCA III Hub To-Do list.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_syllabus_structure_for_ai",
    description: "Get a comprehensive curriculum roadmap for all 7 subjects and units, with status of existing published notes.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "Optional subject ID filter" }
      }
    }
  },
  {
    name: "get_hub_stats",
    description: "Get real-time statistics of published notes, lectures, announcements, and study tasks on the hub.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Admin & Authoring Tools List
const ADMIN_TOOLS = [
  {
    name: "create_and_publish_note",
    description: "[ADMIN / AUTHOR] Create and publish a comprehensive university-standard digital study note to the live BCA III Hub under Baljot Chohan's name (or custom author). Aligned with the official Panjab University curriculum.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey (optional if sent in Authorization header)" },
        subject: {
          type: "string",
          description: "Subject ID: 'comp-arch', 'data-structures', 'numerical-methods', 'machine-learning', 'english-3', 'web-dev', or 'backend-dev'"
        },
        unit: {
          type: "string",
          description: "Unit number (e.g. 'Unit I', 'Unit II', 'Unit III', 'Unit IV')",
          default: "Unit I"
        },
        topic: {
          type: "string",
          description: "Topic heading (e.g. '8086 Microprocessor BIU and EU Architecture & Addressing Modes')"
        },
        content: {
          type: "string",
          description: "Full markdown notes with detailed explanations, definitions, code, ASCII diagrams, exam tips, and formulas"
        },
        author: {
          type: "string",
          description: "Author name (defaults to 'Baljot Chohan')",
          default: DEFAULT_AUTHOR
        },
        readTime: {
          type: "string",
          description: "Estimated read time (e.g. '6 min read')",
          default: "6 min read"
        },
        tags: {
          type: "string",
          description: "Comma-separated tags (e.g. '8086, BIU, EU, Microprocessor, PU-Exam')"
        },
        visual_type: {
          type: "string",
          enum: ["none", "numerical-bisection", "ds-bst", "ml-gradient-descent", "arch-cpu-pipeline"],
          description: "Optional interactive visual simulation to embed in note",
          default: "none"
        }
      },
      required: ["subject", "topic", "content"]
    }
  },
  {
    name: "publish_digital_note",
    description: "[ALIAS] Same as create_and_publish_note. Publish a complete study note live to the BCA III Hub.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey" },
        subject: { type: "string", description: "Subject ID" },
        unit: { type: "string", description: "Unit number", default: "Unit I" },
        topic: { type: "string", description: "Topic title" },
        content: { type: "string", description: "Full markdown note content" },
        author: { type: "string", description: "Author name", default: DEFAULT_AUTHOR },
        readTime: { type: "string", description: "Estimated read time", default: "6 min read" },
        tags: { type: "string", description: "Comma-separated tags" },
        visual_type: { type: "string", description: "Interactive visual simulation tag" }
      },
      required: ["subject", "topic", "content"]
    }
  },
  {
    name: "update_digital_note",
    description: "[ADMIN ONLY] Update an existing published note on the hub.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey" },
        id: { type: "string", description: "Firebase note ID/key" },
        subject: { type: "string", description: "Subject ID" },
        unit: { type: "string", description: "Unit number" },
        topic: { type: "string", description: "Updated topic title" },
        content: { type: "string", description: "Updated markdown note content" },
        author: { type: "string", description: "Author name", default: DEFAULT_AUTHOR },
        tags: { type: "string", description: "Comma-separated tags" },
        readTime: { type: "string", description: "Estimated read time" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_digital_note",
    description: "[ADMIN ONLY] Delete a note from the live hub repository.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey" },
        id: { type: "string", description: "Firebase note record key" }
      },
      required: ["id"]
    }
  },
  {
    name: "publish_lecture_log",
    description: "[ADMIN ONLY] Record and publish a daily classroom lecture log for the batch.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey" },
        subject: { type: "string", description: "Subject ID" },
        topic: { type: "string", description: "Topics covered in class" },
        unit: { type: "string", description: "Unit (e.g. 'Unit I')", default: "Unit I" },
        notes: { type: "string", description: "Lecture summary or homework assigned" },
        date: { type: "string", description: "Date in YYYY-MM-DD (defaults to today)" },
        room: { type: "string", description: "Classroom/Lab number", default: "Lab-3" },
        time: { type: "string", description: "Time of lecture", default: "10:00 AM" }
      },
      required: ["subject", "topic", "notes"]
    }
  },
  {
    name: "publish_announcement",
    description: "[ADMIN ONLY] Broadcast an official notice, MST timetable, or urgent alert to the batch.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey (optional if sent in Authorization header)" },
        title: { type: "string", description: "Announcement headline" },
        desc: { type: "string", description: "Detailed announcement body (or message)" },
        message: { type: "string", description: "Detailed message body" },
        badge: { type: "string", description: "Category badge ('NOTICE', 'EXAM', 'ALERT', 'HOLIDAY')", default: "NOTICE" },
        author: { type: "string", description: "Author name (defaults to 'Baljot Chohan')", default: DEFAULT_AUTHOR },
        link: { type: "string", description: "Optional URL link", default: "#" }
      },
      required: ["title"]
    }
  },

  {
    name: "delete_hub_record",
    description: "[ADMIN ONLY] Delete any record (note, lecture, announcement, todo) from the database.",
    inputSchema: {
      type: "object",
      properties: {
        passkey: { type: "string", description: "Admin authorization passkey" },
        collection: { type: "string", enum: ["notes", "lectures", "announcements", "todos"], description: "Database collection" },
        id: { type: "string", description: "Firebase record key" }
      },
      required: ["collection", "id"]
    }
  }
];

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
  },
  {
    uri: "bca3://syllabus/structure",
    name: "Curriculum Topic Map",
    description: "Topic-by-topic roadmap with unit breakdowns for AI content authoring.",
    mimeType: "application/json"
  }
];

const PROMPTS = [
  {
    name: "create_syllabus_study_guide",
    description: "Generate a complete, high-scoring university study guide under Baljot Chohan's name and publish it to the hub.",
    arguments: [
      { name: "subject_id", description: "Subject ID (e.g. comp-arch, data-structures)", required: true },
      { name: "unit_number", description: "Unit number (e.g. Unit I, Unit II)", required: true },
      { name: "topic", description: "Specific topic from syllabus", required: true }
    ]
  },
  {
    name: "exam_preparation_guide",
    description: "Generate a targeted exam preparation and revision guide for a specific BCA 3rd semester unit.",
    arguments: [
      { name: "subject_id", description: "Subject ID (e.g. comp-arch)", required: true },
      { name: "unit_number", description: "Unit number (e.g. Unit I)", required: true }
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
            return resolve(Object.keys(parsed).map(key => ({ id: key, fbKey: key, ...parsed[key] })));
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

// Helper: Patch JSON in Firebase RTDB
function putFirebaseData(endpoint, id, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'bca2nd-5c622-default-rtdb.firebaseio.com',
      path: `/bca3/${endpoint}/${id}.json`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(true));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper: Delete JSON from Firebase RTDB
function deleteFirebaseData(endpoint, id) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bca2nd-5c622-default-rtdb.firebaseio.com',
      path: `/bca3/${endpoint}/${id}.json`,
      method: 'DELETE'
    };
    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 204);
    });
    req.on('error', reject);
    req.end();
  });
}

// Helper: Verify a Firebase ID Token via Google's token introspection API
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  return new Promise((resolve) => {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyAM8tcsYAnJoLzY6ZUxp6M5h2z-M6AJzDI`;
    const body = JSON.stringify({ idToken });
    const req = https.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', d => { data += d; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const user = parsed.users && parsed.users[0];
            resolve(user ? { uid: user.localId, email: user.email, name: user.displayName } : null);
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// Helper: Verify admin access (Google ID Token email OR ADMIN_SECRET env fallback for AI tools)
async function verifyAdmin(authHeader) {
  if (!authHeader) return { ok: false, user: null };
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  // Env-secret fallback (for Cursor / Claude Desktop / ChatGPT integrations)
  if (ADMIN_SECRET && token === ADMIN_SECRET) {
    return { ok: true, user: { uid: 'ai-tool', email: ADMIN_EMAILS[0], name: DEFAULT_AUTHOR } };
  }
  // Firebase ID Token path
  const user = await verifyFirebaseToken(token);
  if (user && ADMIN_EMAILS.includes(user.email)) {
    return { ok: true, user };
  }
  return { ok: false, user: user || null };
}

// Helper: Verify any signed-in user (not necessarily admin)
async function verifySignedIn(authHeader) {
  if (!authHeader) return { ok: false, user: null };
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (ADMIN_SECRET && token === ADMIN_SECRET) {
    return { ok: true, user: { uid: 'ai-tool', email: ADMIN_EMAILS[0], name: DEFAULT_AUTHOR } };
  }
  const user = await verifyFirebaseToken(token);
  return user ? { ok: true, user } : { ok: false, user: null };
}


// Main MCP Dispatcher
async function handleMcpRpc(payload, authHeader = '', authorHeader = '') {
  const method = payload.method;
  const reqId = payload.id;
  const params = payload.params || {};

  // Resolve admin and signed-in status once upfront
  const adminResult = await verifyAdmin(authHeader);
  const isAdmin = adminResult.ok;
  const adminUser = adminResult.user;

  // For non-admin tool calls, also check if user is signed in
  const signedInResult = isAdmin ? adminResult : await verifySignedIn(authHeader);
  const isSignedIn = signedInResult.ok;

  if (method === "ping") {
    return { jsonrpc: "2.0", id: reqId, result: {} };
  }

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
          name: isAdmin
            ? "BCA III Hub MCP Server [ADMIN MODE]"
            : isSignedIn
              ? "BCA III Academic Hub MCP Server [STUDENT MODE]"
              : "BCA III Academic Hub MCP Server [UNSIGNED]",
          version: "2.0.0"
        },
        instructions: isAdmin
          ? `ADMIN MODE ACTIVE: Authenticated as ${adminUser?.name || 'Administrator'} (${adminUser?.email}). Full authority to create/publish notes, log lectures, broadcast announcements, and manage all data on BCA III Hub.`
          : isSignedIn
            ? "STUDENT MODE: Authenticated Google user. Read-only access to official Panjab University BCA 3rd Sem syllabi, notes, lectures, and tasks. Admin tools require admin email registration."
            : "UNSIGNED MODE: Sign in with Google at https://bca-iii.vercel.app to use any tools. Include your Firebase ID Token as Authorization: Bearer <token>."
      }
    };
  }

  if (method === "tools/list") {
    // List all tools — signed-in users see full tool set, unsigned get only public info
    return {
      jsonrpc: "2.0", id: reqId,
      result: {
        tools: isSignedIn
          ? [...PUBLIC_TOOLS, ...ADMIN_TOOLS]
          : PUBLIC_TOOLS.map(t => ({ ...t, description: t.description + ' [Sign in required to use]' }))
      }
    };
  }


  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};

    // Gate: ALL tool calls require a signed-in Google user
    if (!isSignedIn) {
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: "🔐 Authentication Required\n\nThis BCA III Hub MCP endpoint requires a signed-in Google account.\n\nTo use these tools:\n1. Visit https://bca-iii.vercel.app and sign in with Google.\n2. Get your Firebase ID Token from the browser's dev console.\n3. Include it as: Authorization: Bearer <your_id_token>\n\nAdmin write operations additionally require the admin-registered email."
          }],
          isError: true
        }
      };
    }


    if (name === "get_syllabus") {
      const subId = args.subject_id ? normalizeSubjectId(args.subject_id) : "all";
      if (subId === "all" || !SYLLABUS_INDEX[subId]) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{
              type: "text",
              text: JSON.stringify({
                university: "Panjab University, Chandigarh",
                semester: "BCA 3rd Semester (2026-27 NEP-2020 Framework)",
                totalCredits: 23,
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
      const subId = normalizeSubjectId(args.subject_id);
      const sub = SYLLABUS_INDEX[subId];
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
      const unitQuery = (args.unit_number || "").toLowerCase().replace(/[^a-z0-9]/g, '');
      const unit = sub.units.find(u => {
        const uNorm = u.unit.toLowerCase().replace(/[^a-z0-9]/g, '');
        return uNorm === unitQuery || uNorm.includes(unitQuery);
      });
      if (!unit) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{ type: "text", text: `Unit '${args.unit_number}' not found in ${sub.title}. Available units: ${sub.units.map(u => u.unit).join(", ")}` }],
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
              subjectId: subId,
              subjectTitle: sub.title,
              code: sub.code,
              unit: unit.unit,
              title: unit.title,
              topics: unit.topics,
              keyPoints: unit.keyPoints || [],
              recommendedVisualTag: sub.visualTag || null
            }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "get_digital_notes" || name === "list_digital_notes") {
      const [rawFbNotes, rawFbLectures] = await Promise.all([
        fetchFirebaseData('notes'),
        fetchFirebaseData('lectures')
      ]);

      const subId = args.subject_id && args.subject_id !== "all" ? normalizeSubjectId(args.subject_id) : null;
      const unitFilter = args.unit ? args.unit.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
      const authorFilter = args.author ? args.author.toLowerCase().trim() : null;

      const legacyLectureNotes = rawFbLectures
        .filter(l => (l.content && !l.topic) || l.isAdminPublished || l.readTime)
        .map(l => ({
          id: l.id || l.fbKey,
          fbKey: l.fbKey,
          subject: l.subject || l.subjectId || "comp-arch",
          subjectId: l.subjectId || l.subject || "comp-arch",
          unit: l.unit || "Unit I",
          title: l.title || l.topic || "Digital Note",
          topic: l.topic || l.title || "Digital Note",
          content: l.content || l.notes || l.description || "",
          author: l.author || DEFAULT_AUTHOR,
          readTime: l.readTime || "5 min read",
          tags: l.tags || ["Lecture Note"],
          date: l.date || new Date().toISOString().split("T")[0],
          isAdminPublished: true
        }));

      const allNotes = [
        ...rawFbNotes.map(n => ({
          ...n,
          subject: n.subject || n.subjectId || "comp-arch",
          subjectId: n.subjectId || n.subject || "comp-arch",
          author: n.author || DEFAULT_AUTHOR,
          readTime: n.readTime || "5 min read"
        })),
        ...legacyLectureNotes.filter(ln => !rawFbNotes.some(fn => fn.fbKey === ln.fbKey || fn.id === ln.id))
      ];

      let filtered = allNotes;

      if (subId) {
        filtered = filtered.filter(n => normalizeSubjectId(n.subject) === subId || normalizeSubjectId(n.subjectId) === subId);
      }

      if (unitFilter) {
        filtered = filtered.filter(n => (n.unit || "").toLowerCase().replace(/[^a-z0-9]/g, '').includes(unitFilter));
      }

      if (authorFilter) {
        filtered = filtered.filter(n => (n.author || "").toLowerCase().includes(authorFilter));
      }

      const limit = args.limit || 50;
      const result = filtered.slice(0, limit);

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: result.length,
              totalAvailable: filtered.length,
              filterSubject: subId || "all",
              notes: result
            }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "search_digital_notes") {
      const query = (args.query || "").toLowerCase().trim();
      const subId = args.subject_id && args.subject_id !== "all" ? normalizeSubjectId(args.subject_id) : null;
      
      const [rawFbNotes, rawFbLectures] = await Promise.all([
        fetchFirebaseData('notes'),
        fetchFirebaseData('lectures')
      ]);

      const allNotes = [
        ...rawFbNotes,
        ...rawFbLectures
          .filter(l => (l.content && !l.topic) || l.isAdminPublished || l.readTime)
          .map(l => ({
            id: l.id || l.fbKey,
            fbKey: l.fbKey,
            subject: l.subject || l.subjectId,
            unit: l.unit || "Unit I",
            title: l.title || l.topic,
            content: l.content || l.notes || l.description || "",
            author: l.author || DEFAULT_AUTHOR,
            readTime: l.readTime || "5 min read",
            tags: l.tags || ["Lecture Note"]
          }))
      ];

      const filtered = allNotes.filter(n => {
        const matchesQuery = !query ||
          (n.title || "").toLowerCase().includes(query) ||
          (n.topic || "").toLowerCase().includes(query) ||
          (n.content || "").toLowerCase().includes(query) ||
          (n.author || "").toLowerCase().includes(query) ||
          (Array.isArray(n.tags) ? n.tags.join(" ").toLowerCase() : (n.tags || "")).includes(query);
        
        const matchesSub = !subId || normalizeSubjectId(n.subject) === subId || normalizeSubjectId(n.subjectId) === subId;
        return matchesQuery && matchesSub;
      });

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: filtered.length,
              query: query,
              results: filtered
            }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "get_note_by_id") {
      const rawFbNotes = await fetchFirebaseData('notes');
      const note = rawFbNotes.find(n => n.id === args.id || n.fbKey === args.id);
      if (!note) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: { content: [{ type: "text", text: `Note with ID '${args.id}' not found.` }], isError: true }
        };
      }
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: { content: [{ type: "text", text: JSON.stringify(note, null, 2) }], isError: false }
      };
    }

    if (name === "create_and_publish_note" || name === "publish_digital_note") {
      if (!isAdmin) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [{
              type: "text",
              text: "🔒 Admin Access Required\n\nPublishing notes requires an admin Google account (baljotchohan23@gmail.com or mehakpreetkaur@gmail.com).\n\nSign in with your registered Google account at https://bca-iii.vercel.app and use your Firebase ID Token as the Authorization: Bearer header."
            }],
            isError: true
          }
        };
      }


      const subjectId = normalizeSubjectId(args.subject || args.subject_id || "comp-arch");
      const unit = args.unit || "Unit I";
      const topic = args.topic || args.title || "Digital Note";
      let author = args.author || authorHeader || DEFAULT_AUTHOR;
      if (author.toLowerCase().includes('mehak')) {
        author = "Mehakpreet Kaur";
      } else if (author.toLowerCase().includes('baljot')) {
        author = "Baljot Chohan";
      }

      const subInfo = SYLLABUS_INDEX[subjectId];
      const today = new Date().toISOString().split("T")[0];

      let finalContent = args.content || "";
      if (subInfo && subInfo.visualTag && !finalContent.includes(subInfo.visualTag)) {
        finalContent = `${subInfo.visualTag}\n\n${finalContent}`;
      }
      
      if (args.visual_type && args.visual_type !== "none") {
        const visualTag = `[visual:${args.visual_type}]`;
        if (!finalContent.includes(visualTag)) {
          finalContent = finalContent + `\n\n${visualTag}\n\n`;
        }
      }

      const tagsArray = args.tags 
        ? (Array.isArray(args.tags) ? args.tags : args.tags.split(',').map(t => t.trim()).filter(Boolean))
        : [subInfo ? subInfo.title : subjectId, unit, "PU-2026-27"];

      const notePayload = {
        id: `custom-note-${Date.now()}`,
        subject: subjectId,
        subjectId: subjectId,
        unit: unit,
        title: topic,
        topic: topic,
        content: finalContent,
        author: author,
        readTime: args.readTime || "6 min read",
        tags: tagsArray,
        isAdminPublished: true,
        date: today,
        timestamp: Date.now()
      };

      const key = await pushFirebaseData('notes', notePayload);

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: `🎉 [SUCCESS] Digital study note published live on BCA III Hub!\n\n` +
                  `• Record Key: ${key}\n` +
                  `• Author: ${author}\n` +
                  `• Subject: ${subInfo ? subInfo.title : subjectId} (${unit})\n` +
                  `• Topic: ${topic}\n` +
                  `• Status: Live & instantly visible on site for all students!`
          }],
          isError: false
        }
      };
    }

    if (name === "update_digital_note") {
      if (!isAdmin) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: { content: [{ type: "text", text: "🔒 Admin Access Required: Only registered admin accounts can update notes." }], isError: true }
        };
      }

      const patchData = { timestamp: Date.now() };
      if (args.title || args.topic) {
        patchData.title = args.title || args.topic;
        patchData.topic = args.topic || args.title;
      }
      if (args.content) patchData.content = args.content;
      if (args.subject) {
        patchData.subject = normalizeSubjectId(args.subject);
        patchData.subjectId = patchData.subject;
      }
      if (args.unit) patchData.unit = args.unit;
      if (args.author) patchData.author = args.author;
      if (args.readTime) patchData.readTime = args.readTime;
      if (args.tags) {
        patchData.tags = Array.isArray(args.tags) ? args.tags : args.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      await putFirebaseData('notes', args.id, patchData);

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: `✅ Note '${args.id}' successfully updated in live database!` }],
          isError: false
        }
      };
    }

    if (name === "delete_digital_note" || name === "delete_hub_record") {
      if (!isAdmin) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: { content: [{ type: "text", text: "🔒 Admin Access Required: Only registered admin accounts can delete records." }], isError: true }
        };
      }
      const collection = args.collection || "notes";
      const success = await deleteFirebaseData(collection, args.id);
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: success ? `🗑️ Record deleted from '${collection}' (ID: ${args.id})` : `Failed to delete record.` }],
          isError: !success
        }
      };
    }

    if (name === "publish_lecture_log") {
      if (!isAdmin) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: { content: [{ type: "text", text: "🔒 Admin Access Required: Only registered admin accounts can publish lecture logs." }], isError: true }
        };
      }
      const subjectId = normalizeSubjectId(args.subject);
      const today = args.date || new Date().toISOString().split('T')[0];
      const payload = {
        id: `custom-lec-${Date.now()}`,
        subject: subjectId,
        subjectId: subjectId,
        unit: args.unit || "Unit I",
        topic: args.topic,
        title: args.topic,
        description: args.notes,
        notes: args.notes,
        content: args.notes,
        author: 'Baljot Chohan',
        type: 'lecture',
        date: today,
        room: args.room || "Lab-3",
        time: args.time || "10:00 AM",
        link: "Syllabus.pdf",
        timestamp: Date.now()
      };
      // Write to notes (open write access)
      const key = await pushFirebaseData('notes', payload);
      try { await pushFirebaseData('lectures', payload); } catch(e) {}

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: `📅 Lecture log published live! ID: ${key} (${subjectId} on ${today})` }],
          isError: false
        }
      };
    }

    if (name === "get_daily_lectures") {
      const [lectures, notes] = await Promise.all([
        fetchFirebaseData('lectures'),
        fetchFirebaseData('notes')
      ]);
      const noteLecs = notes.filter(n => n.type === 'lecture' || n.topic).map(n => ({
        id: n.id,
        fbKey: n.fbKey,
        subject: n.subject || n.subjectId,
        subjectId: n.subject || n.subjectId,
        unit: n.unit,
        topic: n.title || n.topic,
        notes: n.content || n.description,
        date: n.date,
        time: n.readTime || '10:00 AM'
      }));
      let result = [...lectures, ...noteLecs];
      if (args.subject_id && args.subject_id !== "all") {
        const subId = normalizeSubjectId(args.subject_id);
        result = result.filter(l => normalizeSubjectId(l.subject) === subId || normalizeSubjectId(l.subjectId) === subId);
      }
      if (args.date && args.date !== "latest") {
        result = result.filter(l => l.date === args.date);
      }
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({ count: result.length, lectures: result.slice(0, 15) }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "publish_announcement") {
      if (!isAdmin) {
        return {
          jsonrpc: "2.0",
          id: reqId,
          result: { content: [{ type: "text", text: "🔒 Admin Access Required: Only registered admin accounts (baljotchohan23@gmail.com or mehakpreetkaur@gmail.com) can broadcast announcements." }], isError: true }
        };
      }
      const author = args.author || authorHeader || DEFAULT_AUTHOR;
      const messageBody = args.message || args.desc || "";
      const payload = {
        id: `custom-ann-${Date.now()}`,
        title: args.title,
        message: messageBody,
        desc: messageBody,
        category: (args.badge || args.category || "NOTICE").toLowerCase(),
        badge: args.badge || args.category || "NOTICE",
        author: author,
        link: args.link || "#",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        timestamp: Date.now()
      };
      const key = await pushFirebaseData('announcements', payload);
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{ type: "text", text: `📢 Announcement published live by ${author}!\nHeadline: "${args.title}"\nRecord ID: ${key}` }],
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

    if (name === "get_study_tasks") {
      const todos = await fetchFirebaseData('todos');
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({ count: todos.length, tasks: todos }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "get_syllabus_structure_for_ai") {
      const fbNotes = await fetchFirebaseData('notes');
      const structure = {};

      Object.entries(SYLLABUS_INDEX).forEach(([subKey, sub]) => {
        if (args.subject_id && args.subject_id !== "all" && normalizeSubjectId(args.subject_id) !== subKey) {
          return;
        }

        const subNotes = fbNotes.filter(n => normalizeSubjectId(n.subject) === subKey || normalizeSubjectId(n.subjectId) === subKey);

        structure[subKey] = {
          code: sub.code,
          title: sub.title,
          credits: sub.credits,
          units: sub.units.map(u => {
            const unitNotes = subNotes.filter(n => (n.unit || "").toLowerCase().includes(u.unit.toLowerCase()));
            return {
              unit: u.unit,
              title: u.title,
              topicsCount: u.topics.length,
              topics: u.topics,
              publishedNotesCount: unitNotes.length,
              publishedNoteTitles: unitNotes.map(n => n.title || n.topic)
            };
          })
        };
      });

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify({
              author: DEFAULT_AUTHOR,
              syllabusStructure: structure
            }, null, 2)
          }],
          isError: false
        }
      };
    }

    if (name === "get_hub_stats") {
      const [notes, lectures, announcements, todos] = await Promise.all([
        fetchFirebaseData('notes'),
        fetchFirebaseData('lectures'),
        fetchFirebaseData('announcements'),
        fetchFirebaseData('todos')
      ]);

      const stats = {
        totalPublishedNotes: notes.length,
        notesBySubject: {},
        totalLectureLogs: lectures.length,
        totalAnnouncements: announcements.length,
        totalStudyTasks: todos.length,
        activeTasksCount: todos.filter(t => !t.done).length,
        defaultAuthor: DEFAULT_AUTHOR,
        protocol: "MCP 2024-11-05 (JSON-RPC 2.0)"
      };

      Object.keys(SYLLABUS_INDEX).forEach(subKey => {
        stats.notesBySubject[subKey] = notes.filter(n => normalizeSubjectId(n.subject) === subKey || normalizeSubjectId(n.subjectId) === subKey).length;
      });

      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2)
          }],
          isError: false
        }
      };
    }

    return { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Tool '${name}' not recognized` } };
  }

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
    if (uri === "bca3://syllabus/structure") {
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
    return { jsonrpc: "2.0", id: reqId, error: { code: -32602, message: `Resource '${uri}' not found` } };
  }

  if (method === "prompts/list") {
    return { jsonrpc: "2.0", id: reqId, result: { prompts: PROMPTS } };
  }

  if (method === "prompts/get") {
    const pName = params.name;
    const pArgs = params.arguments || {};
    if (pName === "create_syllabus_study_guide") {
      const sub = SYLLABUS_INDEX[normalizeSubjectId(pArgs.subject_id)] || SYLLABUS_INDEX["comp-arch"];
      return {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          description: `Create a comprehensive university study guide under Baljot Chohan's name for ${sub.title}.`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `You are an elite Computer Science educator for Panjab University BCA 3rd Semester.\nWrite a comprehensive, exam-ready study guide for '${pArgs.topic}' under '${pArgs.unit_number}' of ${sub.title} (${sub.code}).\nAuthor must be set to 'Baljot Chohan'. Include:\n1. Core Concept Definition & Mathematical/Architectural Theory\n2. Clean ASCII or Block Diagram Representation\n3. Step-by-Step Algorithm or Code with Time/Space Complexities\n4. 5 High-Yield Panjab University Exam Questions with Model Answers\n5. Key Formula Cheatsheet & Summary Callout\n\nAfter drafting, invoke 'create_and_publish_note' to publish it live to the hub.`
              }
            }
          ]
        }
      };
    }
    return { jsonrpc: "2.0", id: reqId, error: { code: -32602, message: `Prompt '${pName}' not found` } };
  }

  return { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Method '${method}' not supported` } };
}

// Vercel Serverless Function Export
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passkey, X-Author-Name');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: "online",
      name: "BCA III Academic Hub Serverless MCP Endpoint",
      authors: ["Baljot Chohan", "Mehakpreet Kaur"],
      university: "Panjab University, Chandigarh",
      semester: "BCA 3rd Semester (2026-27)",
      protocolVersion: PROTOCOL_VERSION,
      toolsCount: PUBLIC_TOOLS.length + ADMIN_TOOLS.length,
      availableTools: [...PUBLIC_TOOLS, ...ADMIN_TOOLS].map(t => t.name)
    });
  }

  if (req.method === 'POST') {
    try {
      const authHeader = req.headers['authorization'] || req.headers['x-admin-passkey'] || '';
      const authorHeader = req.headers['x-author-name'] || '';
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const response = await handleMcpRpc(payload, authHeader, authorHeader);
      return res.status(200).json(response);
    } catch (err) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON payload" }
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
