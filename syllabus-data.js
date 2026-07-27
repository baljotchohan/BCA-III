// BCA 3rd Semester — Panjab University 2026-27
// Subject list + official unit-wise syllabus, taken directly from Syllabus.pdf.
// Note: the PDF only publishes detailed Unit/Practical breakdowns for the DSC
// (major/minor) papers — English-3, Web Development/Designing and Backend Web
// Development only appear in the credit-structure table, so their "units" and
// "practicals" arrays are intentionally left empty rather than invented.
// Lecture data starts empty — each subject's "lectures" array gets filled in
// later, one entry at a time, as classes actually happen.

const BCA_3RD_SEM_DATA = {
  semester: "BCA 3rd Semester",
  session: "2026-27",
  university: "Panjab University, Chandigarh",
  subjects: [
    {
      id: "comp-arch",
      code: "BCA-DSC-3(Maj)-301",
      title: "Computer Architecture",
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "cpu",
      color: "#6366f1",
      accentBg: "#eef2ff",
      description: "Computer organization, digital logic circuits, ALU design, memory hierarchy, 8086 microprocessor architecture, and I/O organization.",
      units: [
        { unitNumber: "Unit I", topics: [
          "Definition of computer organization, design and computer architecture",
          "Digital Systems: basic block diagram of computer",
          "ALU design: Register Transfer Language, bus and memory transfer",
          "Microoperations and their hardware implementation — Arithmetic microoperations: binary adder, binary adder-subtractor, binary incrementor, composite arithmetic circuit",
          "Logic microoperations",
          "Shift microoperations — 4-bit combinational shifter",
          "Arithmetic Logic Shift Unit"
        ] },
        { unitNumber: "Unit II", topics: [
          "Basic Computer Organization: stored program organization, Von Neumann architecture",
          "Micro-operations and macro-operations",
          "Instruction code, instruction format, direct and indirect addressing",
          "Basic computer registers",
          "Common bus system",
          "Computer Instructions — memory reference, register reference, input output instructions",
          "Instruction cycle",
          "Interrupt cycle; types of interrupts",
          "Introduction to assembly language, assembly language vs machine language"
        ] },
        { unitNumber: "Unit III", topics: [
          "Memory organization: memory hierarchy",
          "RAM and ROM chips, memory connection to CPU",
          "Associative memory",
          "Cache memory and mapping procedures — associative, set associative, direct mapping",
          "Virtual memory — paging and segmentation",
          "Microprocessor architecture: 8086/8088 — features, block diagram",
          "8086/8088 memory and register organization, flag register, addressing modes"
        ] },
        { unitNumber: "Unit IV", topics: [
          "Input-Output organization: I/O interface, connection of I/O bus to I/O devices",
          "Isolated I/O and memory mapped I/O",
          "Asynchronous data transfer: source-initiated and destination-initiated strobe control and handshaking",
          "Modes of transfer: programmed I/O data transfer, interrupt-initiated I/O data transfer",
          "Direct Memory Access: DMA controller, DMA transfer"
        ] }
      ],
      practicals: [],
      lectures: []
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
      color: "#059669",
      accentBg: "#ecfdf5",
      description: "Arrays, stacks, queues, linked lists, trees, graphs, searching and sorting algorithms.",
      units: [
        { unitNumber: "Unit I", topics: [
          "Basic Concepts: Introduction to Complexity, Data Structures and their operations",
          "Applications of Data Structures, Basic data structures",
          "Arrays: Introduction, Types of Arrays, Memory representation",
          "Arrays: Applications and operations",
          "Stacks: Introduction, memory representation",
          "Stacks: Applications, operations, Recursion"
        ] },
        { unitNumber: "Unit II", topics: [
          "Linked List: Definition, Types (Singly, Doubly, Header, Circular)",
          "Linked List Operations: traversing, searching, inserting, deleting",
          "Linked List memory representation, Applications, polynomial manipulation",
          "Queue: Introduction, Types",
          "Queue: Memory Representation and Applications"
        ] },
        { unitNumber: "Unit III", topics: [
          "Trees: Definition and Basic concepts, Representation in Contiguous Storage",
          "Binary Tree, Binary Tree Traversal",
          "Searching, Insertion and deletion in Binary Trees",
          "Binary Search Tree",
          "Graphs: Introduction, Memory Representation",
          "Graph Traversal (DFS and BFS)"
        ] },
        { unitNumber: "Unit IV", topics: [
          "Searching: Binary and Linear Search",
          "Sorting: Bubble sort, Insertion sort, Selection sort",
          "Sorting: Merge Sort, Quick sort",
          "Comparison of various Searching and Sorting algorithms"
        ] }
      ],
      practicals: [
        "Array operations: Traversal, Insertion, Deletion",
        "Sorting algorithms: Bubble, Insertion, Selection, Merge, Quick Sort",
        "Searching algorithms: Linear and Binary Search",
        "Implementation of Stack using an array",
        "Implementation of Linear Queue using an array",
        "Implementation of Circular Queue using an array",
        "Implementation of Singly Linked List",
        "Implementation of Doubly Linked List",
        "Binary Tree: Insertion, Deletion, Searching",
        "Graph Traversal (DFS & BFS) implementation"
      ],
      lectures: []
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
      color: "#d97706",
      accentBg: "#fffbeb",
      description: "Error analysis, root finding for non-linear equations, simultaneous equations, interpolation, numerical integration, and ODEs.",
      units: [
        { unitNumber: "Unit I", topics: [
          "Introduction, need of numerical methods, numerical analysis vs numerical methods",
          "Exact and approximate numbers, accuracy and precision, significant digits",
          "Measures of Error: absolute, relative and percentage error",
          "Types of error: blunder, modeling, inherent, numerical (round off, chopping, truncation)",
          "Error propagation in addition, subtraction, multiplication and division",
          "Arithmetic of normalized floating-point numbers and its error consequences"
        ] },
        { unitNumber: "Unit II", topics: [
          "Types of Equations: Linear, quadratic, higher degree polynomial, transcendental",
          "Non-Linear Equations: direct vs indirect methods, bracketing vs open-end iterative methods",
          "Choosing initial approximation, termination criteria, intermediate value theorem",
          "Root-finding: Bisection Method, False Position Method",
          "Root-finding: Newton-Raphson Method, Birge-Vieta Method"
        ] },
        { unitNumber: "Unit III", topics: [
          "Simultaneous Linear Equations: Gauss Elimination Method, concept of Pivoting",
          "Simultaneous Linear Equations: Gauss-Jordan Method, Gauss-Seidal Method",
          "Interpolation: need of interpolation, interpolation vs extrapolation",
          "Finite differences: forward, backward, divided difference tables",
          "Newton's Forward Difference Method, Newton's Backward Difference Method",
          "Newton's Divided Difference Method, Lagrange's Method",
          "Concept of Inverse Interpolation"
        ] },
        { unitNumber: "Unit IV", topics: [
          "Numerical Integration: Newton-Cotes Formulae — Trapezoidal Rule",
          "Simpson's 1/3rd Rule, Simpson's 3/8th Rule",
          "Ordinary Differential Equations: Euler's Method",
          "Runge-Kutta Methods (2nd order & 4th order)",
          "Predictor Corrector Method — Modified Euler's Method"
        ] }
      ],
      practicals: [
        "Root of a non-linear equation: Bisection, False Position, Newton Raphson, Birge-Vieta methods",
        "Simultaneous linear equations: Gauss Elimination, Gauss Jordan, Gauss Seidal methods",
        "Interpolation (equal intervals): Newton's Forward / Backward Difference Method",
        "Interpolation (unequal intervals): Newton's Divided Difference Method / Lagrange's Method",
        "Numerical Integration: Trapezoidal Rule, Simpson's 1/3rd & 3/8th Rule",
        "Solution of ODEs: Euler's Method & Runge-Kutta Method"
      ],
      lectures: []
    },
    {
      id: "machine-learning",
      code: "BCA-DSC-3(Maj)-304",
      title: "Introduction to Machine Learning",
      type: "DSC - Major",
      credits: 4,
      theoryHours: 60,
      icon: "brain-circuit",
      color: "#8b5cf6",
      accentBg: "#f5f3ff",
      description: "ML fundamentals, data preprocessing, supervised & unsupervised learning algorithms, and an intro to deep learning.",
      units: [
        { unitNumber: "Unit I", topics: [
          "Concept of Machine Learning",
          "Supervised and Unsupervised learning",
          "Training vs Test Data",
          "Reinforcement learning",
          "Designing a Learning System",
          "Issues in Machine Learning",
          "Applications of Machine Learning"
        ] },
        { unitNumber: "Unit II", topics: [
          "Understanding of data and its preprocessing",
          "Normalizing data",
          "Feature scaling and feature selection techniques",
          "Overfitting",
          "Data reduction using Principal Component Analysis"
        ] },
        { unitNumber: "Unit III", topics: [
          "Concept of Classification",
          "Decision Tree",
          "k-Nearest Neighbor",
          "Naïve Bayes Classifier",
          "Support Vector Machine",
          "Neural Networks and backpropagation algorithm",
          "Classification evaluation metrics"
        ] },
        { unitNumber: "Unit IV", topics: [
          "K-means Clustering",
          "Limits of K-Means",
          "DBSCAN",
          "Concept of Deep Learning",
          "Architecture of Convolutional Neural Networks (CNN)",
          "Recurrent Neural Networks (RNN)"
        ] }
      ],
      practicals: [],
      lectures: []
    },
    {
      id: "english-3",
      code: "AEC-3-301",
      title: "English-3",
      type: "AEC",
      credits: 2,
      theoryHours: 30,
      icon: "book-open",
      color: "#ec4899",
      accentBg: "#fdf2f8",
      description: "Technical reading comprehension, report drafting, grammar mastery, and presentation skills.",
      units: [],
      practicals: [],
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
      color: "#0284c7",
      accentBg: "#f0f9ff",
      description: "HTML5 semantic structure, CSS3 Flexbox & Grid layouts, DOM manipulation, and responsive web design.",
      units: [],
      practicals: [],
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
      color: "#10b981",
      accentBg: "#ecfdf5",
      description: "Client-server architecture, REST API routing, database connectivity, and session management.",
      units: [],
      practicals: [],
      lectures: []
    }
  ]
};

// To-do list starts empty — add tasks straight from the dashboard.
const INITIAL_TODOS = [];
