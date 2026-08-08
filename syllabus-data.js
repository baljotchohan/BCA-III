// BCA 3rd Semester — Panjab University (2026-27 Batch)
// Complete Subject Data, Units I–IV, Practicals, Sample Lecture Logs, and Revision Notes.

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
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "cpu",
      color: "#141413",
      bgClass: "bg-cactus",
      badge: "Major Paper • 4 Credits",
      description: "Computer organization, digital logic circuits, ALU design, memory hierarchy, 8086 microprocessor architecture, and I/O organization.",
      tags: ["Register Transfer", "8086 Microprocessor", "Memory Hierarchy", "DMA Controller"],
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
          ]
        }
      ],
      practicals: [
        "Study of 8086 Microprocessor kit and register simulator",
        "Implementation of 8-bit and 16-bit addition & subtraction in 8086 Assembly",
        "Data transfer operations using different addressing modes",
        "Multiplication and division of unsigned & signed numbers",
        "Finding largest and smallest numbers in an array",
        "Sorting an array of numbers in ascending order",
        "String manipulation programs: reversing a string, palindrome check",
        "Simulating ALU micro-operations using logic gates"
      ],
      revisionNotes: `// 8086 Assembly Quick Reference
MOV AX, 0x1234   ; Load immediate data into AX
MOV BX, 0x5678   ; Load immediate data into BX
ADD AX, BX       ; AX = AX + BX
DAA              ; Decimal adjust after addition
HLT              ; Halt processor execution`,
      lectures: [
        { date: "2026-08-01", time: "10:00 AM", topic: "Von Neumann vs Harvard Architecture", description: "Stored program concept, bus organization and instruction registers.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-05", time: "11:30 AM", topic: "Register Transfer Language & 4-bit ALSU", description: "Design of arithmetic logic shift unit and combinational shifter.", fileUrl: "Syllabus.pdf" }
      ]
    },
    {
      id: "data-structures",
      code: "BCA-DSC-3(Min)-302",
      title: "Data Structures",
      type: "DSC - Minor",
      credits: 4,
      theoryHours: 30,
      practicalHours: 60,
      icon: "network",
      color: "#141413",
      bgClass: "bg-heather",
      badge: "Core Minor • 4 Credits",
      description: "Arrays, stacks, queues, linked lists, trees, graphs, searching and sorting algorithms with full C/C++ lab implementations.",
      tags: ["Linked Lists", "Binary Search Trees", "DFS & BFS", "Sorting Algorithms"],
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
          ]
        }
      ],
      practicals: [
        "Array operations: Traversal, Insertion, Deletion at given index",
        "Sorting algorithms: Bubble, Insertion, Selection, Merge, Quick Sort",
        "Searching algorithms: Linear and Binary Search implementation",
        "Implementation of Stack using an array and linked list",
        "Infix to Postfix expression conversion and evaluation using Stack",
        "Implementation of Linear Queue using an array",
        "Implementation of Circular Queue using an array",
        "Implementation of Singly Linked List (Insert, Delete, Display, Search)",
        "Implementation of Doubly Linked List with bidirectional traversal",
        "Binary Search Tree: Insertion, Deletion, Inorder/Preorder/Postorder traversal",
        "Graph Traversal (DFS & BFS) implementation using Adjacency List"
      ],
      revisionNotes: `// C++ Binary Search Implementation
int binarySearch(int arr[], int n, int key) {
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = low + (high - low) / 2;
    if (arr[mid] == key) return mid;
    else if (arr[mid] < key) low = mid + 1;
    else high = mid - 1;
  }
  return -1; // Not found
}`,
      lectures: [
        { date: "2026-08-02", time: "09:30 AM", topic: "Asymptotic Notation & Array Memory Mapping", description: "Row-major vs column-major addressing formulas.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-06", time: "10:30 AM", topic: "Singly Linked List Implementation in C++", description: "Node insertion at head, tail, and arbitrary position.", fileUrl: "Syllabus.pdf" }
      ]
    },
    {
      id: "numerical-methods",
      code: "BCA-DSC-3(Min)-303",
      title: "Computer Oriented Numerical Methods",
      type: "DSC - Minor",
      credits: 4,
      theoryHours: 30,
      practicalHours: 60,
      icon: "calculator",
      color: "#141413",
      bgClass: "bg-sky",
      badge: "Core Minor • 4 Credits",
      description: "Error analysis, root finding for non-linear equations, simultaneous linear equations, interpolation, numerical integration, and ODEs.",
      tags: ["Newton-Raphson", "Gauss-Seidel", "Simpson's 1/3rd", "Runge-Kutta 4th Order"],
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
          ]
        }
      ],
      practicals: [
        "Find real root of f(x)=0 using Bisection Method",
        "Find real root using Regula-Falsi (False Position) Method",
        "Find real root using Newton-Raphson Method",
        "Find root of polynomial using Birge-Vieta Method",
        "Solve system of linear equations using Gauss Elimination Method",
        "Solve system of linear equations using Gauss-Seidel Method",
        "Calculate interpolated value using Newton's Forward Difference",
        "Calculate interpolated value using Newton's Backward Difference",
        "Lagrange's Interpolation for unequal intervals",
        "Evaluate definite integral using Trapezoidal & Simpson's 1/3rd Rule",
        "Solve first order ODE using Euler's and 4th order Runge-Kutta Method"
      ],
      revisionNotes: `// Newton-Raphson Method Formula
// x_{n+1} = x_n - f(x_n) / f'(x_n)
double newtonRaphson(double x0, double tol = 0.0001) {
  double h = f(x0) / fPrime(x0);
  while (abs(h) >= tol) {
    h = f(x0) / fPrime(x0);
    x0 = x0 - h;
  }
  return x0;
}`,
      lectures: [
        { date: "2026-08-03", time: "11:00 AM", topic: "Absolute vs Relative Errors & Chopping", description: "Floating point normalization and significant figures.", fileUrl: "Syllabus.pdf" }
      ]
    },
    {
      id: "machine-learning",
      code: "BCA-DSC-3(Maj)-304",
      title: "Introduction to Machine Learning",
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "brain-circuit",
      color: "#141413",
      bgClass: "bg-cactus",
      badge: "Major Paper • 4 Credits",
      description: "Machine learning foundations, data preprocessing, supervised classification, unsupervised clustering, and neural network architectures.",
      tags: ["Supervised Learning", "PCA Reduction", "SVM & Naive Bayes", "Neural Networks"],
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
          ]
        }
      ],
      practicals: [
        "Data exploration and visualization with Python (Pandas, Matplotlib, Seaborn)",
        "Handling missing values and feature scaling using Scikit-Learn",
        "Implementation of Linear Regression for price prediction",
        "Implementation of Logistic Regression and Decision Tree classification",
        "k-Nearest Neighbors (k-NN) on Iris Dataset",
        "Naive Bayes Classifier on text/email spam dataset",
        "Support Vector Machine (SVM) classification with linear and RBF kernels",
        "K-Means Clustering on unlabelled customer segmentation data",
        "Evaluation of models using Confusion Matrix, ROC-AUC curve",
        "Building a simple Multi-Layer Perceptron using PyTorch/TensorFlow"
      ],
      revisionNotes: `// Decision Tree Information Gain (Entropy)
// Entropy(S) = -p_+ log_2(p_+) - p_- log_2(p_-)
// Gain(S, A) = Entropy(S) - Sum (|S_v| / |S| * Entropy(S_v))`,
      lectures: [
        { date: "2026-08-04", time: "12:00 PM", topic: "Supervised Learning & Bias-Variance Tradeoff", description: "Overfitting prevention and k-fold cross validation.", fileUrl: "Syllabus.pdf" }
      ]
    },
    {
      id: "english-3",
      code: "AEC-3-301",
      title: "English-3 (Ability Enhancement)",
      type: "AEC",
      credits: 2,
      theoryHours: 30,
      icon: "book-open",
      color: "#141413",
      bgClass: "bg-heather",
      badge: "Ability Enhancement • 2 Credits",
      description: "Technical reading comprehension, professional report drafting, precision grammar mastery, and viva presentation skills.",
      tags: ["Technical Reports", "Business Writing", "Comprehension", "Viva Skills"],
      units: [
        {
          unitNumber: "Unit I",
          title: "Technical Writing & Drafting",
          topics: [
            "Technical report drafting, structure of formal engineering reports",
            "Business correspondence: formal emails, project proposals, and executive memos",
            "Abstract writing and executive summaries for IT projects"
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Grammar & Oral Communication",
          topics: [
            "Advanced sentence structure, active vs passive voice in technical documentation",
            "Common grammatical errors and vocabulary enhancement for IT professionals",
            "Oral presentation skills, group discussions, and technical viva preparation"
          ]
        }
      ],
      practicals: [],
      revisionNotes: `// Formal Report Structure:
1. Title Page & Executive Summary
2. Table of Contents
3. Introduction & Problem Statement
4. Technical Methodology
5. Findings & Analysis
6. Conclusions & Actionable Recommendations`,
      lectures: []
    },
    {
      id: "web-dev",
      code: "CSA-MDC-103/203/303",
      title: "Web Development / Designing",
      type: "MDC",
      credits: 3,
      practicalHours: 60,
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
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Client-side JavaScript & DOM",
          topics: [
            "JavaScript ES6+ fundamentals: let/const, arrow functions, template literals, destructuring",
            "Document Object Model (DOM) querying, event listeners, bubbling and delegation",
            "Form validation, local storage persistence, and dynamic component rendering"
          ]
        }
      ],
      practicals: [
        "Design a responsive portfolio website using HTML5 Semantic tags",
        "Create complex multi-column responsive layouts using CSS Grid & Flexbox",
        "Implement a dynamic Study Dashboard with local storage persistence",
        "Interactive form validation with client-side error handling",
        "Build a modal dialog system with keyboard shortcuts (Esc & Tab focus trap)"
      ],
      revisionNotes: `// CSS Grid Holy Grail Layout
.app-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 70px 1fr auto;
  min-height: 100vh;
}`,
      lectures: []
    },
    {
      id: "backend-dev",
      code: "CSA-SEC-103/203/303",
      title: "Backend Web Development",
      type: "SEC",
      credits: 3,
      practicalHours: 60,
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
          ]
        },
        {
          unitNumber: "Unit II",
          title: "Database Integration & Security",
          topics: [
            "Relational database design, SQL querying, connection pools and CRUD operations",
            "Middleware concepts: logging, error handling, CORS and body parsing",
            "Authentication mechanisms: JWT tokens, password hashing (bcrypt), and session security"
          ]
        }
      ],
      practicals: [
        "Build a REST API server with routing for CRUD operations",
        "Connect API backend to a relational database (PostgreSQL/MySQL)",
        "Implement user registration & login with hashed passwords and JWT",
        "Create middleware for route protection and role-based access control",
        "Develop an API for student attendance and lecture logging"
      ],
      revisionNotes: `// Express REST API Route Example
app.get('/api/lectures', async (req, res) => {
  const lectures = await db.query('SELECT * FROM lectures ORDER BY date DESC');
  res.json({ success: true, data: lectures });
});`,
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
