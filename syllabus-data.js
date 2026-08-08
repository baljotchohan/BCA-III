// BCA 3rd Semester — Panjab University (2026-27 Batch)
// Complete Subject Data, Units I–IV, Digital Notes Repository, and Sample Lecture Logs.

const BCA_3RD_SEM_DATA = {
  semester: "BCA 3rd Semester",
  session: "2026-27",
  university: "Panjab University, Chandigarh",
  creditFramework: "NEP-2020 CBCS Framework",
  subjects: [
    {
      id: "comp-arch",
      code: "BCA-DSC-3(Maj)-301",
      title: "Computer Architecture",
      shortTitle: "Comp Arch",
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "cpu",
      color: "#141413",
      bgClass: "bg-cactus",
      badge: "Major Paper • 4 Credits",
      description: "Computer organization, digital logic circuits, ALU design, memory hierarchy, 8086 microprocessor architecture, and I/O organization.",
      tags: ["Register Transfer", "8086 Microprocessor", "Memory Hierarchy", "DMA Controller", "ALSU Design"],
      units: [
        {
          unitNumber: "Unit I",
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
          summary: "Covers the fundamental hardware building blocks of computers: Register Transfer Language (RTL), arithmetic/logic microoperations, and designing a complete 4-bit ALSU.",
          keyPoints: [
            "RTL uses notation like R2 ← R1 to describe internal data transfers.",
            "Common bus system uses multiplexers (2^n:1 MUX) or 3-state bus buffers.",
            "ALSU combines arithmetic, logic, and shift operations using select lines (S3, S2, S1, S0, Cin)."
          ]
        },
        {
          unitNumber: "Unit II",
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
          summary: "Focuses on the Von Neumann instruction cycle (Fetch, Decode, Execute), register transfers, addressing modes, and hardware interrupt handling.",
          keyPoints: [
            "Program Counter (PC) holds the address of the next instruction.",
            "Instruction Register (IR) holds the 16-bit instruction word currently being executed.",
            "Indirect addressing (I=1 in bit 15) requires an extra memory access cycle to fetch the effective address."
          ]
        },
        {
          unitNumber: "Unit III",
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
          summary: "Explores memory hierarchy from registers to virtual memory, cache mapping techniques, and the dual-core architecture of the 8086 microprocessor (BIU & EU).",
          keyPoints: [
            "Cache mapping methods: Direct Mapping (fast, high conflict), Associative (flexible, expensive), Set-Associative (balanced).",
            "8086 Bus Interface Unit (BIU) handles instruction fetching (6-byte queue) and physical address calculation (Segment:Offset).",
            "Execution Unit (EU) executes instructions using the 16-bit ALU, general registers, and Flag Register."
          ]
        },
        {
          unitNumber: "Unit IV",
          title: "Input-Output & DMA Organization",
          topics: [
            "Input-Output organization: I/O interface, connection of I/O bus to I/O devices",
            "Isolated I/O and memory mapped I/O",
            "Asynchronous data transfer: source-initiated and destination-initiated strobe control and handshaking",
            "Modes of transfer: programmed I/O data transfer, interrupt-initiated I/O data transfer",
            "Direct Memory Access (DMA): DMA controller, bus request/grant, burst & cycle-stealing transfer"
          ],
          summary: "Details CPU communication with peripherals, handshaking protocols, and high-speed Direct Memory Access (DMA) data transfers.",
          keyPoints: [
            "Memory-mapped I/O uses common memory addresses and instructions for both RAM and I/O devices.",
            "Isolated I/O uses dedicated IN and OUT instructions with separate 8-bit/16-bit address spaces.",
            "DMA controller requests bus mastery (HOLD/HLDA) to transfer blocks directly between RAM and device without CPU intervention."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "data-structures",
      code: "BCA-DSC-3(Min)-302",
      title: "Data Structures",
      shortTitle: "Data Structures",
      type: "DSC - Minor",
      credits: 4,
      theoryHours: 60,
      icon: "network",
      color: "#141413",
      bgClass: "bg-heather",
      badge: "Core Minor • 4 Credits",
      description: "Arrays, stacks, queues, linked lists, trees, graphs, searching and sorting algorithms with full asymptotic complexity analysis.",
      tags: ["Linked Lists", "Binary Search Trees", "DFS & BFS", "Sorting Algorithms", "Stack Applications"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Arrays, Complexity & Stacks",
          topics: [
            "Basic Concepts: Introduction to Complexity (Time & Space, Big-O, Omega, Theta), Data Structures and operations",
            "Applications of Data Structures, Primitive vs Non-primitive data structures",
            "Arrays: Introduction, Types (1D, 2D, Multidimensional), Row-major and column-major memory representation",
            "Arrays: Applications and operations (Insertion, Deletion, Search, Traversal)",
            "Stacks: Introduction, memory representation using array and pointer",
            "Stacks: Applications (Infix to Postfix conversion, Postfix evaluation), Recursion"
          ],
          summary: "Covers asymptotic complexity analysis, multidimensional array memory mapping formulas, stack LIFO principles, and expression conversions.",
          keyPoints: [
            "Row-major 2D address: Loc(A[i][j]) = Base + W * [(i - LBR) * N + (j - LBC)].",
            "Column-major 2D address: Loc(A[i][j]) = Base + W * [(j - LBC) * M + (i - LBR)].",
            "Stack uses TOP pointer; Push checks for Overflow (TOP == MAX - 1), Pop checks for Underflow (TOP == -1)."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Linked Lists & Queues",
          topics: [
            "Linked List: Definition, Types (Singly, Doubly, Header, Circular Linked List)",
            "Linked List Operations: traversing, searching, inserting at beginning/end/position, deleting",
            "Linked List memory representation, Applications, polynomial manipulation (addition & multiplication)",
            "Queue: Introduction, Types (Linear Queue, Circular Queue, Deque, Priority Queue)",
            "Queue: Memory Representation and Applications in operating system scheduling"
          ],
          summary: "Dynamic memory allocation using linked nodes, bidirectional doubly linked lists, circular buffers, and FIFO queue architectures.",
          keyPoints: [
            "Singly Linked List allows one-way traversal; requires O(N) to reach the tail without a tail pointer.",
            "Circular Queue solves the false-overflow bug of linear arrays using modulo arithmetic: (rear + 1) % MAX.",
            "Deque (Double Ended Queue) allows insertion and deletion from both ends."
          ]
        },
        {
          unitNumber: "Unit III",
          title: "Trees & Graphs",
          topics: [
            "Trees: Definition and Basic concepts (degree, height, depth), Representation in Contiguous Storage",
            "Binary Tree, Types (Full, Complete, Strict), Binary Tree Traversal (Preorder, Inorder, Postorder)",
            "Searching, Insertion and deletion in Binary Trees",
            "Binary Search Tree (BST) properties, search, insertion, deletion cases",
            "Graphs: Introduction, Memory Representation (Adjacency Matrix, Adjacency List)",
            "Graph Traversal: Breadth-First Search (BFS) and Depth-First Search (DFS)"
          ],
          summary: "Hierarchical non-linear structures, Binary Search Trees (BST), tree traversals (Inorder, Preorder, Postorder), and graph algorithms (BFS & DFS).",
          keyPoints: [
            "BST Inorder traversal always produces elements in ascending sorted order.",
            "BST search/insertion average time is O(log N), worst case is O(N) for skewed trees.",
            "BFS uses a Queue (level-by-level), DFS uses a Stack / recursion (deep branch first)."
          ]
        },
        {
          unitNumber: "Unit IV",
          title: "Searching & Sorting Analysis",
          topics: [
            "Searching: Linear Search (O(N)) and Binary Search (O(log N)) analysis",
            "Sorting: Bubble sort, Insertion sort, Selection sort",
            "Sorting: Merge Sort (Divide & Conquer), Quick sort (Partitioning & Pivot selection)",
            "Comparison of various Searching and Sorting algorithms based on best/avg/worst case complexities"
          ],
          summary: "Comprehensive sorting and searching comparative analysis, divide-and-conquer principles, partition schemes, and stability.",
          keyPoints: [
            "Binary Search requires a sorted array: Time complexity is O(log N).",
            "Merge Sort is stable with O(N log N) time in all cases, but requires O(N) auxiliary space.",
            "Quick Sort is in-place with average O(N log N) time, but worst case is O(N^2) if pivot is chosen poorly."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "numerical-methods",
      code: "BCA-DSC-3(Min)-303",
      title: "Computer Oriented Numerical Methods",
      shortTitle: "Numerical Methods",
      type: "DSC - Minor",
      credits: 4,
      theoryHours: 60,
      icon: "calculator",
      color: "#141413",
      bgClass: "bg-sky",
      badge: "Core Minor • 4 Credits",
      description: "Error analysis, root finding for non-linear equations, simultaneous linear systems, interpolation, numerical integration, and ODEs.",
      tags: ["Newton-Raphson", "Gauss-Seidel", "Simpson's 1/3rd", "Runge-Kutta 4th Order", "Interpolation"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Error Analysis & Floating Point Arithmetic",
          topics: [
            "Introduction, need of numerical methods, numerical analysis vs numerical methods",
            "Exact and approximate numbers, accuracy and precision, significant digits",
            "Measures of Error: absolute error, relative error, and percentage error",
            "Types of error: blunder, modeling, inherent, numerical (round off, chopping, truncation)",
            "Error propagation in addition, subtraction, multiplication and division",
            "Arithmetic of normalized floating-point numbers and its error consequences"
          ],
          summary: "Foundational mathematical errors in computing: round-off, truncation, chopping, and error propagation formulas.",
          keyPoints: [
            "Absolute Error: E_a = |True Value - Approximate Value|.",
            "Relative Error: E_r = |True Value - Approximate Value| / |True Value|.",
            "Percentage Error: E_p = E_r * 100%."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Non-Linear Equations & Root Finding",
          topics: [
            "Types of Equations: Linear, quadratic, higher degree polynomial, transcendental",
            "Non-Linear Equations: direct vs indirect methods, bracketing vs open-end iterative methods",
            "Choosing initial approximation, termination criteria, intermediate value theorem",
            "Root-finding: Bisection Method (rate of convergence, error bounds)",
            "False Position Method (Regula Falsi)",
            "Newton-Raphson Method (quadratic convergence, geometric interpretation)",
            "Birge-Vieta Method for polynomial roots"
          ],
          summary: "Algorithms for finding real roots of algebraic and transcendental equations using bracketing and tangent methods.",
          keyPoints: [
            "Bisection Method guarantees convergence if f(a)*f(b) < 0 with linear rate of convergence (1 bit per step).",
            "Newton-Raphson has quadratic order of convergence (order 2), requiring x_{n+1} = x_n - f(x_n)/f'(x_n).",
            "Regula Falsi combines bracketing stability with linear interpolation speed."
          ]
        },
        {
          unitNumber: "Unit III",
          title: "Simultaneous Equations & Interpolation",
          topics: [
            "Simultaneous Linear Equations: Gauss Elimination Method, concept of Partial and Complete Pivoting",
            "Gauss-Jordan Method, Gauss-Seidel Iterative Method (convergence conditions)",
            "Interpolation: need of interpolation, interpolation vs extrapolation",
            "Finite differences: forward, backward, shift, and divided difference tables",
            "Newton's Forward Difference Method, Newton's Backward Difference Method",
            "Newton's Divided Difference Method, Lagrange's Interpolation Formula",
            "Concept of Inverse Interpolation"
          ],
          summary: "Solving systems of linear equations (direct & iterative) and estimating intermediate values using polynomial interpolation.",
          keyPoints: [
            "Gauss-Seidel converges if the coefficient matrix is diagonally dominant: |a_ii| > sum_{j != i} |a_ij|.",
            "Newton's Forward formula is used for interpolating near the beginning of equal-interval data.",
            "Lagrange's Interpolation is used for unequal intervals without difference tables."
          ]
        },
        {
          unitNumber: "Unit IV",
          title: "Numerical Integration & Differential Equations",
          topics: [
            "Numerical Integration: Newton-Cotes Quadrature Formulae",
            "Trapezoidal Rule, Simpson's 1/3rd Rule, Simpson's 3/8th Rule",
            "Ordinary Differential Equations (ODEs): Initial value problems",
            "Euler's Method, Modified Euler's Method (Predictor-Corrector)",
            "Runge-Kutta Methods (2nd order & 4th order RK Method)"
          ],
          summary: "Definite integral evaluation (Trapezoidal, Simpson's) and numerical solutions to initial value ODEs (Euler, RK-4).",
          keyPoints: [
            "Trapezoidal Rule approximates area with straight lines: (h/2) * [y0 + yn + 2*(y1 + ... + yn-1)].",
            "Simpson's 1/3rd Rule requires an EVEN number of intervals: (h/3) * [(y0 + yn) + 4*(odd y) + 2*(even y)].",
            "Runge-Kutta 4th Order (RK4) has local truncation error O(h^5) and global error O(h^4)."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "machine-learning",
      code: "BCA-DSC-3(Maj)-304",
      title: "Introduction to Machine Learning",
      shortTitle: "Machine Learning",
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "brain-circuit",
      color: "#141413",
      bgClass: "bg-cactus",
      badge: "Major Paper • 4 Credits",
      description: "Machine learning foundations, data preprocessing, supervised classification, unsupervised clustering, and neural network architectures.",
      tags: ["Supervised Learning", "PCA Reduction", "SVM & Naive Bayes", "Neural Networks", "K-Means"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Foundations & Learning Systems",
          topics: [
            "Concept of Machine Learning, historical perspective and AI vs ML",
            "Supervised, Unsupervised, and Reinforcement Learning paradigms",
            "Training Data vs Validation Data vs Test Data",
            "Designing a Learning System: choosing training experience, target function, representation",
            "Key Issues in Machine Learning: curse of dimensionality, bias-variance tradeoff",
            "Real-world Applications of Machine Learning in computer science"
          ],
          summary: "Core paradigms of machine learning, designing learning agents, and understanding the fundamental Bias-Variance tradeoff.",
          keyPoints: [
            "Supervised: Learns from labeled data (features X and target Y).",
            "High Bias = Underfitting (model is too simple).",
            "High Variance = Overfitting (model memorizes noise in training set)."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Data Preprocessing & Dimensionality Reduction",
          topics: [
            "Understanding of data: structured vs unstructured, categorical vs continuous",
            "Data preprocessing: handling missing values, outlier detection and imputation",
            "Normalizing data: Min-Max scaling, Z-score standardization",
            "Feature scaling and feature selection techniques",
            "Overfitting vs Underfitting: regularization and cross-validation",
            "Data reduction using Principal Component Analysis (PCA) — eigenvectors and eigenvalues"
          ],
          summary: "Preparing real-world dirty datasets: imputation, scaling (Min-Max, Z-score), and dimensionality reduction via PCA.",
          keyPoints: [
            "Z-Score Standardization: z = (x - mu) / sigma (centers data around mean 0 with unit variance).",
            "Min-Max Normalization: x_norm = (x - min) / (max - min) (bounds features to [0, 1]).",
            "PCA projects data onto orthogonal principal components with maximal variance using covariance eigenvectors."
          ]
        },
        {
          unitNumber: "Unit III",
          title: "Supervised Learning & Classification",
          topics: [
            "Concept of Classification vs Regression",
            "Decision Tree Classifier: ID3, C4.5, Entropy and Information Gain",
            "k-Nearest Neighbor (k-NN) algorithm and distance metrics (Euclidean, Manhattan)",
            "Naïve Bayes Classifier: Bayes theorem, conditional independence assumption",
            "Support Vector Machine (SVM): hyperplanes, margin maximization, kernel trick",
            "Artificial Neural Networks (ANN): Perceptron, Multilayer Perceptron, Backpropagation algorithm",
            "Classification evaluation metrics: Confusion Matrix, Precision, Recall, F1-Score, ROC-AUC"
          ],
          summary: "Supervised classifiers: Decision Trees (Entropy/Gain), k-NN, Naive Bayes, Support Vector Machines (SVM), and Multi-Layer Perceptrons.",
          keyPoints: [
            "Entropy: H(S) = - sum (p_i * log2(p_i)). Information Gain = H(Parent) - sum(Weighted H(Children)).",
            "SVM seeks the maximum margin hyperplane separating classes: w.x + b = 0.",
            "Evaluation: Precision = TP / (TP + FP), Recall = TP / (TP + FN), F1 = 2 * (P * R) / (P + R)."
          ]
        },
        {
          unitNumber: "Unit IV",
          title: "Clustering & Deep Learning Introduction",
          topics: [
            "Unsupervised Learning: K-means Clustering algorithm (step-by-step)",
            "Limits of K-Means (sensitivity to initial centroids, non-convex shapes)",
            "Density-Based Spatial Clustering of Applications with Noise (DBSCAN)",
            "Concept of Deep Learning vs Traditional Machine Learning",
            "Architecture of Convolutional Neural Networks (CNN): Convolution, ReLU, Pooling, Fully Connected layers",
            "Recurrent Neural Networks (RNN) and sequential data processing"
          ],
          summary: "Unsupervised clustering (K-Means, DBSCAN) and deep learning foundations (CNNs for images, RNNs for sequences).",
          keyPoints: [
            "K-Means iteratively updates centroids until convergence; uses the Elbow Method to choose optimal K.",
            "CNN uses Convolution filters to extract spatial feature maps and MaxPooling to reduce spatial dimensions.",
            "RNN maintains hidden state vectors across time steps to process sequential temporal inputs."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "english-3",
      code: "AEC-3-301",
      title: "English-3 (Ability Enhancement)",
      shortTitle: "English-3",
      type: "AEC",
      credits: 2,
      theoryHours: 30,
      icon: "book-open",
      color: "#141413",
      bgClass: "bg-heather",
      badge: "Ability Enhancement • 2 Credits",
      description: "Technical reading comprehension, professional report drafting, precision grammar mastery, and oral presentation skills.",
      tags: ["Technical Reports", "Business Writing", "Comprehension", "Viva Skills"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Technical Writing & Drafting",
          topics: [
            "Technical report drafting, structure of formal engineering reports",
            "Business correspondence: formal emails, project proposals, and executive memos",
            "Abstract writing and executive summaries for IT projects"
          ],
          summary: "Professional documentation, structure of engineering project reports, proposals, and concise executive summaries.",
          keyPoints: [
            "Formal reports must include: Title, Abstract, Introduction, Technical Methodology, Findings, and Recommendations.",
            "Professional emails should have a clear subject line, polite salutation, concise action points, and signature block."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Grammar & Oral Communication",
          topics: [
            "Advanced sentence structure, active vs passive voice in technical documentation",
            "Common grammatical errors and vocabulary enhancement for IT professionals",
            "Oral presentation skills, group discussions, and technical viva preparation"
          ],
          summary: "Grammar precision, active/passive voice conventions in research, and speaking strategies for interviews and vivas.",
          keyPoints: [
            "Use passive voice when focusing on the result or process: 'The algorithm was optimized'.",
            "Use active voice when focusing on the agent: 'We designed the database architecture'."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "web-dev",
      code: "CSA-MDC-103/203/303",
      title: "Web Development / Designing",
      shortTitle: "Web Dev",
      type: "MDC",
      credits: 3,
      theoryHours: 45,
      icon: "layout",
      color: "#141413",
      bgClass: "bg-cactus",
      badge: "Multi-Disciplinary • 3 Credits",
      description: "HTML5 semantic structure, CSS3 Flexbox & Grid modern layouts, JavaScript DOM manipulation, and responsive web design.",
      tags: ["HTML5 Semantic", "CSS Grid & Flex", "JavaScript DOM", "Responsive UI"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Semantic HTML5 & Modern CSS3",
          topics: [
            "HTML5 semantic layout elements (header, nav, main, section, article, aside, footer)",
            "CSS3 selectors, box model, transitions, animations and CSS custom properties",
            "Modern layout systems: CSS Flexbox and CSS Grid architecture",
            "Mobile-first responsive design, media queries, and viewport settings"
          ],
          summary: "Modern semantic web layouts, CSS custom properties (variables), Flexbox 1D alignment, and CSS Grid 2D architecture.",
          keyPoints: [
            "Semantic HTML improves accessibility (ARIA) and search engine indexing.",
            "CSS Grid is 2D (rows and columns simultaneously), Flexbox is 1D (either row or column).",
            "Mobile-first media queries use min-width: @media (min-width: 768px) { ... }."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Client-side JavaScript & DOM",
          topics: [
            "JavaScript ES6+ fundamentals: let/const, arrow functions, template literals, destructuring",
            "Document Object Model (DOM) querying, event listeners, bubbling and delegation",
            "Form validation, local storage persistence, and dynamic component rendering"
          ],
          summary: "Modern JavaScript programming, event delegation, DOM manipulation, asynchronous fetching, and client-side persistence.",
          keyPoints: [
            "Event Delegation listens on a common parent to handle events from multiple dynamic child elements.",
            "localStorage stores key-value string pairs persistently across browser sessions.",
            "Destructuring ({ a, b } = obj) provides clean syntax for extracting object properties."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    },
    {
      id: "backend-dev",
      code: "CSA-SEC-103/203/303",
      title: "Backend Web Development",
      shortTitle: "Backend Dev",
      type: "SEC",
      credits: 3,
      theoryHours: 45,
      icon: "server",
      color: "#141413",
      bgClass: "bg-sky",
      badge: "Skill Enhancement • 3 Credits",
      description: "Client-server architecture, REST API design, database connectivity, middleware routing, and session authentication.",
      tags: ["Node.js / Express", "RESTful APIs", "SQL Connectivity", "Authentication"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Client-Server Architecture & HTTP",
          topics: [
            "Client-Server architecture, HTTP protocol methods (GET, POST, PUT, DELETE), headers & status codes",
            "Setting up backend runtime (Node.js/Python), package management and environment configs",
            "Building RESTful API endpoints and handling request/response lifecycle"
          ],
          summary: "HTTP methods, status codes (200, 201, 400, 401, 404, 500), REST design conventions, and express routing.",
          keyPoints: [
            "REST APIs use standard HTTP verbs: GET (Read), POST (Create), PUT (Update/Replace), DELETE (Remove).",
            "Status Codes: 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error."
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Database Integration & Security",
          topics: [
            "Relational database design, SQL querying, connection pools and CRUD operations",
            "Middleware concepts: logging, error handling, CORS and body parsing",
            "Authentication mechanisms: JWT tokens, password hashing (bcrypt), and session security"
          ],
          summary: "Database connectivity, SQL injection prevention, middleware pipelines, and JWT authentication.",
          keyPoints: [
            "Middleware functions (req, res, next) intercept and process requests before reaching the route handler.",
            "Never store plain text passwords: always use salted hashing with bcrypt.",
            "JSON Web Tokens (JWT) consist of Header.Payload.Signature for stateless authentication."
          ]
        }
      ],
      digitalNotes: [],
      lectures: []
    }
  ],
  todos: [
    { id: 1, text: "Revise Von Neumann & 8086 block diagrams for Computer Architecture", subject: "Computer Architecture", done: false, date: "2026-08-10" },
    { id: 2, text: "Implement Infix to Postfix Stack algorithm in C++", subject: "Data Structures", done: false, date: "2026-08-11" },
    { id: 3, text: "Practice Newton-Raphson & Gauss Elimination numerical problems", subject: "Computer Oriented Numerical Methods", done: true, date: "2026-08-08" },
    { id: 4, text: "Write Python script for Decision Tree & Confusion Matrix evaluation", subject: "Introduction to Machine Learning", done: false, date: "2026-08-12" }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BCA_3RD_SEM_DATA;
}
