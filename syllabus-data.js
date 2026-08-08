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
      digitalNotes: [
        {
          id: "note-ca-1",
          unit: "Unit I",
          title: "Arithmetic Logic Shift Unit (ALSU) Design",
          date: "2026-08-01",
          readTime: "6 min read",
          tags: ["ALSU", "RTL", "Microoperations"],
          content: `### 1. What is an ALSU?
An **Arithmetic Logic Shift Unit (ALSU)** is a multi-purpose combinational circuit that performs:
1. **Arithmetic Microoperations**: Addition, Subtraction, Increment, Decrement, Transfer.
2. **Logic Microoperations**: 16 Boolean functions (AND, OR, XOR, NOT, NAND, NOR, etc.).
3. **Shift Microoperations**: Logical shift left/right, Arithmetic shift left/right, Circular rotate.

---

### 2. Selection Variables & Function Table
| Select Lines (S3 S2 S1 S0) | Cin | Operation | Function Description |
|---|---|---|---|
| 0 0 0 0 | 0 | F = A | Transfer A |
| 0 0 0 0 | 1 | F = A + 1 | Increment A |
| 0 0 0 1 | 0 | F = A + B | Arithmetic Addition |
| 0 0 0 1 | 1 | F = A + B + 1 | Addition with Carry |
| 0 0 1 0 | 0 | F = A + B' | 1's Complement Subtraction |
| 0 0 1 0 | 1 | F = A + B' + 1 | 2's Complement Subtraction (A - B) |
| 0 0 1 1 | 0 | F = A - 1 | Decrement A |
| 0 1 0 0 | X | F = A ∧ B | Bitwise AND |
| 0 1 0 1 | X | F = A ∨ B | Bitwise OR |
| 0 1 1 0 | X | F = A ⊕ B | Bitwise XOR |
| 0 1 1 1 | X | F = A' | Bitwise NOT (Invert A) |
| 1 0 0 0 | X | F = shr A | Shift Right A |
| 1 0 0 1 | X | F = shl A | Shift Left A |

> 💡 **Exam Tip**: In university exams, always draw the single-stage ALSU diagram showing the 4x1 Multiplexer receiving arithmetic, logic, and shift inputs.`
        },
        {
          id: "note-ca-2",
          unit: "Unit III",
          title: "8086 Microprocessor Architecture & BIU vs EU",
          date: "2026-08-04",
          readTime: "8 min read",
          tags: ["8086", "BIU", "EU", "Assembly"],
          content: `### 1. Dual Processing Concept in 8086
The Intel 8086 is a **16-bit microprocessor** with a 20-bit address bus (can address up to **1 MB of RAM**). It is partitioned into two independent functional units operating in parallel (pipelining):
1. **Bus Interface Unit (BIU)**
2. **Execution Unit (EU)**

---

### 2. Bus Interface Unit (BIU)
The BIU handles all data and address transfers on the external buses for the EU:
- **6-Byte Instruction Stream Queue (FIFO)**: Pre-fetches instructions while the EU is decoding/executing previous instructions.
- **Segment Registers (16-bit)**:
  - \`CS\` (Code Segment)
  - \`DS\` (Data Segment)
  - \`SS\` (Stack Segment)
  - \`ES\` (Extra Segment)
- **Instruction Pointer (\`IP\`)**: Holds the 16-bit offset of the next instruction to fetch.
- **Address Generation Circuit**: Computes the 20-bit physical address:
$$\\text{Physical Address} = (\\text{Segment Register} \\times 16) + \\text{Offset}$$

---

### 3. Execution Unit (EU)
The EU decodes and executes instructions received from the 6-byte queue:
- **General Purpose Registers**: \`AX\` (Accumulator), \`BX\` (Base), \`CX\` (Count), \`DX\` (Data).
- **Pointers & Indices**: \`SP\` (Stack Pointer), \`BP\` (Base Pointer), \`SI\` (Source Index), \`DI\` (Destination Index).
- **16-bit ALU & Flag Register (9 active flags)**:
  - 6 Status Flags: \`CF\` (Carry), \`PF\` (Parity), \`AF\` (Auxiliary), \`ZF\` (Zero), \`SF\` (Sign), \`OF\` (Overflow).
  - 3 Control Flags: \`TF\` (Trap/Single-step), \`IF\` (Interrupt Enable), \`DF\` (Direction).

\`\`\`assembly
; 8086 Physical Address Calculation Example:
; CS = 2000H, IP = 0150H
; Physical Address = 20000H + 0150H = 20150H

MOV AX, 2000H
MOV DS, AX          ; Load Data Segment base address
MOV SI, 0200H       ; Offset into Data Segment
MOV AL, [SI]        ; Read byte at physical address 20200H
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-01", time: "10:00 AM", topic: "Von Neumann vs Harvard Architecture & RTL", unit: "Unit I", description: "Stored program concept, bus organization with multiplexers, and register transfer notation.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-03", time: "10:00 AM", topic: "Arithmetic & Logic Microoperations Implementation", unit: "Unit I", description: "Binary adder-subtractor, composite arithmetic circuit, and 4-bit ALSU selection table.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-05", time: "11:30 AM", topic: "Instruction Cycle: Fetch, Decode & Execute", unit: "Unit II", description: "Step-by-step timing signals (T0–T6), Program Counter, Instruction Register, and addressing modes.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-08", time: "10:00 AM", topic: "8086 Internal Architecture: BIU & EU Breakdown", unit: "Unit III", description: "6-byte instruction queue, 20-bit physical address formula, and segment register organization.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-10", time: "10:00 AM", topic: "Memory Hierarchy, Cache Mapping & Associative Memory", unit: "Unit III", description: "Direct, Associative, and Set-Associative Cache mapping procedures.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-12", time: "11:30 AM", topic: "Direct Memory Access (DMA) & I/O Handshaking", unit: "Unit IV", description: "DMA Controller, bus request/grant cycles, and source vs destination strobe control.", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-ds-1",
          unit: "Unit I",
          title: "Infix to Postfix Conversion using Stacks",
          date: "2026-08-02",
          readTime: "7 min read",
          tags: ["Stacks", "Postfix", "Algorithms"],
          content: `### 1. Why Postfix Notation?
Postfix notation (Reverse Polish Notation) eliminates the need for parentheses and operator precedence rules during computer expression evaluation.

---

### 2. Operator Precedence Hierarchy
1. \`^\` (Exponentiation) → Highest, Right-to-Left associative.
2. \`*\`, \`/\`, \`%\` → High, Left-to-Right associative.
3. \`+\`, \`-\` → Low, Left-to-Right associative.

---

### 3. Step-by-Step Algorithm
1. Scan the Infix expression character by character from left to right.
2. If the scanned character is an **operand**, append it directly to the Postfix output string.
3. If the scanned character is a \`'('\`, push it onto the Stack.
4. If the scanned character is a \`')'\`, pop from the Stack and append to output until a \`'('\` is encountered. Discard both parentheses.
5. If an **operator** is encountered:
   - While the Stack is not empty and precedence of the operator on top of Stack $\\ge$ precedence of scanned operator, pop it to output.
   - Push the scanned operator onto the Stack.
6. When the expression ends, pop all remaining operators from the Stack to the output.

\`\`\`cpp
// C++ Infix to Postfix Converter
#include <iostream>
#include <stack>
#include <string>

int precedence(char op) {
    if (op == '^') return 3;
    if (op == '*' || op == '/') return 2;
    if (op == '+' || op == '-') return 1;
    return -1;
}

std::string infixToPostfix(std::string s) {
    std::stack<char> st;
    std::string result = "";
    for (char c : s) {
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))
            result += c;
        else if (c == '(')
            st.push('(');
        else if (c == ')') {
            while (!st.empty() && st.top() != '(') {
                result += st.top(); st.pop();
            }
            if (!st.empty()) st.pop(); // Pop '('
        } else {
            while (!st.empty() && precedence(st.top()) >= precedence(c)) {
                result += st.top(); st.pop();
            }
            st.push(c);
        }
    }
    while (!st.empty()) { result += st.top(); st.pop(); }
    return result;
}
\`\`\``
        },
        {
          id: "note-ds-2",
          unit: "Unit III",
          title: "Binary Search Tree (BST) Operations & Traversals",
          date: "2026-08-06",
          readTime: "9 min read",
          tags: ["BST", "Trees", "Recursion"],
          content: `### 1. BST Property
For every node $X$ in a Binary Search Tree:
- All values in the **left subtree** are strictly less than $X.data$.
- All values in the **right subtree** are strictly greater than $X.data$.

---

### 2. Three Traversal Orders
- **Inorder (Left, Root, Right)**: Produces ascending sorted output!
- **Preorder (Root, Left, Right)**: Useful for creating a copy of the tree or prefix expressions.
- **Postorder (Left, Right, Root)**: Useful for deleting trees or postfix expressions.

\`\`\`cpp
struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};

// Recursive Inorder Traversal
void inorder(Node* root) {
    if (!root) return;
    inorder(root->left);
    std::cout << root->data << " ";
    inorder(root->right);
}

// BST Insertion
Node* insert(Node* root, int key) {
    if (!root) return new Node(key);
    if (key < root->data)
        root->left = insert(root->left, key);
    else if (key > root->data)
        root->right = insert(root->right, key);
    return root;
}
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-02", time: "09:30 AM", topic: "Asymptotic Notation (Big-O, Omega, Theta) & 2D Arrays", unit: "Unit I", description: "Time-space trade-offs, row-major vs column-major addressing derivations.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-04", time: "09:30 AM", topic: "Stack ADT & Infix to Postfix Conversion", unit: "Unit I", description: "Array implementation, overflow conditions, and operator precedence stacks.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-06", time: "10:30 AM", topic: "Singly & Doubly Linked List Operations", unit: "Unit II", description: "Node insertion at head, tail, and arbitrary position with pointer manipulation.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-08", time: "09:30 AM", topic: "Binary Search Tree Construction & Traversals", unit: "Unit III", description: "Recursive insertion, deletion with 3 cases (0, 1, 2 children), and inorder sorting.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-11", time: "09:30 AM", topic: "Graph Representations & BFS / DFS Algorithms", unit: "Unit III", description: "Adjacency Matrix vs Adjacency List, queue-based BFS and stack-based DFS traversal.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-13", time: "10:30 AM", topic: "Divide & Conquer: Merge Sort vs Quick Sort Analysis", unit: "Unit IV", description: "Partitioning mechanics, recurrence relations, and best/worst case space complexities.", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-nm-1",
          unit: "Unit II",
          title: "Newton-Raphson Method Formula & Derivation",
          date: "2026-08-03",
          readTime: "6 min read",
          tags: ["Newton-Raphson", "Root Finding", "Calculus"],
          content: `### 1. Geometric Interpretation
The Newton-Raphson method approximates the root of $f(x) = 0$ by drawing a tangent line to the curve at $(x_n, f(x_n))$ and finding where this tangent intersects the x-axis.

$$\\text{Slope of Tangent } f'(x_n) = \\frac{f(x_n) - 0}{x_n - x_{n+1}}$$

Rearranging gives the celebrated **Newton-Raphson Iteration Formula**:
$$x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}$$

---

### 2. Quadratic Convergence
Newton-Raphson possesses **order of convergence $p = 2$**. This means the number of correct decimal digits roughly doubles with every single iteration!

\`\`\`cpp
// C++ Newton-Raphson Implementation
#include <iostream>
#include <cmath>

// Example: f(x) = x^3 - x - 2 = 0
double f(double x) { return x*x*x - x - 2; }
double fPrime(double x) { return 3*x*x - 1; }

double newtonRaphson(double x0, double tolerance = 1e-6, int maxIter = 100) {
    double x = x0;
    for (int i = 0; i < maxIter; ++i) {
        double fx = f(x);
        double fpx = fPrime(x);
        if (std::abs(fpx) < 1e-12) {
            std::cerr << "Derivative near zero! Method fails." << std::endl;
            return x;
        }
        double h = fx / fpx;
        x = x - h;
        if (std::abs(h) < tolerance) {
            std::cout << "Converged in " << i + 1 << " iterations! Root = " << x << std::endl;
            return x;
        }
    }
    return x;
}
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-03", time: "11:00 AM", topic: "Absolute vs Relative Errors & Chopping vs Rounding", unit: "Unit I", description: "Floating point arithmetic, error propagation in multiplication and division.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-07", time: "11:00 AM", topic: "Newton-Raphson vs Regula-Falsi Rate of Convergence", unit: "Unit II", description: "Geometric derivation of tangent formula, failure conditions when f'(x)=0.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-09", time: "11:00 AM", topic: "Gauss Elimination & Partial Pivoting for Linear Systems", unit: "Unit III", description: "Forward elimination, back-substitution, and avoiding division by near-zero pivots.", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-ml-1",
          unit: "Unit III",
          title: "Decision Tree Entropy & Information Gain (ID3)",
          date: "2026-08-04",
          readTime: "8 min read",
          tags: ["Decision Trees", "Entropy", "ID3 Algorithm"],
          content: `### 1. What is Entropy?
In Information Theory, **Entropy $H(S)$** measures the impurity or disorder in a dataset $S$:

$$H(S) = - \\sum_{i=1}^{c} p_i \\log_2(p_i)$$

- If all instances belong to the same class: $H(S) = 0$ (Pure set).
- If classes are split equally 50/50: $H(S) = 1.0$ (Maximum impurity).

---

### 2. Information Gain Formula
Information Gain $Gain(S, A)$ measures the expected reduction in entropy achieved by partitioning on attribute $A$:

$$Gain(S, A) = H(S) - \\sum_{v \\in Values(A)} \\frac{|S_v|}{|S|} H(S_v)$$

The ID3 algorithm selects the attribute with the **highest Information Gain** as the decision node!

\`\`\`python
# Python Entropy & Information Gain
import numpy as np

def entropy(y):
    _, counts = np.unique(y, return_counts=True)
    probs = counts / len(y)
    return -np.sum([p * np.log2(p) for p in probs if p > 0])

def information_gain(y_parent, y_left, y_right):
    n = len(y_parent)
    h_parent = entropy(y_parent)
    h_left = entropy(y_left)
    h_right = entropy(y_right)
    weighted_h = (len(y_left) / n) * h_left + (len(y_right) / n) * h_right
    return h_parent - weighted_h
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-04", time: "12:00 PM", topic: "Supervised vs Unsupervised Paradigms & Bias-Variance", unit: "Unit I", description: "Overfitting prevention, cross-validation splits, and mathematical formulation of bias-variance.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-07", time: "12:00 PM", topic: "Decision Tree Classifier: Entropy & ID3 Math", unit: "Unit III", description: "Calculating entropy, information gain on PlayTennis dataset, and tree pruning.", fileUrl: "Syllabus.pdf" },
        { date: "2026-08-10", time: "12:00 PM", topic: "Support Vector Machines (SVM) & Kernel Hyperplanes", unit: "Unit III", description: "Margin maximization, support vectors, and soft-margin slack variables.", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-eng-1",
          unit: "Unit I",
          title: "Structure of Formal Technical Project Reports",
          date: "2026-08-05",
          readTime: "5 min read",
          tags: ["Reports", "Technical Writing", "Documentation"],
          content: `### 1. Standard Technical Report Structure
1. **Title Page**: Project title, student name, roll number, department, university, date.
2. **Executive Summary / Abstract**: 150–250 words summarizing the problem, approach, and key findings.
3. **Table of Contents**: List of sections and sub-sections with accurate page numbers.
4. **Introduction**: Problem background, objectives, scope, and technical constraints.
5. **Technical Methodology**: System architecture, algorithms used, and tools employed.
6. **Results & Evaluation**: Data analysis, benchmarks, and discussion of performance.
7. **Conclusion & Recommendations**: Key takeaways and future enhancement paths.
8. **References / Bibliography**: Standard IEEE / APA citation format.`
        }
      ],
      lectures: [
        { date: "2026-08-05", time: "02:00 PM", topic: "Technical Report Writing: Abstract & Executive Memos", unit: "Unit I", description: "Writing structured technical summaries and formal engineering project documentation.", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-web-1",
          unit: "Unit I",
          title: "CSS Grid vs Flexbox Layout Mastery",
          date: "2026-08-02",
          readTime: "6 min read",
          tags: ["CSS Grid", "Flexbox", "Responsive"],
          content: `### 1. When to Use CSS Grid vs Flexbox?
- **CSS Grid (2-Dimensional)**: Use when you need to align elements in **both rows and columns simultaneously** (e.g. dashboards, card grids, whole-page holy grail layouts).
- **Flexbox (1-Dimensional)**: Use when you need to align items along **a single axis** (e.g. navigation bars, button rows, centering an element).

\`\`\`css
/* Responsive Card Grid with Zero Media Queries */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Flexbox Centering */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-02", time: "01:00 PM", topic: "HTML5 Semantic Structure & CSS Grid Architecture", unit: "Unit I", description: "Building responsive multi-column layouts with CSS Grid repeat(auto-fit, minmax()).", fileUrl: "Syllabus.pdf" }
      ]
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
      digitalNotes: [
        {
          id: "note-be-1",
          unit: "Unit I",
          title: "RESTful API Design & HTTP Status Codes",
          date: "2026-08-04",
          readTime: "7 min read",
          tags: ["REST", "Express", "Node.js"],
          content: `### 1. REST API URL Conventions
- \`GET /api/notes\` — Fetch all notes
- \`GET /api/notes/:id\` — Fetch specific note by ID
- \`POST /api/notes\` — Create a new note (JSON payload in request body)
- \`PUT /api/notes/:id\` — Update existing note
- \`DELETE /api/notes/:id\` — Delete note

\`\`\`javascript
// Express.js REST API Endpoint
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/lectures', async (req, res) => {
  try {
    const { subject } = req.query;
    const lectures = await db.getLecturesBySubject(subject);
    res.status(200).json({ success: true, count: lectures.length, data: lectures });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
\`\`\``
        }
      ],
      lectures: [
        { date: "2026-08-04", time: "03:00 PM", topic: "RESTful API Endpoints & Request/Response Lifecycle", unit: "Unit I", description: "Setting up Node.js Express server, handling JSON payloads and HTTP status codes.", fileUrl: "Syllabus.pdf" }
      ]
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
