/**
 * MEDHAS: R26 Regulation Curriculum Specification
 * Regulation: R26 | Year: I B.Tech | Semester: I Semester
 * 
 * Centralized Single Source of Truth for all 12 Engineering Departments at SRKR Engineering College:
 * CSE, CSIT, AIML, AIDS, IT, CSBS, CSD, CIC, ECE, EEE, CIVIL, MECH
 */

export type DepartmentCode = 
  | 'CSE'
  | 'CSIT'
  | 'AIML'
  | 'AIDS'
  | 'IT'
  | 'CSBS'
  | 'CSD'
  | 'CIC'
  | 'ECE'
  | 'EEE'
  | 'CIVIL'
  | 'MECH';

export type CourseType = 'THEORY' | 'PRACTICAL';

export interface UnitDetail {
  unit_number: number;
  title: string;
  weightage?: string;
  topics: string[];
  key_formulas?: string[];
  important_questions: string[];
  lecture_summary?: string;
}

export interface LabExperiment {
  experiment_number: number;
  title: string;
  description?: string;
  viva_questions?: string[];
}

export interface SubjectCourse {
  id: string;
  name: string;
  shortName: string;
  type: CourseType;
  credits: number;
  units?: UnitDetail[];
  experiments?: LabExperiment[];
}

export interface DepartmentCurriculum {
  code: DepartmentCode;
  name: string;
  academicYear: string;
  semester: string;
  regulation: string;
  theory: SubjectCourse[];
  labs: SubjectCourse[];
}

// -------------------------------------------------------------
// REUSABLE MASTER SUBJECT DEFINITIONS (R26 I B.Tech I Semester)
// -------------------------------------------------------------

const SUBJECT_ETC: SubjectCourse = {
  id: 'R26-ETC',
  name: 'English for Technical Communication',
  shortName: 'ETC',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Grammar, Structure & Lexicon in Technical Writing',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Articles, Prepositions, Tenses and Subject-Verb Agreement',
        'Word Formation: Affixes, Synonyms, Antonyms and Collocations',
        'Sentence Structures: Simple, Compound, Complex and Cohesive Devices',
        'Technical vs General Vocabulary in Engineering Documentation'
      ],
      important_questions: [
        'Explain the role of precise grammatical syntax in writing technical engineering specifications.',
        'Correct given sentences for subject-verb agreement and tense consistency.'
      ],
      lecture_summary: 'Grammatical accuracy, formal register, and cohesive transitions are essential for engineering technical reports.'
    },
    {
      unit_number: 2,
      title: 'Technical Reading Comprehension & Information Transfer',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Skimming and Scanning Technical Journals and Research Papers',
        'Identifying Main Ideas, Supporting Details and Tone of Author',
        'Information Transfer: Interpreting Bar Charts, Pie Charts and Schematics into Text',
        'Critical Reading and Inferential Comprehension'
      ],
      important_questions: [
        'Read the technical passage on renewable energy and answer contextual questions.',
        'Convert the given flowchart of a water purification plant into a detailed explanatory paragraph.'
      ],
      lecture_summary: 'Engineers must quickly extract critical insights from technical documentation and convert graphical data into analytical prose.'
    },
    {
      unit_number: 3,
      title: 'Formal Correspondence & Business Communication',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Formal Letters: Inquiry, Request, Permission and Complaint Letters',
        'Professional Email Etiquette: Subject Lines, Salutations, Concise Body & Attachments',
        'Memos, Circulars and Meeting Minutes Preparation',
        'DPDP Privacy and Compliance Notices in Professional Communication'
      ],
      important_questions: [
        'Draft a formal email to the Head of the Department requesting permission for an industrial visit.',
        'Write a letter to a vendor complaining about defective laboratory equipment and seeking replacement.'
      ],
      lecture_summary: 'Formal workplace correspondence demands clarity, professional courtesy, and strict structural norms.'
    },
    {
      unit_number: 4,
      title: 'Technical Report Writing & Project Proposals',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Structure of a Formal Engineering Report: Title, Abstract, Body, Results & References',
        'Progress Reports, Feasibility Studies and Laboratory Inspection Reports',
        'Writing Technical Abstracts and Executive Summaries',
        'Citation Styles (IEEE, APA) and Avoiding Plagiarism'
      ],
      important_questions: [
        'Draft an executive summary and introduction for a first-year engineering project report.',
        'Differentiate between Feasibility Reports and Laboratory Investigation Reports with structural outlines.'
      ],
      lecture_summary: 'Project documentation requires clear problem formulation, methodological rigor, and academic integrity.'
    },
    {
      unit_number: 5,
      title: 'Professional Presentation & Oral Communication',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Planning and Structuring Technical Presentations using Visual Aids',
        'Verbal and Non-Verbal Dynamics: Body Language, Eye Contact and Voice Modulation',
        'Group Discussions: Initiative, Team Dynamics, Active Listening and Summarization',
        'Interview Skills: Elevator Pitch, STAR Technique for Technical Interviews'
      ],
      important_questions: [
        'What strategies ensure an engaging and persuasive technical presentation for an engineering audience?',
        'Explain the STAR (Situation, Task, Action, Result) method in technical HR interviews with examples.'
      ],
      lecture_summary: 'Effective verbal delivery, structured articulation, and confident body language enhance technical leadership.'
    }
  ]
};

const SUBJECT_LAC: SubjectCourse = {
  id: 'R26-LAC',
  name: 'Linear Algebra & Calculus (LAC)',
  shortName: 'LAC',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Matrices & Systems of Linear Equations',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Rank of a Matrix: Echelon Form and Normal Form',
        'System of Linear Equations: Consistency, Homogeneous & Non-Homogeneous Systems',
        'Gauss Elimination Method and Gauss-Jordan Method',
        'Applications of Linear Systems to Electrical Networks and Engineering Systems'
      ],
      key_formulas: [
        'Rank: r(A) = number of non-zero rows in row echelon form',
        'Consistency Criterion: r(A) = r([A|B]) for consistent non-homogeneous system',
        'Unique Solution: r(A) = r([A|B]) = n (number of variables)'
      ],
      important_questions: [
        'Test for consistency and solve the system of linear equations using Gauss Elimination.',
        'Find the rank of the given matrix by reducing it to Normal Form.'
      ],
      lecture_summary: 'Linear equations model engineering networks and circuits; matrix rank determines solvability and uniqueness.'
    },
    {
      unit_number: 2,
      title: 'Eigenvalues, Eigenvectors & Cayley-Hamilton Theorem',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Eigenvalues and Eigenvectors: Properties and Orthogonal Transformations',
        'Cayley-Hamilton Theorem: Statement and Verification',
        'Calculation of Inverse and Higher Powers of Matrices using Cayley-Hamilton',
        'Diagonalization of Matrices and Similarity Transformations'
      ],
      key_formulas: [
        'Characteristic Equation: |A - λI| = 0',
        'Trace(A) = Sum of eigenvalues; Det(A) = Product of eigenvalues',
        'Cayley-Hamilton: If P(λ) = 0, then P(A) = 0'
      ],
      important_questions: [
        'Find the eigenvalues and eigenvectors of a 3x3 symmetric matrix.',
        'Verify Cayley-Hamilton theorem for matrix A and hence compute A⁻¹ and A⁴.'
      ],
      lecture_summary: 'Eigen decomposition reveals resonant frequencies, stability characteristics, and geometric transformations in engineering.'
    },
    {
      unit_number: 3,
      title: 'Mean Value Theorems & Multivariable Differential Calculus',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Rolle\'s Theorem, Lagrange\'s and Cauchy\'s Mean Value Theorems (Without Proofs)',
        'Taylor\'s and Maclaurin\'s Series Expansions of Functions of One and Two Variables',
        'Partial Derivatives, Total Derivatives and Chain Rule',
        'Jacobians: Properties and Functional Dependence',
        'Maxima and Minima of Functions of Two Variables, Lagrange Multipliers'
      ],
      key_formulas: [
        'Jacobian: J = ∂(u,v)/∂(x,y) = |ux uy; vx vy|',
        'Lagrange Condition: ∇f = λ∇g'
      ],
      important_questions: [
        'Find the maximum and minimum values of f(x, y) = x³ + y³ - 3axy.',
        'Determine whether u = x + y/(1 - xy) and v = tan⁻¹(x) + tan⁻¹(y) are functionally dependent.'
      ],
      lecture_summary: 'Partial derivatives analyze multi-variable optimization in thermal, structural, and electrical modeling.'
    },
    {
      unit_number: 4,
      title: 'Multiple Integrals & Coordinate Transformations',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Double Integrals: Evaluation in Cartesian and Polar Coordinates',
        'Change of Order of Integration in Double Integrals',
        'Evaluation of Areas and Volumes using Double and Triple Integrals',
        'Change of Variables: Cartesian to Cylindrical and Spherical Polar Coordinates'
      ],
      key_formulas: [
        'dA = dx dy = r dr dθ (Polar)',
        'dV = dx dy dz = r dr dθ dz (Cylindrical) = ρ² sin φ dρ dφ dθ (Spherical)'
      ],
      important_questions: [
        'Evaluate ∬ e^(x² + y²) dx dy over the circular region x² + y² ≤ a² by changing to polar coordinates.',
        'Change the order of integration and evaluate ∫₀¹ ∫_x¹ (x / (x² + y²)) dy dx.'
      ],
      lecture_summary: 'Multiple integrals calculate physical quantities such as mass, center of gravity, moment of inertia, and flux.'
    },
    {
      unit_number: 5,
      title: 'Vector Calculus & Integral Theorems',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Vector Differential Operator: Gradient, Divergence and Curl (Physical Meanings)',
        'Directional Derivatives and Unit Normal Vectors to Surfaces',
        'Solenoidal and Irrotational Vector Fields, Scalar Potential Functions',
        'Vector Integration: Line, Surface and Volume Integrals',
        'Green\'s Theorem, Gauss Divergence Theorem and Stokes\' Theorem (Verification & Evaluation)'
      ],
      key_formulas: [
        'Green\'s Theorem: ∮ (M dx + N dy) = ∬ (∂N/∂x - ∂M/∂y) dx dy',
        'Gauss Divergence: ∬ F · n̂ dS = ∭ (∇ · F) dV',
        'Stokes\' Theorem: ∮ F · dr = ∬ (∇ × F) · n̂ dS'
      ],
      important_questions: [
        'Verify Gauss Divergence Theorem for F = 4xz î - y² ĵ + yz k̂ over a unit cube.',
        'Verify Green\'s Theorem in a plane for ∮ [(xy + y²) dx + x² dy] around the curve bounded by y = x and y = x².'
      ],
      lecture_summary: 'Vector calculus underpins electromagnetism, fluid mechanics, aerodynamics, and continuum mechanics.'
    }
  ]
};

const SUBJECT_CTPS_C: SubjectCourse = {
  id: 'R26-CTPSC',
  name: 'Computational Thinking and Problem Solving Using C (CTPS-C)',
  shortName: 'CTPS-C',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Introduction to Computing & Problem Solving Concepts',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Fundamentals of Computing: Hardware Architecture, CPU, Memory Hierarchy',
        'Algorithms, Flowcharts and Pseudo-code Representation of Algorithms',
        'Structure of a C Program, Compilation, Linking and Execution Lifecycle',
        'Data Types, Storage Sizes, Constants, Variables, Identifiers and Literals',
        'Operators: Arithmetic, Relational, Logical, Bitwise, Assignment and Ternary'
      ],
      key_formulas: [
        'Operator Precedence: Parentheses > Unary > Multiplicative > Additive > Relational > Logical > Assignment'
      ],
      important_questions: [
        'Draw a flowchart and write an algorithm to find the roots of a quadratic equation ax² + bx + c = 0.',
        'Explain the role of preprocessor directives, compiler, and linker in C program compilation.'
      ],
      lecture_summary: 'Computational thinking breaks real-world engineering problems into clear sequential logical structures.'
    },
    {
      unit_number: 2,
      title: 'Control Flow: Selection & Iteration Structures',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Conditional Statements: if, if-else, nested if-else and switch-case',
        'Looping Constructs: while, do-while, and for loops',
        'Nested Loops and Pattern Generation Algorithms',
        'Jump Statements: break, continue, goto, and return',
        'Prime Number Checking, Fibonacci Series, Factorial, GCD and Reverse Digits'
      ],
      important_questions: [
        'Write a C program to check whether a given integer is a Prime or Armstrong number.',
        'Explain the differences between while loop (entry-controlled) and do-while loop (exit-controlled).'
      ],
      lecture_summary: 'Branching and looping statements direct algorithmic flow and facilitate iterative mathematical modeling.'
    },
    {
      unit_number: 3,
      title: 'Arrays, Strings & Modular Programming',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        '1D and 2D Arrays: Declaration, Memory Layout, Initialization and Traversal',
        'Matrix Operations: Addition, Multiplication, Transpose and Diagonal Symmetry',
        'Searching and Sorting: Linear Search, Binary Search, Bubble Sort and Selection Sort',
        'Character Arrays and Strings: String I/O, Null Terminator (\'\\0\') and <string.h> Functions',
        'Functions: Definition, Declaration, Parameter Passing (Call by Value vs Reference), Recursion'
      ],
      important_questions: [
        'Write a C program to multiply two matrices after verifying dimension compatibility.',
        'Implement Binary Search algorithm on a sorted array and state its time complexity.'
      ],
      lecture_summary: 'Arrays store contiguous collections; modular functions enable maintainable, testable software components.'
    },
    {
      unit_number: 4,
      title: 'Pointers & Dynamic Memory Management',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Pointer Basics: Address Operator (&), Dereference Operator (*), Pointer Declaration',
        'Pointer Arithmetic and Relationship between Arrays and Pointers',
        'Pointers to Pointers (Double Pointers) and Pointers as Function Arguments',
        'Dynamic Memory Allocation: malloc(), calloc(), realloc(), free() in <stdlib.h>',
        'Memory Leaks, Dangling Pointers and Null Pointer Dereferencing Prevention'
      ],
      important_questions: [
        'Explain dynamic memory allocation functions in C with syntax and illustrative code.',
        'Write a C function to swap two numbers using pointer references.'
      ],
      lecture_summary: 'Pointers directly manipulate memory addresses, unlocking high efficiency and dynamic data allocation.'
    },
    {
      unit_number: 5,
      title: 'User-Defined Data Types & File Handling',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Structures: Declaration, Initialization, Member Access, Array of Structures',
        'Nested Structures and Structure Padding (Memory Alignment)',
        'Unions: Shared Memory Principle and Difference from Structures',
        'Typedef and Enumerated Data Types (enum)',
        'File Operations: Streams, FILE Pointer, fopen(), fclose(), Modes (r, w, a, rb, wb)',
        'File I/O: fgetc, fputc, fgets, fputs, fscanf, fprintf, fread, fwrite and fseek'
      ],
      important_questions: [
        'Differentiate between Structure and Union with respect to memory layout diagrams.',
        'Write a C program to store student academic records in a binary file and search by register number.'
      ],
      lecture_summary: 'Structures model complex real-world entities; file operations provide persistent storage for engineering data.'
    }
  ]
};

const SUBJECT_ACET: SubjectCourse = {
  id: 'R26-ACET',
  name: 'Applied Chemistry for Engineering Technologies',
  shortName: 'ACET',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Water Technology & Industrial Treatment',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Hardness of Water: Types (Temporary vs Permanent), Units (ppm, mg/L) and Estimation by EDTA Method',
        'Boiler Troubles: Scale & Sludge Formation, Caustic Embrittlement, Boiler Corrosion and Priming/Foaming',
        'Internal Treatment: Phosphate, Carbonate and Calgon Conditioning',
        'External Treatment: Ion-Exchange Demineralization Process and Zeolite Process',
        'Desalination of Brackish Water: Reverse Osmosis (RO) Principle, Membrane Technology and Electrodialysis'
      ],
      important_questions: [
        'Explain the estimation of total hardness of water using standard EDTA titration method with reactions.',
        'Describe the Ion-Exchange process for industrial water softening with a neat schematic diagram.'
      ],
      lecture_summary: 'Water purification and boiler water treatment are crucial for thermal and manufacturing operations.'
    },
    {
      unit_number: 2,
      title: 'Electrochemistry, Batteries & Energy Storage',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Electrochemical Cells, Electrode Potential, Nernst Equation and Reference Electrodes (Calomel)',
        'Batteries as Energy Storage: Primary vs Secondary Batteries',
        'Lead-Acid Battery: Construction, Charging/Discharging Reactions and Maintenance',
        'Lithium-Ion Battery: Working Mechanism, Anode/Cathode Materials and Applications in EVs/Laptops',
        'Fuel Cells: Hydrogen-Oxygen Fuel Cell Principle, Reactions, Advantages and Limitations'
      ],
      important_questions: [
        'Derive the Nernst equation for single electrode potential and explain its engineering applications.',
        'Explain the working principle and electrochemical reactions of the Lithium-ion battery.'
      ],
      lecture_summary: 'Electrochemical cells and lithium energy storage systems drive electric vehicles and modern mobile devices.'
    },
    {
      unit_number: 3,
      title: 'Corrosion Science & Surface Engineering',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Mechanisms of Corrosion: Chemical (Dry) vs Electrochemical (Wet) Corrosion',
        'Galvanic Corrosion, Pitting Corrosion, Stress Corrosion and Differential Aeration Corrosion',
        'Factors Influencing Corrosion Rate: Nature of Metal and Environmental Factors',
        'Corrosion Control: Cathodic Protection (Sacrificial Anode and Impressed Current Cathodic Protection)',
        'Metallic Coatings: Galvanization (Zinc coating) vs Tinning (Tin coating), Electroplating'
      ],
      important_questions: [
        'Explain the mechanism of electrochemical corrosion with absorption of oxygen and evolution of hydrogen.',
        'Differentiate between Galvanizing and Tinning with industrial applications.'
      ],
      lecture_summary: 'Understanding corrosion mechanisms enables engineers to prevent metallic infrastructure degradation.'
    },
    {
      unit_number: 4,
      title: 'Polymer Chemistry, Composites & Advanced Materials',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Classification of Polymers, Thermoplastics vs Thermosetting Plastics',
        'Preparation, Properties and Engineering Applications of Bakelite, Nylon-6,6 and Teflon (PTFE)',
        'Conducting Polymers: Polyacetylene and Polyaniline — Mechanism of Conduction and Applications',
        'Fiber Reinforced Plastics (FRP) and Carbon Fiber Composites',
        'Nanomaterials: Carbon Nanotubes (CNTs) and Fullerenes — Synthesis and Engineering Uses'
      ],
      important_questions: [
        'Distinguish between Thermoplastic and Thermosetting resins with molecular structure diagrams.',
        'Explain the preparation, properties, and applications of Bakelite and Teflon.'
      ],
      lecture_summary: 'Advanced polymeric composites and nanomaterials provide high strength-to-weight ratios in aerospace and electronics.'
    },
    {
      unit_number: 5,
      title: 'Spectroscopic Techniques & Chemical Analysis',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Beer-Lambert\'s Law: Principle, Derivation, Limitations and Instrumentation',
        'UV-Visible Spectroscopy: Electronic Transitions, Chromophores and Auxochromes',
        'Fourier Transform Infrared (FTIR) Spectroscopy: Molecular Vibrations and Functional Group Identification',
        'Chromatography: Principle and Applications of Thin Layer (TLC) and Gas Chromatography (GC)'
      ],
      important_questions: [
        'State and derive Beer-Lambert\'s law. Explain its application in colorimetric concentration determination.',
        'Explain how FTIR spectroscopy identifies organic functional groups in engineering materials.'
      ],
      lecture_summary: 'Spectroscopic instrumentation provides precise chemical fingerprinting for materials and chemical engineering.'
    }
  ]
};

const SUBJECT_DTI: SubjectCourse = {
  id: 'R26-DTI',
  name: 'Design Thinking and Innovation (DT&I)',
  shortName: 'DT&I',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Understanding Design Thinking & Problem Formulation',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Definition, History and Principles of Human-Centered Design Thinking',
        'Difference between Analytical Thinking and Design Thinking',
        'The 5-Stage Stanford d.school Model: Empathize, Define, Ideate, Prototype, Test',
        'Mindset for Innovation: Tolerance for Ambiguity, Curiosity and Collaborative Empathy'
      ],
      important_questions: [
        'Explain the five stages of the Stanford Design Thinking process with a neat diagram.',
        'How does design thinking differ from traditional engineering problem-solving approaches?'
      ],
      lecture_summary: 'Design thinking puts user empathy at the core of technical innovation, ensuring real problems are solved.'
    },
    {
      unit_number: 2,
      title: 'Empathy & User Research Methodologies',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'User Research Techniques: Field Observations, Interviews, and Immersion',
        'Developing Empathy Maps: Says, Thinks, Does, Feels quadrants',
        'Customer Journey Mapping: Touchpoints, Pain Points and Delight Moments',
        'Persona Building: Identifying Target Demographics and Behavioral Archetypes'
      ],
      important_questions: [
        'Describe the components of an Empathy Map and explain how it drives human-centric insights.',
        'Construct a user journey map for an engineering student navigating online attendance portals.'
      ],
      lecture_summary: 'Deep qualitative empathy reveals latent user needs that quantitative surveys often overlook.'
    },
    {
      unit_number: 3,
      title: 'Problem Framing & Creative Ideation',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Synthesizing Insights: Point of View (POV) Statements',
        'Formulating "How Might We" (HMW) Questions to Trigger Ideation',
        'Divergent vs Convergent Thinking in Creative Problem Solving',
        'Ideation Methods: Brainstorming Rules, SCAMPER Technique, Worst Possible Idea',
        'Idea Selection: Impact vs Feasibility 2x2 Prioritization Matrix'
      ],
      important_questions: [
        'Explain the SCAMPER technique with a concrete engineering product example.',
        'How do you convert an empathy insight into actionable "How Might We" statements?'
      ],
      lecture_summary: 'Framing the right question is the catalyst for breakthrough ideas; structured ideation filters the best solutions.'
    },
    {
      unit_number: 4,
      title: 'Prototyping & Iterative Testing',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Prototyping Philosophy: "Failing Fast and Cheap to Succeed Early"',
        'Low-Fidelity vs High-Fidelity Prototypes: Paper Prototypes, Wireframes, Cardboard Models',
        'Storyboarding, Role-Playing and Digital Mockups',
        'User Testing Protocols: Gathering Constructive Feedback without Defensiveness',
        'Iteration Loop: Feedback Grid (What worked, Needs change, Questions, Ideas)'
      ],
      important_questions: [
        'Differentiate between Low-Fidelity and High-Fidelity prototypes with appropriate use-cases.',
        'Describe how to conduct a user testing session and capture insights using a feedback capture grid.'
      ],
      lecture_summary: 'Prototypes make ideas tangible, exposing assumptions before capital is invested in full-scale manufacturing.'
    },
    {
      unit_number: 5,
      title: 'Innovation Ecosystem, IP & Business Model Canvas',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Types of Innovation: Incremental, Architectural, Radical and Disruptive Innovation',
        'The Business Model Canvas (BMC): 9 Essential Building Blocks',
        'Intellectual Property (IP) Fundamentals: Patents, Trademarks, Copyrights and Trade Secrets',
        'Filing Patents in India: Patentability Criteria (Novelty, Inventive Step, Industrial Application)',
        'Engineering Ethics in Design Innovation and Sustainable Product Lifecycles'
      ],
      important_questions: [
        'Explain the 9 building blocks of the Business Model Canvas with a tech startup example.',
        'What are the statutory criteria for patentability under the Indian Patent Act?'
      ],
      lecture_summary: 'Protecting intellectual property and constructing viable business models converts engineering concepts into market reality.'
    }
  ]
};

const SUBJECT_UHV_II: SubjectCourse = {
  id: 'R26-UHV2',
  name: 'Universal Human Values-II (UHV-II)',
  shortName: 'UHV-II',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Introduction to Value Education & Self-Exploration',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Need, Basic Guidelines, Content and Process for Value Education',
        'Self-Exploration as the Process for Value Education: Natural Acceptance vs Experiential Validation',
        'Continuous Happiness and Prosperity as Basic Human Aspirations',
        'Right Understanding, Relationship and Physical Facility (The Complete Human Goal)'
      ],
      important_questions: [
        'Explain the process of Self-Exploration with its content and natural acceptance mechanism.',
        'Differentiate between the needs of the Self (\'I\') and the needs of the Body.'
      ],
      lecture_summary: 'Self-exploration aligns human desires with intrinsic values, fostering personal harmony and integrity.'
    },
    {
      unit_number: 2,
      title: 'Harmony in the Human Being: Self (\'I\') & Body',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Understanding Human Being as Co-existence of the Sentient \'I\' and Material \'Body\'',
        'Needs of \'I\' (Respect, Trust, Happiness) vs Needs of Body (Food, Clothing, Shelter)',
        'Activities in the Self: Desire, Thought and Expectation',
        'Sanyam (Self-Regulation) and Swasthya (Health): Programs for Physical Health'
      ],
      important_questions: [
        'How does Sanyam lead to Swasthya? Explain the holistic program for physical health.',
        'Explain why trust and respect are qualitative and continuous needs of the Self.'
      ],
      lecture_summary: 'A balanced relationship between the conscious Self and the physical body creates personal wellness and discipline.'
    },
    {
      unit_number: 3,
      title: 'Harmony in the Family & Society: Human Relationships',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Values in Human-to-Human Relationships: Trust (Vishwas) and Respect (Samman) as Foundational',
        'Trust: Intention vs Competence Analysis',
        'Respect: Differentiation vs Natural Equality',
        'Affection, Care, Guidance, Reverence, Glory, Gratitude and Love (The Complete Value)',
        'Comprehensive Human Goal: Fearlessness, Trust in Society, and Co-existence'
      ],
      important_questions: [
        'Explain the foundational value of Trust (Vishwas) and analyze the gap between Intention and Competence.',
        'Discuss the difference between Respect and Differentiation based on body, physical facility, or beliefs.'
      ],
      lecture_summary: 'Unconditional trust and respect resolve interpersonal friction in academic institutions and engineering teams.'
    },
    {
      unit_number: 4,
      title: 'Harmony in Nature & Universal Co-existence',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'The Four Orders in Nature: Material, Pranic (Bio), Animal and Human Orders',
        'Interconnectedness, Self-Regulation and Mutual Fulfillment in Nature',
        'Realizing the Role of Humans: Moving from Exploitation to Mutual Enrichment',
        'Existence as Co-existence (Sah-astitva) of Units in All-Pervasive Space'
      ],
      important_questions: [
        'Explain the mutual fulfillment among the four orders of nature. Where is the imbalance occurring?',
        'Describe the universal order and co-existence of all units submerged in all-pervasive space.'
      ],
      lecture_summary: 'Ecological balance requires human production to harmonize with natural regenerative cycles.'
    },
    {
      unit_number: 5,
      title: 'Professional Ethics & Holistic Technology',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Definitiveness of Ethical Human Conduct: Values, Policies and Character',
        'Competence in Professional Ethics: Clarity on Human Purpose, Mutually Fulfilling Livelihood',
        'Vision for Holistic Technologies, Production Systems and Management Models',
        'Strategies for Transition from Current Unethical Practices to Universal Human Order'
      ],
      important_questions: [
        'What are the salient characteristics of a holistic engineering production system?',
        'Explain how professional ethics guide engineering decisions in AI, environmental protection, and safety.'
      ],
      lecture_summary: 'Ethical engineering ensures technical prowess serves societal upliftment without ecological harm.'
    }
  ]
};

const SUBJECT_PAC: SubjectCourse = {
  id: 'R26-PAC',
  name: 'Physics for Advanced Computing',
  shortName: 'PAC',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Wave Optics & Photonic Computing',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Interference in Thin Films by Reflection & Transmitted Light',
        'Newton\'s Rings: Diameter of Fringes & Determination of Optical Wavelength',
        'Fraunhofer Diffraction at a Single Slit, Double Slit & Transmission Grating',
        'Polarization of Light: Double Refraction, Nicol Prism, Quarter & Half Wave Plates',
        'Optical Computing Concepts: Optical Interconnects and Photonic Switching'
      ],
      important_questions: [
        'Derive the condition for interference in thin films due to reflected light.',
        'Explain Fraunhofer diffraction at a single slit and derive the intensity distribution.'
      ],
      lecture_summary: 'Photonic light paths surpass copper wiring in high-speed data transmission for advanced computing architectures.'
    },
    {
      unit_number: 2,
      title: 'Quantum Mechanics & Qubit Principles',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Wave-Particle Duality: De Broglie Hypothesis & Davisson-Germer Experiment',
        'Heisenberg Uncertainty Principle & Physical Significance',
        'Schrödinger Time-Independent Wave Equation: Formulation & Boundary Conditions',
        'Particle in an Infinite Potential Well (1D Box): Energy Eigenvalues & Wavefunctions',
        'Introduction to Quantum Computing: Superposition, Entanglement, Qubits & Bloch Sphere'
      ],
      important_questions: [
        'Derive the Schrödinger time-independent wave equation for a free particle.',
        'Explain the concept of quantum superposition and representation of a qubit on the Bloch sphere.'
      ],
      lecture_summary: 'Quantum mechanical principles provide the fundamental basis for modern quantum computation and encryption.'
    },
    {
      unit_number: 3,
      title: 'Semiconductor Physics & Nanoelectronics',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Band Theory of Solids: Kronig-Penney Model (Qualitative) & E-k Diagrams',
        'Direct and Indirect Bandgap Semiconductors',
        'Intrinsic and Extrinsic Semiconductors: Carrier Concentration, Fermi-Dirac Distribution',
        'Hall Effect: Hall Coefficient, Determination of Carrier Type & Mobility in Semiconductor Devices',
        'Evolution from MOSFET to FinFET and Gate-All-Around (GAA) Nano-transistors'
      ],
      important_questions: [
        'Derive an expression for carrier concentration in an intrinsic semiconductor.',
        'What is the Hall effect? Derive the expression for the Hall coefficient and list its applications.'
      ],
      lecture_summary: 'Carrier transport and quantum tunneling govern sub-nanometer microprocessor design.'
    },
    {
      unit_number: 4,
      title: 'Magnetic Materials & Data Storage Physics',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Origin of Magnetic Moment: Bohr Magneton, Dia-, Para- and Ferromagnetism',
        'Domain Theory of Ferromagnetism, Hysteresis Loop (B-H Curve) & Energy Loss',
        'Soft vs Hard Magnetic Materials and Applications in Storage Media',
        'Giant Magnetoresistance (GMR) and Spintronics in Hard Disk Read Heads',
        'Magnetic Random Access Memory (MRAM) Operating Principles'
      ],
      important_questions: [
        'Explain the domain theory of ferromagnetism and describe the B-H hysteresis loop.',
        'Discuss Giant Magnetoresistance (GMR) and how it revolutionized high-density computer storage.'
      ],
      lecture_summary: 'Spintronics harnesses electron spin rather than just charge, paving the way for non-volatile ultra-fast memory.'
    },
    {
      unit_number: 5,
      title: 'Superconductivity & Quantum Transmon Circuits',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Superconductivity: Zero Electrical Resistance, Critical Temperature (Tc) and Critical Magnetic Field',
        'Meissner Effect: Perfect Diamagnetism, Type-I and Type-II Superconductors',
        'BCS Theory (Qualitative): Cooper Pairs and Energy Gap',
        'Josephson Junctions: DC and AC Josephson Effects, SQUID Magnetometers',
        'Superconducting Qubits (Transmon) Used in Modern Quantum Processors (IBM, Google)'
      ],
      important_questions: [
        'Explain the Meissner effect and distinguish between Type-I and Type-II superconductors.',
        'Describe the Josephson effect and its application in superconducting quantum circuits.'
      ],
      lecture_summary: 'Superconducting circuits operating near absolute zero eliminate electrical resistance, enabling macroscopic quantum state manipulation.'
    }
  ]
};

const SUBJECT_FDL: SubjectCourse = {
  id: 'R26-FDL',
  name: 'Fundamentals of Digital Logic (FDL)',
  shortName: 'FDL',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Number Systems, Binary Arithmetic & Boolean Algebra',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Review of Number Systems: Binary, Octal, Decimal, Hexadecimal & Radix Conversions',
        'Complements: 1\'s, 2\'s, 9\'s and 10\'s Complements and Subtraction',
        'Binary Codes: BCD, Excess-3, Gray Code and Error Detecting/Correcting Codes (Hamming Code)',
        'Boolean Algebra: Postulates, Theorems, De Morgan\'s Laws and Duality Principle',
        'Canonical and Standard Forms: Sum of Products (SOP) and Product of Sums (POS)'
      ],
      important_questions: [
        'State and prove De Morgan\'s laws using truth tables and algebraic theorems.',
        'Convert (743.25)₁₀ to Binary, Octal, and Hexadecimal representations.'
      ],
      lecture_summary: 'Binary arithmetic and Boolean logic form the symbolic mathematical foundation for digital computers.'
    },
    {
      unit_number: 2,
      title: 'Gate-Level Minimization & Karnaugh Maps',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Logic Gates: AND, OR, NOT, NAND, NOR, XOR, XNOR (NAND and NOR as Universal Gates)',
        'The Map Method: Two, Three and Four-Variable Karnaugh Maps (K-Maps)',
        'Don\'t-Care Conditions in K-Map Simplification',
        'Quine-McCluskey (Tabulation) Method for Minimization of Boolean Functions',
        'Multi-Level NAND and NOR Implementations'
      ],
      important_questions: [
        'Simplify the Boolean function F(A, B, C, D) = Σm(0, 1, 2, 5, 8, 9, 10) + d(7, 14, 15) using K-Map.',
        'Implement an XOR gate using only two-input NAND gates.'
      ],
      lecture_summary: 'K-Map minimization minimizes transistor count and propagation delay in integrated circuit design.'
    },
    {
      unit_number: 3,
      title: 'Combinational Logic Circuit Design',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Design Procedure for Combinational Logic Circuits',
        'Arithmetic Circuits: Half Adder, Full Adder, Half Subtractor, Full Subtractor',
        'Binary Parallel Adder/Subtractor and Carry Look-Ahead (CLA) Adder Principle',
        'Decoders (2x4, 3x8), Encoders, Priority Encoders and BCD to 7-Segment Decoders',
        'Multiplexers (MUX: 4x1, 8x1, 16x1) and Demultiplexers (DEMUX), Implementing Logic with MUX'
      ],
      important_questions: [
        'Design a Full Adder circuit using only two Half Adders and an OR gate.',
        'Implement the Boolean function F(A, B, C, D) = Σm(1, 3, 4, 11, 12, 13, 14, 15) using an 8x1 MUX.'
      ],
      lecture_summary: 'Combinational circuits produce immediate outputs based solely on present inputs, performing ALU operations.'
    },
    {
      unit_number: 4,
      title: 'Sequential Logic & Flip-Flops',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Latches vs Flip-Flops: SR Latch, Gated Latches and Clocked Flip-Flops',
        'Flip-Flop Architectures: SR, JK, D, and T Flip-Flops (Truth Tables & Characteristic Equations)',
        'Race-Around Condition in JK Flip-Flop and Master-Slave JK Flip-Flop Solution',
        'Flip-Flop Conversions (e.g., JK to D, SR to T)',
        'State Tables, State Diagrams and State Reduction Techniques'
      ],
      important_questions: [
        'Explain the race-around condition in JK Flip-Flop and describe how Master-Slave configuration solves it.',
        'Convert an SR Flip-Flop into a JK Flip-Flop with conversion tables and logic diagrams.'
      ],
      lecture_summary: 'Sequential circuits incorporate memory feedback elements, clock synchronization, and state transitions.'
    },
    {
      unit_number: 5,
      title: 'Registers, Counters & Programmable Logic',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Registers: Shift Registers (SISO, SIPO, PISO, PIPO) and Universal Shift Register',
        'Asynchronous (Ripple) Counters: Up, Down and Mod-N Ripple Counters',
        'Synchronous Counters: Design of Mod-8, Mod-10 (Decade) Counters',
        'Ring Counter and Johnson Counter Operating Principles',
        'Programmable Logic Devices: ROM, Programmable Logic Array (PLA) and Programmable Array Logic (PAL)'
      ],
      important_questions: [
        'Design a 3-bit Synchronous Up-Counter using T Flip-Flops with complete state diagram and excitation tables.',
        'Explain the internal architecture and differences between PLA, PAL, and PROM.'
      ],
      lecture_summary: 'Registers and counters provide program counter sequencing and temporary register storage inside microprocessors.'
    }
  ]
};

const SUBJECT_BEEE: SubjectCourse = {
  id: 'R26-BEEE',
  name: 'Basic Electrical and Electronics Engineering (BEEE)',
  shortName: 'BEEE',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'DC Circuits & Network Theorems',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Electrical Circuit Elements: R, L and C, Ohm\'s Law and Kirchhoff\'s Laws (KCL & KVL)',
        'Resistors in Series and Parallel, Voltage and Current Division Rules',
        'Mesh Analysis and Nodal Analysis with Independent Voltage and Current Sources',
        'Network Theorems: Thevenin\'s Theorem, Norton\'s Theorem, Superposition Theorem & Maximum Power Transfer'
      ],
      important_questions: [
        'State and prove Thevenin\'s Theorem and find the current through the load resistor in the given circuit.',
        'Find the node voltages using Nodal Analysis for a multi-loop electrical circuit.'
      ],
      lecture_summary: 'Linear DC circuit analysis establishes voltage and current relationships across complex electrical meshes.'
    },
    {
      unit_number: 2,
      title: 'AC Fundamentals & Single-Phase Circuits',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Alternating Quantities: Sinusoidal Waveforms, Peak Value, RMS Value, Average Value and Form Factor',
        'Phasor Representation of Alternating Quantities and J-operator',
        'Analysis of Series RL, RC and RLC Circuits: Impedance, Phase Angle, Power Factor',
        'Real Power (kW), Reactive Power (kVAR), Apparent Power (kVA) and Power Triangle',
        'Resonance in Series RLC Circuits: Resonant Frequency, Bandwidth and Quality Factor'
      ],
      important_questions: [
        'Derive the expression for resonant frequency and quality factor in a Series RLC circuit.',
        'An alternating voltage v = 141.4 sin(314t) is applied to an RL circuit. Compute impedance, current, and power factor.'
      ],
      lecture_summary: 'AC circuits govern global electrical power transmission, reactive impedance, and frequency resonance.'
    },
    {
      unit_number: 3,
      title: 'Electrical Machines & Transformers',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Single-Phase Transformer: Construction, Principle of Operation, EMF Equation and Transformation Ratio',
        'Ideal vs Practical Transformer, Losses in Transformers (Core Losses and Copper Losses)',
        'DC Generator: Construction, Working Principle and EMF Equation',
        'DC Motor: Principle of Operation, Back EMF, Torque Equation and Speed Control Methods',
        'Three-Phase Induction Motor: Construction, Rotating Magnetic Field and Slip Concept'
      ],
      important_questions: [
        'Derive the EMF equation of a single-phase transformer and explain its various losses.',
        'Explain the principle of operation of a DC Motor and derive the torque equation.'
      ],
      lecture_summary: 'Transformers step voltage levels for power distribution; motors convert electromagnetic energy to mechanical torque.'
    },
    {
      unit_number: 4,
      title: 'Semiconductor Diodes & Applications',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'PN Junction Diode: Formation of Depletion Layer, Forward and Reverse Bias V-I Characteristics',
        'Diode Current Equation and Temperature Dependence',
        'Zener Diode: Reverse Breakdown Mechanisms (Zener vs Avalanche) and Voltage Regulator Circuit',
        'Rectifiers: Half-Wave Rectifier, Full-Wave Center-Tapped and Bridge Rectifiers (Efficiency & Ripple Factor)',
        'Capacitor Filter and Regulated DC Power Supply Architecture'
      ],
      important_questions: [
        'Explain the working of a Full-Wave Bridge Rectifier with circuit diagram and calculate its ripple factor.',
        'Describe the operation of a Zener diode as a voltage regulator with circuit schematic.'
      ],
      lecture_summary: 'Diodes rectify AC into DC voltage and protect sensitive electronic equipment from voltage surges.'
    },
    {
      unit_number: 5,
      title: 'Transistors & Basic Amplifiers',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Bipolar Junction Transistor (BJT): NPN and PNP Construction, Transistor Action',
        'Transistor Configurations: Common Base (CB), Common Emitter (CE) and Common Collector (CC)',
        'Input and Output V-I Characteristics of CE Configuration, Current Gain (α and β Relations)',
        'Transistor Biasing: Need for Biasing, DC Operating Point (Q-Point) and Fixed Bias vs Voltage Divider Bias',
        'Junction Field Effect Transistor (JFET): Construction, Principle of Operation and Transfer Characteristics'
      ],
      important_questions: [
        'Draw and explain the input and output characteristics of a BJT in Common Emitter configuration.',
        'Derive the relationship between transistor current amplification factors α, β and γ.'
      ],
      lecture_summary: 'Bipolar and field-effect transistors form the primary active building blocks for signal amplification and switching.'
    }
  ]
};

const SUBJECT_AP: SubjectCourse = {
  id: 'R26-AP',
  name: 'Applied Physics',
  shortName: 'AP',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Wave Optics & Interference',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Principle of Superposition & Coherence of Light Waves',
        'Interference in Thin Films by Reflection & Cosine Law',
        'Newton\'s Rings Experiment: Theory & Measurement of Wavelength',
        'Determination of Refractive Index of Liquids using Newton\'s Rings',
        'Michelson\'s Interferometer: Working Principle & Circular Fringes'
      ],
      important_questions: [
        'Derive the condition for constructive and destructive interference in thin films due to reflected light.',
        'Describe Newton\'s rings experiment with neat diagram and derive the expression for diameter of dark rings.'
      ],
      lecture_summary: 'Light wave interference phenomena enable sub-wavelength precision measurement in optics and semiconductors.'
    },
    {
      unit_number: 2,
      title: 'Diffraction & Polarization of Light',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Fresnel vs Fraunhofer Diffraction',
        'Fraunhofer Diffraction at a Single Slit & Diffraction Grating',
        'Resolving Power of Telescope and Diffraction Grating (Rayleigh\'s Criterion)',
        'Polarization: Brewster\'s Law, Malus\' Law and Double Refraction',
        'Quarter and Half Wave Retardation Plates, Production of Circularly Polarized Light'
      ],
      important_questions: [
        'Explain Fraunhofer diffraction at a single slit and derive expressions for intensity distribution.',
        'State Brewster\'s Law and describe the construction and action of a Nicol prism.'
      ],
      lecture_summary: 'Diffraction sets fundamental resolution limits, while polarization controls optical telecommunication signals.'
    },
    {
      unit_number: 3,
      title: 'Lasers & Optical Fiber Telecommunications',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Characteristics of Lasers: Coherence, Directionality and Monochromaticity',
        'Einstein Coefficients: Absorption, Spontaneous and Stimulated Emission',
        'Population Inversion, Pumping Methods and Optical Resonator',
        'He-Ne Laser and Semiconductor Diode Laser Principles',
        'Optical Fibers: Acceptance Angle, Numerical Aperture, Step-Index vs Graded-Index Fibers'
      ],
      important_questions: [
        'Explain the construction and working of He-Ne laser with energy level transitions.',
        'Derive the expression for Numerical Aperture and Acceptance Angle of an optical fiber.'
      ],
      lecture_summary: 'Stimulated emission generates coherent laser light, which optical fiber cables channel across intercontinental distances.'
    },
    {
      unit_number: 4,
      title: 'Quantum Mechanics & Band Theory',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'De Broglie Hypothesis: Matter Waves & Davisson-Germer Experiment',
        'Heisenberg\'s Uncertainty Principle & Physical Significance',
        'Schrödinger Time-Independent Wave Equation',
        'Particle in a 1D Potential Box: Eigenvalues and Normalized Eigenfunctions',
        'Kronig-Penney Model (Qualitative) & Origin of Energy Bands in Solids'
      ],
      important_questions: [
        'Derive Schrödinger time-independent wave equation and calculate energy eigenvalues for a 1D box.',
        'Explain the Kronig-Penney model and how it explains conductor, semiconductor, and insulator bandgaps.'
      ],
      lecture_summary: 'Quantum wave mechanics explains electron dispersion relations and crystalline solid electrical properties.'
    },
    {
      unit_number: 5,
      title: 'Dielectric & Magnetic Materials',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Dielectric Polarization: Electronic, Ionic, Orientation and Space Charge Polarizations',
        'Internal Field in Solids (Lorentz Field) & Clausius-Mossotti Equation',
        'Piezoelectricity, Pyroelectricity and Ferroelectric Materials',
        'Magnetic Classification: Dia, Para, Ferro, Antiferro and Ferrimagnetism',
        'Hysteresis Loop, Hard and Soft Magnetic Materials and Applications in Electronic Transformers'
      ],
      important_questions: [
        'Derive the Clausius-Mossotti equation for non-polar dielectrics.',
        'Discuss the domain theory of ferromagnetism and explain the B-H hysteresis curve.'
      ],
      lecture_summary: 'Dielectric and magnetic properties determine capacitance, dielectric insulation, and RF inductors in telecommunications.'
    }
  ]
};

const SUBJECT_EEE_THEORY: SubjectCourse = {
  id: 'R26-EEE',
  name: 'Elements of Electrical Engineering (EEE)',
  shortName: 'EEE',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'DC Circuits & Network Theorems',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Ohm\'s Law, Kirchhoff\'s Current and Voltage Laws',
        'Mesh and Nodal Analysis of DC Circuits',
        'Superposition, Thevenin\'s, Norton\'s and Maximum Power Transfer Theorems'
      ],
      important_questions: [
        'Apply Thevenin\'s theorem to calculate load current in a complex bridge network.'
      ]
    },
    {
      unit_number: 2,
      title: 'Single-Phase AC Circuits',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Representation of Sinusoidal Waveforms, Peak, RMS and Average Values',
        'Phasor Analysis of Series R-L, R-C, R-L-C Circuits',
        'Real, Reactive and Complex Power, Resonance in AC Circuits'
      ],
      important_questions: [
        'Derive expression for resonant frequency in an RLC series circuit.'
      ]
    },
    {
      unit_number: 3,
      title: 'Magnetic Circuits & Inductance',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'MMF, Reluctance, Magnetic Flux and Permeability',
        'Comparison of Magnetic and Electric Circuits',
        'Self and Mutual Inductance, Coefficient of Coupling'
      ],
      important_questions: [
        'Derive the relationship between Self Inductance, Mutual Inductance and Coupling Coefficient.'
      ]
    },
    {
      unit_number: 4,
      title: 'Transformers & Measuring Instruments',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Single-Phase Transformer: Construction, EMF Equation and Losses',
        'Measuring Instruments: Moving Coil (PMMC) and Moving Iron (MI) Meters'
      ],
      important_questions: [
        'Explain the construction and working principle of a PMMC instrument with diagram.'
      ]
    },
    {
      unit_number: 5,
      title: 'Electrical Machines & Safety',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'DC Motor: Principle, Types and Speed Control',
        'Three-Phase Induction Motor Basics and Electrical Safety: Earthing, Fuses and MCBs'
      ],
      important_questions: [
        'Explain the importance of protective earthing in domestic and industrial installations.'
      ]
    }
  ]
};

const SUBJECT_PES: SubjectCourse = {
  id: 'R26-PES',
  name: 'Physics for Electrical Systems',
  shortName: 'PES',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Electrostatics & Dielectric Materials',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Electric Field, Potential, Gauss\'s Law', 'Dielectric Polarization Mechanisms', 'Clausius-Mossotti Equation'],
      important_questions: ['Derive Gauss\'s law and apply to charged cylindrical conductor.']
    },
    {
      unit_number: 2,
      title: 'Electromagnetism & Maxwell\'s Equations',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Biot-Savart Law, Ampere\'s Circuital Law', 'Faraday\'s Laws of Induction, Displacement Current', 'Maxwell\'s Equations in Differential & Integral Form'],
      important_questions: ['Derive Maxwell\'s equations for electromagnetic wave propagation.']
    },
    {
      unit_number: 3,
      title: 'Magnetic Materials & Superconductivity',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Classification of Magnetic Materials, B-H Loop', 'Superconductivity: Meissner Effect, Type-I & Type-II', 'Applications in Maglev & MRI'],
      important_questions: ['Explain Meissner effect and critical magnetic field in superconductors.']
    },
    {
      unit_number: 4,
      title: 'Semiconductor Physics & Optoelectronics',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Intrinsic and Extrinsic Semiconductors', 'Hall Effect and Mobility', 'Solar Cells, LEDs and Photodiodes'],
      important_questions: ['Explain the working principle and I-V characteristics of a Silicon solar cell.']
    },
    {
      unit_number: 5,
      title: 'Lasers & Fiber Optics in Power Systems',
      weightage: '14 Marks · Semester End Exam',
      topics: ['Laser Principles, Population Inversion', 'Optical Fiber Structures, Attenuation', 'Fiber Optic Sensors in Smart Grids'],
      important_questions: ['How are optical fiber sensors used to monitor high voltage transmission lines?']
    }
  ]
};

const SUBJECT_BEC: SubjectCourse = {
  id: 'R26-BEC',
  name: 'Basic Electrical Circuits (BEC)',
  shortName: 'BEC',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Network Topology & Mesh/Nodal Formulations',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Graph Theory, Tree, Co-Tree, Incidence Matrix, Cut-Set and Tie-Set Matrices', 'Duality in Networks'],
      important_questions: ['Construct the fundamental loop matrix for the given network graph.']
    },
    {
      unit_number: 2,
      title: 'Network Theorems in AC & DC',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Thevenin, Norton, Superposition, Maximum Power Transfer, Reciprocity and Millman Theorems'],
      important_questions: ['Apply Maximum Power Transfer Theorem to AC network with complex source and load impedances.']
    },
    {
      unit_number: 3,
      title: 'Resonance & Coupled Circuits',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Series and Parallel Resonance, Quality Factor, Bandwidth', 'Coupled Inductors, Dot Convention'],
      important_questions: ['Derive the resonance frequency and bandwidth of parallel tuned circuits.']
    },
    {
      unit_number: 4,
      title: 'Transient Analysis in DC Circuits',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Initial and Final Conditions in Elements', 'Transient Response of RL, RC and RLC Circuits using Differential Equations'],
      important_questions: ['Calculate current response i(t) in an RC series circuit when switched on to a DC voltage source.']
    },
    {
      unit_number: 5,
      title: 'Two-Port Network Parameters',
      weightage: '14 Marks · Semester End Exam',
      topics: ['Z, Y, ABCD, and h-Parameters', 'Inter-relationships of Parameters, Interconnection of Two-Port Networks'],
      important_questions: ['Determine Z and Transmission (ABCD) parameters for a symmetrical T-network.']
    }
  ]
};

const SUBJECT_PCE: SubjectCourse = {
  id: 'R26-PCE',
  name: 'Physics for Civil Engineers',
  shortName: 'PCE',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Acoustics & Ultrasonic Testing in Buildings',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Classification of Sound, Reverberation, Sabine\'s Formula', 'Acoustic Design of Auditoriums', 'Ultrasonic Non-Destructive Testing of Concrete Structures'],
      important_questions: ['Derive Sabine\'s formula for reverberation time in an auditorium and state factors affecting acoustics.']
    },
    {
      unit_number: 2,
      title: 'Optics & Laser Metrology in Surveying',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Interference & Diffraction in Precision Measurement', 'Total Station & LiDAR Operating Principles', 'Lasers in Alignment and Leveling'],
      important_questions: ['Explain the working principle of LiDAR and laser distance meters in modern geodetic surveying.']
    },
    {
      unit_number: 3,
      title: 'Elasticity, Stress-Strain & Continuum Mechanics',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Hooke\'s Law, Stress and Strain Tensors', 'Young\'s Modulus, Bulk Modulus, Shear Modulus & Poisson\'s Ratio', 'Bending of Beams and Cantilever Deflection'],
      important_questions: ['Derive the relation connecting the three elastic moduli (Y, K, η) and Poisson\'s ratio (σ).']
    },
    {
      unit_number: 4,
      title: 'Thermal Properties & Building Insulation',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Thermal Conductivity, Conduction through Composite Walls', 'Thermal Insulation Materials in Green Buildings', 'Thermal Expansion in Structural Bridges and Rail Tracks'],
      important_questions: ['Derive the formula for rate of heat flow through a composite building slab with two layers.']
    },
    {
      unit_number: 5,
      title: 'Fluid Dynamics & Aerodynamics of Structures',
      weightage: '14 Marks · Semester End Exam',
      topics: ['Streamline and Turbulent Flow, Viscosity and Poiseuille\'s Law', 'Bernoulli\'s Equation and Venturimeter', 'Wind Load and Aerodynamic Drag on High-Rise Towers'],
      important_questions: ['State and derive Bernoulli\'s theorem for steady, incompressible fluid flow.']
    }
  ]
};

const SUBJECT_SDPP: SubjectCourse = {
  id: 'R26-SDPP',
  name: 'Sustainable Development-Principles, Practices and SDs (SDPP)',
  shortName: 'SDPP',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Introduction to Sustainable Development & UN SDGs',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Concept of Sustainable Development: Brundtland Report', '17 UN Sustainable Development Goals (SDGs)', 'Planetary Boundaries and Ecological Footprint'],
      important_questions: ['Explain the 17 UN Sustainable Development Goals with focus on clean water and sustainable infrastructure.']
    },
    {
      unit_number: 2,
      title: 'Natural Resource Conservation & Ecosystem Services',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Depletion of Non-Renewable Resources', 'Water Resource Management, Rainwater Harvesting', 'Ecosystem Services: Provisioning, Regulating and Cultural'],
      important_questions: ['Discuss rainwater harvesting techniques suitable for urban educational campuses.']
    },
    {
      unit_number: 3,
      title: 'Green Engineering & Low-Carbon Infrastructure',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Green Building Concepts: LEED and GRIHA Certifications', 'Fly-Ash Concrete, Geopolymer Binders and Sustainable Aggregates', 'Life Cycle Assessment (LCA) of Civil Structures'],
      important_questions: ['Explain Life Cycle Assessment (LCA) methodology applied to construction materials.']
    },
    {
      unit_number: 4,
      title: 'Circular Economy, Waste Management & Pollution Control',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Circular Economy Principles: Reduce, Reuse, Recycle, Recover', 'Solid Waste Management and Hazardous Waste Treatment', 'Air, Water and Soil Remediation Engineering'],
      important_questions: ['Explain municipal solid waste management protocols with sanitary landfill design.']
    },
    {
      unit_number: 5,
      title: 'Climate Resilience & Environmental Policy',
      weightage: '14 Marks · Semester End Exam',
      topics: ['Climate Change Vulnerability and Flood/Drought Mitigation', 'Environmental Impact Assessment (EIA) Regulations in India', 'DPDP Act Compliance and Environmental Governance'],
      important_questions: ['Describe the step-by-step Environmental Impact Assessment (EIA) process for major highway projects.']
    }
  ]
};

const SUBJECT_PMS: SubjectCourse = {
  id: 'R26-PMS',
  name: 'Physics for Mechanical Systems',
  shortName: 'PMS',
  type: 'THEORY',
  credits: 3,
  units: [
    {
      unit_number: 1,
      title: 'Mechanics of Solids & Elasticity',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Stress-Strain Diagrams for Ductile & Brittle Materials', 'Moduli of Elasticity, Poisson\'s Ratio', 'Bending Moments, Deflection of Beams under Uniform Load'],
      important_questions: ['Derive the relation between Young\'s Modulus, Rigidity Modulus and Bulk Modulus.']
    },
    {
      unit_number: 2,
      title: 'Oscillations & Mechanical Vibrations',
      weightage: '14 Marks · Mid-Term 1',
      topics: ['Simple Harmonic Motion (SHM), Damped and Forced Harmonic Oscillations', 'Resonance and Q-Factor in Mechanical Machines', 'Vibration Isolation and Dampers in Automotive Engines'],
      important_questions: ['Derive the differential equation of damped harmonic motion and discuss over, critical, and under-damping.']
    },
    {
      unit_number: 3,
      title: 'Thermal Physics & Kinetic Theory',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Laws of Thermodynamics, Carnot Engine & Thermal Efficiency', 'Entropy and Second Law Formulations', 'Thermal Conductivity: Lee\'s Disc Method and Forbes Method'],
      important_questions: ['State the Second Law of Thermodynamics and explain the Carnot cycle with P-V diagram.']
    },
    {
      unit_number: 4,
      title: 'Fluid Mechanics & Surface Tension',
      weightage: '14 Marks · Mid-Term 2',
      topics: ['Viscosity: Newton\'s Law of Viscosity, Poiseuille\'s Flow', 'Surface Tension: Angle of Contact and Capillarity', 'Bernoulli\'s Equation and Venturi Flow Measurement'],
      important_questions: ['Derive Poiseuille\'s equation for the rate of flow of a liquid through a capillary tube.']
    },
    {
      unit_number: 5,
      title: 'Lasers & Non-Destructive Testing (NDT)',
      weightage: '14 Marks · Semester End Exam',
      topics: ['Laser Principles, Industrial CO2 and Nd:YAG Lasers in Metal Cutting/Welding', 'Non-Destructive Testing Methods: Ultrasonic, Magnetic Particle and Dye Penetrant Inspection'],
      important_questions: ['Explain the working principle and industrial applications of Nd:YAG laser in manufacturing.']
    }
  ]
};

// -------------------------------------------------------------
// REUSABLE MASTER LABORATORY / PRACTICAL DEFINITIONS
// -------------------------------------------------------------

const LAB_ITWS: SubjectCourse = {
  id: 'R26-LAB-ITWS',
  name: 'IT Workshop',
  shortName: 'ITWS',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'PC Hardware & Assembly', description: 'Identification of Motherboard, CPU, RAM, SMPS, Storage drives; complete PC disassembly and reassembly.' },
    { experiment_number: 2, title: 'OS Installation & Dual Booting', description: 'Installation of Linux Ubuntu and Windows 11; disk partitioning and UEFI boot configuration.' },
    { experiment_number: 3, title: 'Network Setup & Cable Crimping', description: 'Crimping RJ-45 LAN cables with T568B standard; configuring static IP, DNS, subnet mask and testing ping.' },
    { experiment_number: 4, title: 'Productivity Tools & LaTeX', description: 'Document preparation using LaTeX for mathematical engineering reports; formulas and bibliography.' },
    { experiment_number: 5, title: 'Web Development Basics', description: 'HTML5 semantic markup, CSS responsive layouts, and hosting personal student profiles via GitHub Pages.' }
  ]
};

const LAB_ITWS_ACRONYM: SubjectCourse = {
  ...LAB_ITWS,
  name: 'IT Workshop (ITWS)'
};

const LAB_AITA: SubjectCourse = {
  id: 'R26-LAB-AITA',
  name: 'AI Tools and Applications',
  shortName: 'AITA',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Generative AI & Prompt Engineering', description: 'Crafting effective system prompts, few-shot prompting, and persona design for academic and coding workflows.' },
    { experiment_number: 2, title: 'Automated Research & Literature Summarization', description: 'Using AI research assistants for academic paper analysis, citation mapping, and structured synthesis.' },
    { experiment_number: 3, title: 'AI-Assisted Code Generation & Debugging', description: 'Leveraging AI tools for code linting, algorithm optimization, automated test generation, and documentation.' },
    { experiment_number: 4, title: 'Data Analysis & Visual Generation', description: 'Automating spreadsheet analysis, trend forecasting, and diagram generation from textual descriptions.' },
    { experiment_number: 5, title: 'Ethical AI, DPDP Compliance & Bias Auditing', description: 'Analyzing deepfake detection, privacy regulations under DPDP Act 2023, and hallucination mitigation.' }
  ]
};

const LAB_CTPSC_LAB: SubjectCourse = {
  id: 'R26-LAB-CTPSC',
  name: 'Computational Thinking and Problem Solving Using C Lab (CTPS-C Lab)',
  shortName: 'CTPS-C Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Syntax, Data Types & Operators', description: 'Basic I/O operations, operator precedence, evaluation of arithmetic and relational expressions in C.' },
    { experiment_number: 2, title: 'Branching & Loop Constructs', description: 'Implementing roots of quadratic equation, prime number checks, Fibonacci series, and number reversal.' },
    { experiment_number: 3, title: '1D & 2D Array Operations', description: 'Matrix addition, multiplication, transpose, and search algorithms (Linear & Binary search).' },
    { experiment_number: 4, title: 'Functions & Recursion', description: 'Modular programming, passing arrays to functions, recursive factorial, GCD, and Tower of Hanoi.' },
    { experiment_number: 5, title: 'Pointers & Dynamic Allocation', description: 'Pointer arithmetic, swapping values via call-by-reference, dynamic memory allocation with malloc() and free().' },
    { experiment_number: 6, title: 'Structures & File Storage', description: 'Student academic ledger records using structures and persistent binary file read/write operations.' }
  ]
};

const LAB_ACET_LAB: SubjectCourse = {
  id: 'R26-LAB-ACET',
  name: 'Applied Chemistry for Engineering Technologies Lab',
  shortName: 'ACET Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Estimation of Hardness of Water', description: 'Determination of temporary, permanent, and total hardness of water sample using standard EDTA solution.' },
    { experiment_number: 2, title: 'Conductometric Titration', description: 'Titration of strong acid (HCl) against strong base (NaOH) using digital conductivity meter.' },
    { experiment_number: 3, title: 'Potentiometric Titration', description: 'Determination of concentration of Fe²⁺ in solution by titration against standard K₂Cr₂O₇ potentiometrically.' },
    { experiment_number: 4, title: 'pH Metric Titration', description: 'Determination of strength of weak acid (CH₃COOH) against strong base using digital pH meter.' },
    { experiment_number: 5, title: 'Viscosity of Industrial Lubricant', description: 'Determination of kinematic and absolute viscosity of lubricating oil using Redwood viscometer.' },
    { experiment_number: 6, title: 'Preparation of Bakelite Polymer', description: 'Synthesis of phenol-formaldehyde (Bakelite) resin by condensation polymerization.' }
  ]
};

const LAB_PAC_LAB: SubjectCourse = {
  id: 'R26-LAB-PAC',
  name: 'Physics for Advanced Computing Lab',
  shortName: 'PAC Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Wavelength of Light by Newton\'s Rings', description: 'Measurement of ring diameters to calculate wavelength of monochromatic sodium vapor light source.' },
    { experiment_number: 2, title: 'Diffraction Grating & Laser Wavelength', description: 'Determination of optical wavelength of Semiconductor Diode Laser using plane transmission grating.' },
    { experiment_number: 3, title: 'Numerical Aperture of Optical Fiber', description: 'Measurement of acceptance angle and calculation of numerical aperture of multimodal step-index optical fiber.' },
    { experiment_number: 4, title: 'Energy Band Gap of Semiconductor', description: 'Determination of reverse saturation current vs temperature to compute bandgap of Ge/Si diode.' },
    { experiment_number: 5, title: 'Hall Effect Experiment', description: 'Determination of Hall voltage, charge carrier type (n or p), carrier density, and Hall coefficient.' },
    { experiment_number: 6, title: 'B-H Curve & Magnetic Hysteresis', description: 'Plotting B-H loop of a ferromagnetic specimen on cathode-ray oscilloscope to compute magnetic energy loss.' }
  ]
};

const LAB_AP_LAB: SubjectCourse = {
  id: 'R26-LAB-AP',
  name: 'Applied Physics Laboratory',
  shortName: 'AP Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Newton\'s Rings Experiment', description: 'Measurement of radius of curvature of plano-convex lens and wavelength of sodium D-lines.' },
    { experiment_number: 2, title: 'Optical Fiber Characterization', description: 'Determination of numerical aperture and bending losses in multi-mode optical fiber.' },
    { experiment_number: 3, title: 'Laser Diffraction at a Slit', description: 'Determination of slit width and wavelength using He-Ne / diode laser diffraction patterns.' },
    { experiment_number: 4, title: 'Semiconductor Diode Characteristics', description: 'Forward and reverse bias V-I characteristics and reverse breakdown voltage determination.' },
    { experiment_number: 5, title: 'Zener Diode Voltage Regulation', description: 'Load and line regulation characteristics of Zener diode regulator circuit.' },
    { experiment_number: 6, title: 'Resonance in Series & Parallel LCR', description: 'Determination of resonant frequency, bandwidth and quality factor of tuned LCR circuits.' }
  ]
};

const LAB_EEE_LAB: SubjectCourse = {
  id: 'R26-LAB-EEE',
  name: 'Elements of Electrical Engineering Lab (EEE Lab)',
  shortName: 'EEE Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Verification of KCL and KVL', description: 'Experimental verification of Kirchhoff\'s Current and Voltage laws on DC electrical mesh board.' },
    { experiment_number: 2, title: 'Verification of Thevenin\'s & Norton\'s Theorems', description: 'Measurement of Voc, Isc and Rth to verify network equivalence.' },
    { experiment_number: 3, title: 'Load Test on Single-Phase Transformer', description: 'Measurement of efficiency and voltage regulation of single-phase transformer under resistive loading.' },
    { experiment_number: 4, title: 'Measurement of 3-Phase Power', description: 'Two-wattmeter method for measurement of active power in balanced 3-phase star/delta loads.' },
    { experiment_number: 5, title: 'Brake Test on DC Shunt Motor', description: 'Measurement of mechanical output torque, speed, and overall efficiency curve of DC motor.' }
  ]
};

const LAB_PES_LAB: SubjectCourse = {
  id: 'R26-LAB-PES',
  name: 'Physics for Electrical Systems Lab',
  shortName: 'PES Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Dielectric Constant Determination', description: 'Measurement of dielectric constant of liquid and solid insulating specimens using capacitance bridge.' },
    { experiment_number: 2, title: 'Magnetic Field along Axis of a Current Coil', description: 'Verification of Biot-Savart law using Stewart and Gee\'s galvanometer apparatus.' },
    { experiment_number: 3, title: 'Hall Coefficient Measurement', description: 'Determination of Hall coefficient and majority carrier concentration in semiconductor slice.' },
    { experiment_number: 4, title: 'Solar Cell Characteristics', description: 'Plotting V-I and P-V curve of photovoltaic solar cell under varying illumination; fill factor calculation.' },
    { experiment_number: 5, title: 'Optical Fiber Sensor for Strain/Temperature', description: 'Calibration of fiber Bragg grating / intensity modulation sensor for electrical telemetry.' }
  ]
};

const LAB_BEC_LAB: SubjectCourse = {
  id: 'R26-LAB-BEC',
  name: 'Basic Electrical Circuits Lab (BEC Lab)',
  shortName: 'BEC Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Mesh and Nodal Circuit Verification', description: 'Breadboard setup and experimental verification of node voltages and loop currents.' },
    { experiment_number: 2, title: 'Superposition & Maximum Power Transfer', description: 'Verification of linearity, superposition, and load matching for maximum power transfer.' },
    { experiment_number: 3, title: 'Frequency Response of Series RLC Circuit', description: 'Plotting current vs frequency, identifying resonant peak, and calculating Q-factor.' },
    { experiment_number: 4, title: 'Measurement of Two-Port Z and Y Parameters', description: 'Open-circuit and short-circuit testing on a passive two-port network.' },
    { experiment_number: 5, title: 'Transient Response of RL and RC Circuits', description: 'Oscilloscope recording of capacitor charging/discharging curves and time constant measurement.' }
  ]
};

const LAB_PCE_LAB: SubjectCourse = {
  id: 'R26-LAB-PCE',
  name: 'Physics for Civil Engineers Lab',
  shortName: 'PCE Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Young\'s Modulus by Non-Uniform Bending', description: 'Measurement of beam depression with traveling microscope to determine Young\'s modulus of wood/steel.' },
    { experiment_number: 2, title: 'Rigidity Modulus by Torsion Pendulum', description: 'Determination of moment of inertia and rigidity modulus of wire specimen.' },
    { experiment_number: 3, title: 'Ultrasonic Pulse Velocity in Concrete', description: 'Non-destructive testing of concrete cubes to detect internal honeycombing and compressive strength.' },
    { experiment_number: 4, title: 'Coefficient of Viscosity of Water', description: 'Determination of viscosity of water through capillary tube under streamline flow conditions.' },
    { experiment_number: 5, title: 'Thermal Conductivity by Lee\'s Disc', description: 'Determination of thermal conductivity of bad conductors (asbestos, cardboard, glass).' }
  ]
};

const LAB_EW: SubjectCourse = {
  id: 'R26-LAB-EW',
  name: 'Engineering Workshop',
  shortName: 'EW',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Carpentry: Cross Halving Joint & T-Lap Joint', description: 'Marking, sawing, chiseling, and assembling wooden lap joints.' },
    { experiment_number: 2, title: 'Fitting: V-Fit & Square Fit Assembly', description: 'Filing, deburring, hacksawing, and precision fitting of mild steel flats.' },
    { experiment_number: 3, title: 'Tin Smithy: Rectangular Tray & Funnel Fabrication', description: 'Sheet metal development, bending, snip cutting, and hem seaming.' },
    { experiment_number: 4, title: 'House Wiring: Staircase & Godown Wiring Circuits', description: 'Wiring of single lamp controlled by two 2-way switches with fuse and earth safety.' },
    { experiment_number: 5, title: 'Blacksmithy / Foundry: S-Hook Forging & Sand Mold', description: 'Heating, upsetting, drawing out, and sand mold preparation with split patterns.' }
  ]
};

const LAB_WP: SubjectCourse = {
  id: 'R26-LAB-WP',
  name: 'Workshop Practice',
  shortName: 'WP',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Machine Shop: Lathe Facing & Step Turning', description: 'Centering, facing, step turning, and chamfering on mild steel cylindrical rods.' },
    { experiment_number: 2, title: 'Welding: Arc Butt Joint & Lap Joint', description: 'Preparation of edges, striking arc, and deposition of uniform weld bead on steel plates.' },
    { experiment_number: 3, title: 'Sheet Metal & Fitting Practices', description: 'Manufacturing galvanized iron components, drilling, and tapping metric threads.' },
    { experiment_number: 4, title: 'Plumbing: Pipe Threading & Valves Assembly', description: 'Cutting PVC and GI pipes, threading, gate valve fitting, and pressure leak testing.' }
  ]
};

const LAB_PMS_LAB: SubjectCourse = {
  id: 'R26-LAB-PMS',
  name: 'Physics for Mechanical Systems Lab',
  shortName: 'PMS Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Torsional Pendulum - Rigidity Modulus', description: 'Measurement of period of torsional oscillations to determine modulus of rigidity.' },
    { experiment_number: 2, title: 'Thermal Conductivity of Metallic Conductor', description: 'Determination of thermal conductivity of copper/brass rod using Searle\'s apparatus.' },
    { experiment_number: 3, title: 'Viscosity of Engine Oil', description: 'Redwood viscometer measurement of fluid resistance at varying operating temperatures.' },
    { experiment_number: 4, title: 'Ultrasonic Flaw Detector', description: 'Inspection of forged steel bars for internal cracks using ultrasonic echo transducers.' },
    { experiment_number: 5, title: 'Optical Pyrometer Temperature Measurement', description: 'Non-contact high-temperature calibration of furnace heating elements.' }
  ]
};

const LAB_ETCM_LAB: SubjectCourse = {
  id: 'R26-LAB-ETCM',
  name: 'English for Technical Communication and MOODLES Lab',
  shortName: 'ETCM Lab',
  type: 'PRACTICAL',
  credits: 1.5,
  experiments: [
    { experiment_number: 1, title: 'Phonetics & Pronunciation Drills', description: 'Vowels, diphthongs, consonants, accent neutralization, and syllable stress patterns.' },
    { experiment_number: 2, title: 'Interactive Listening & Note-Taking', description: 'Listening to technical lectures, TED talks, and extracting salient bullet points.' },
    { experiment_number: 3, title: 'JAM (Just A Minute) & Impromptu Speaking', description: 'Extempore speaking on engineering topics, coherent structure, and fluency building.' },
    { experiment_number: 4, title: 'MOODLE LMS & Digital Learning Modules', description: 'Navigating online academic repositories, automated quizzes, and digital assignment submission.' }
  ]
};

const LAB_NSS_SY: SubjectCourse = {
  id: 'R26-LAB-NSS',
  name: 'NSS, Sports & Yoga',
  shortName: 'NSS/SY',
  type: 'PRACTICAL',
  credits: 0.5,
  experiments: [
    { experiment_number: 1, title: 'Physical Conditioning & Athletics', description: 'Warm-up routines, cardio endurance, and track & field discipline.' },
    { experiment_number: 2, title: 'Yoga Asanas & Pranayama', description: 'Surya Namaskar, seated and standing postures, breath control for mental focus and stress reduction.' },
    { experiment_number: 3, title: 'Community Service & Swachh Bharat Drives', description: 'Village adoption activities, campus cleanliness, and environmental tree plantation campaigns.' },
    { experiment_number: 4, title: 'First Aid & Disaster Management Drills', description: 'CPR basic life support, emergency evacuation protocols, and wound dressing demonstrations.' }
  ]
};

// -------------------------------------------------------------
// COMPLETE 12-DEPARTMENT R26 I B.TECH I SEMESTER SPECIFICATION
// -------------------------------------------------------------

export const r26Curriculum: Record<DepartmentCode, DepartmentCurriculum> = {
  CSE: {
    code: 'CSE',
    name: 'Computer Science and Engineering',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_ACET,
      SUBJECT_CTPS_C,
      SUBJECT_DTI,
      SUBJECT_UHV_II
    ],
    labs: [
      LAB_ITWS,
      LAB_ACET_LAB,
      LAB_CTPSC_LAB
    ]
  },

  CSIT: {
    code: 'CSIT',
    name: 'Computer Science and Information Technology',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PAC,
      SUBJECT_CTPS_C,
      SUBJECT_FDL,
      SUBJECT_UHV_II
    ],
    labs: [
      LAB_AITA,
      LAB_PAC_LAB,
      LAB_CTPSC_LAB,
      LAB_ITWS_ACRONYM
    ]
  },

  AIML: {
    code: 'AIML',
    name: 'Artificial Intelligence & Machine Learning',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_ACET,
      SUBJECT_CTPS_C,
      SUBJECT_DTI,
      SUBJECT_UHV_II
    ],
    labs: [
      LAB_ITWS,
      LAB_ACET_LAB,
      LAB_CTPSC_LAB
    ]
  },

  AIDS: {
    code: 'AIDS',
    name: 'Artificial Intelligence & Data Science',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_ACET,
      SUBJECT_CTPS_C,
      SUBJECT_BEEE
    ],
    labs: [
      LAB_ITWS,
      LAB_AITA,
      LAB_CTPSC_LAB,
      LAB_ACET_LAB,
      LAB_NSS_SY
    ]
  },

  IT: {
    code: 'IT',
    name: 'Information Technology',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_ACET,
      SUBJECT_CTPS_C,
      SUBJECT_BEEE,
      SUBJECT_UHV_II
    ],
    labs: [
      LAB_ITWS,
      LAB_AITA,
      LAB_ACET_LAB,
      LAB_CTPSC_LAB
    ]
  },

  CSBS: {
    code: 'CSBS',
    name: 'Computer Science and Business Systems',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PAC,
      SUBJECT_CTPS_C,
      SUBJECT_FDL
    ],
    labs: [
      LAB_AITA,
      LAB_PAC_LAB,
      LAB_CTPSC_LAB,
      LAB_ITWS,
      LAB_NSS_SY
    ]
  },

  CSD: {
    code: 'CSD',
    name: 'Computer Science and Design',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PAC,
      SUBJECT_CTPS_C,
      SUBJECT_FDL
    ],
    labs: [
      LAB_AITA,
      LAB_PAC_LAB,
      LAB_CTPSC_LAB,
      LAB_ITWS,
      LAB_NSS_SY
    ]
  },

  CIC: {
    code: 'CIC',
    name: 'CSE - IoT & Cyber Security Including Blockchain Technology',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_ACET,
      SUBJECT_CTPS_C,
      SUBJECT_DTI
    ],
    labs: [
      LAB_ITWS,
      LAB_ACET_LAB,
      LAB_CTPSC_LAB,
      LAB_NSS_SY
    ]
  },

  ECE: {
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_AP,
      SUBJECT_CTPS_C,
      SUBJECT_EEE_THEORY,
      SUBJECT_DTI
    ],
    labs: [
      LAB_AP_LAB,
      LAB_CTPSC_LAB,
      LAB_EEE_LAB,
      LAB_NSS_SY
    ]
  },

  EEE: {
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PES,
      SUBJECT_BEC,
      SUBJECT_DTI
    ],
    labs: [
      LAB_PES_LAB,
      LAB_ITWS_ACRONYM,
      LAB_BEC_LAB,
      LAB_AITA,
      LAB_NSS_SY
    ]
  },

  CIVIL: {
    code: 'CIVIL',
    name: 'Civil Engineering',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PCE,
      SUBJECT_SDPP,
      SUBJECT_DTI
    ],
    labs: [
      LAB_PCE_LAB,
      LAB_EW,
      LAB_AITA,
      LAB_NSS_SY
    ]
  },

  MECH: {
    code: 'MECH',
    name: 'Mechanical Engineering',
    academicYear: 'I B.Tech',
    semester: 'I Semester',
    regulation: 'R26',
    theory: [
      SUBJECT_ETC,
      SUBJECT_LAC,
      SUBJECT_PMS,
      SUBJECT_BEEE,
      SUBJECT_DTI,
      SUBJECT_UHV_II
    ],
    labs: [
      LAB_WP,
      LAB_PMS_LAB,
      LAB_ETCM_LAB,
      LAB_AITA
    ]
  }
};

/**
 * Normalization map for various input formats to supported DepartmentCode
 */
const DEPARTMENT_ALIAS_MAP: Record<string, DepartmentCode> = {
  // CSE
  'CSE': 'CSE',
  'COMPUTER SCIENCE': 'CSE',
  'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
  '05': 'CSE',

  // CSIT
  'CSIT': 'CSIT',
  'COMPUTER SCIENCE AND INFORMATION TECHNOLOGY': 'CSIT',
  '43': 'CSIT',

  // AIML
  'AIML': 'AIML',
  'ARTIFICIAL INTELLIGENCE & MACHINE LEARNING': 'AIML',
  'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING': 'AIML',
  '42': 'AIML',

  // AIDS
  'AIDS': 'AIDS',
  'ARTIFICIAL INTELLIGENCE & DATA SCIENCE': 'AIDS',
  'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE': 'AIDS',
  '44': 'AIDS',
  '54': 'AIDS',

  // IT
  'IT': 'IT',
  'INFORMATION TECHNOLOGY': 'IT',
  '12': 'IT',

  // CSBS
  'CSBS': 'CSBS',
  'COMPUTER SCIENCE AND BUSINESS SYSTEMS': 'CSBS',
  '59': 'CSBS',

  // CSD
  'CSD': 'CSD',
  'COMPUTER SCIENCE AND DESIGN': 'CSD',
  '57': 'CSD',

  // CIC
  'CIC': 'CIC',
  'CYBER SECURITY': 'CIC',
  'CSE - IOT & CYBER SECURITY': 'CIC',
  'IOT': 'CIC',
  '60': 'CIC',

  // ECE
  'ECE': 'ECE',
  'ELECTRONICS AND COMMUNICATION ENGINEERING': 'ECE',
  'ELECTRONICS': 'ECE',
  '04': 'ECE',

  // EEE
  'EEE': 'EEE',
  'ELECTRICAL AND ELECTRONICS ENGINEERING': 'EEE',
  'ELECTRICAL': 'EEE',
  '02': 'EEE',

  // CIVIL
  'CIVIL': 'CIVIL',
  'CIVIL ENGINEERING': 'CIVIL',
  '01': 'CIVIL',

  // MECH
  'MECH': 'MECH',
  'MECHANICAL': 'MECH',
  'MECHANICAL ENGINEERING': 'MECH',
  '03': 'MECH',
};

/**
 * Resolves the authenticated student's department code reliably from user object.
 * Checks user.branch, then extracts from user.register_number.
 * Default fallback is 'CSE'.
 */
export function resolveStudentDepartment(user: { branch?: string | null; register_number?: string | null } | null): DepartmentCode {
  if (!user) return 'CSE';

  // 1. Direct branch field check
  if (user.branch) {
    const cleaned = user.branch.trim().toUpperCase();
    if (DEPARTMENT_ALIAS_MAP[cleaned]) {
      return DEPARTMENT_ALIAS_MAP[cleaned];
    }
  }

  // 2. Extract from standard SRKR / JNTUK register number (e.g. 25B91A05U8 -> 05 -> CSE)
  const reg = (user.register_number || '').trim().toUpperCase();
  if (reg.length >= 8) {
    // Check two-digit branch code at positions 6-8 (0-indexed: 6, 7)
    const code = reg.slice(6, 8);
    if (DEPARTMENT_ALIAS_MAP[code]) {
      return DEPARTMENT_ALIAS_MAP[code];
    }
    // Check if branch acronym is embedded (e.g. 25B91ACSD01)
    for (const [key, val] of Object.entries(DEPARTMENT_ALIAS_MAP)) {
      if (key.length >= 3 && reg.includes(key)) {
        return val;
      }
    }
  }

  return 'CSE';
}

/**
 * Returns the personalized R26 curriculum for a given department code.
 */
export function getDepartmentCurriculum(deptCode: DepartmentCode): DepartmentCurriculum {
  return r26Curriculum[deptCode] || r26Curriculum.CSE;
}

// =====================================================================
// HIERARCHICAL ACADEMIC DATA ARCHITECTURE
// academicData -> branch -> academicYear (1..4) -> semester (1..8) -> AcademicSemesterData
// =====================================================================

export interface StudentAcademicContext {
  name: string;
  registerNumber: string;
  branch: DepartmentCode;
  academicYear: number;
  semester: number;
}

export interface AcademicSemesterData {
  code: DepartmentCode;
  branch: DepartmentCode;
  name: string;
  branchName: string;
  academicYear: string;
  semester: string;
  yearNumber: number;
  semesterNumber: number;
  yearLabel: string;
  semesterLabel: string;
  regulation: string;
  theory: SubjectCourse[];
  labs: SubjectCourse[];
  isAvailable: boolean;
  statusNote?: string;
}

export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;
export const SEMESTERS_PER_YEAR: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 8],
};

const YEAR_ROMAN = ['', 'I', 'II', 'III', 'IV'];
const SEM_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Hierarchical Academic Data Structure:
 * academicData -> branch -> academicYear -> semester -> AcademicSemesterData
 * Keeps R26 first-year branch-specific data strictly under Year 1 -> Semester 1.
 */
export const academicData: Record<
  DepartmentCode,
  Record<number, Record<number, AcademicSemesterData>>
> = ((): any => {
  const result: any = {};
  const branches: DepartmentCode[] = [
    'CSE', 'CSIT', 'AIML', 'AIDS', 'IT', 'CSBS',
    'CSD', 'CIC', 'ECE', 'EEE', 'CIVIL', 'MECH'
  ];

  branches.forEach(dept => {
    result[dept] = {};
    const baseCurriculum = r26Curriculum[dept];
    for (let y = 1; y <= 4; y++) {
      result[dept][y] = {};
      const sems = SEMESTERS_PER_YEAR[y] || [y * 2 - 1, y * 2];
      sems.forEach(s => {
        const yLabel = `${YEAR_ROMAN[y] || y} B.Tech`;
        const sLabel = `${SEM_ROMAN[s] || s} Semester`;

        if (y === 1 && s === 1) {
          // Existing first-year R26 branch-specific curriculum under Year 1 -> Semester 1
          result[dept][y][s] = {
            code: dept,
            branch: dept,
            name: baseCurriculum.name,
            branchName: baseCurriculum.name,
            academicYear: 'I B.Tech',
            semester: 'I Semester',
            yearNumber: 1,
            semesterNumber: 1,
            yearLabel: 'I B.Tech',
            semesterLabel: 'I Semester',
            regulation: 'R26',
            theory: baseCurriculum.theory,
            labs: baseCurriculum.labs,
            isAvailable: true,
          };
        } else {
          // Scoped structure for higher years/semesters (not yet published by department faculty)
          result[dept][y][s] = {
            code: dept,
            branch: dept,
            name: baseCurriculum.name,
            branchName: baseCurriculum.name,
            academicYear: yLabel,
            semester: sLabel,
            yearNumber: y,
            semesterNumber: s,
            yearLabel: yLabel,
            semesterLabel: sLabel,
            regulation: 'R26',
            theory: [],
            labs: [],
            isAvailable: false,
            statusNote: `Curriculum & courseware for Year ${y} (${sLabel}) is currently being prepared and verified by the ${baseCurriculum.name} department faculty.`,
          };
        }
      });
    }
  });

  return result;
})();

/**
 * Resolves the student's authenticated academic context strictly from the authenticated profile/session.
 */
export function getStudentAcademicContext(user: {
  display_name?: string | null;
  register_number?: string | null;
  branch?: string | null;
  academic_year?: number | null;
  current_semester?: number | null;
} | null): StudentAcademicContext {
  const branch = resolveStudentDepartment(user);
  let academicYear = Number(user?.academic_year) || 1;
  let semester = Number(user?.current_semester) || 1;

  if (academicYear < 1 || academicYear > 4) academicYear = 1;
  if (semester < 1 || semester > 8) semester = (academicYear * 2) - 1;

  return {
    name: user?.display_name || user?.register_number || 'Student',
    registerNumber: (user?.register_number || '').trim().toUpperCase(),
    branch,
    academicYear,
    semester,
  };
}

/**
 * Returns strictly scoped academic data for branch + academicYear + semester.
 * Guarantees that Year 2 students NEVER see Year 1 courses, and Year 1 students NEVER see Year 2.
 */
export function getScopedAcademicData(
  branch: DepartmentCode,
  academicYear: number = 1,
  semester: number = 1
): AcademicSemesterData {
  const deptData = academicData[branch] || academicData.CSE;
  const yearData = deptData[academicYear];
  if (yearData && yearData[semester]) {
    return yearData[semester];
  }

  const yLabel = `${YEAR_ROMAN[academicYear] || academicYear} B.Tech`;
  const sLabel = `${SEM_ROMAN[semester] || semester} Semester`;

  return {
    code: branch,
    branch,
    name: deptData[1]?.[1]?.branchName || `Department of ${branch}`,
    branchName: deptData[1]?.[1]?.branchName || `Department of ${branch}`,
    academicYear: yLabel,
    semester: sLabel,
    yearNumber: academicYear,
    semesterNumber: semester,
    yearLabel: yLabel,
    semesterLabel: sLabel,
    regulation: 'R26',
    theory: [],
    labs: [],
    isAvailable: false,
    statusNote: `Curriculum & courseware for Year ${academicYear} (${sLabel}) is currently being prepared by the department faculty.`,
  };
}

// =====================================================================
// R26 FACULTY ASSIGNMENT REGISTRY (Centralized Single Source of Truth)
// =====================================================================

export interface FacultyAssignment {
  username: string;
  role: 'FACULTY_ADMIN';
  branch: DepartmentCode;
  branchName: string;
  subject: string;
  subjectId: string;
  curriculumId: string;
  subjectType: 'theory' | 'practical';
  year: number;
  semester: number;
}

export const FACULTY_ASSIGNMENTS: Record<string, FacultyAssignment> = {
  // 1. CTPS-C (C Programming)
  'C': {
    username: 'c',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Computational Thinking and Problem Solving Using C',
    subjectId: 'cse-ctps-c',
    curriculumId: 'R26-CTPSC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 2. Linear Algebra & Calculus (Mathematics)
  'MATHS': {
    username: 'maths',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Linear Algebra & Calculus',
    subjectId: 'cse-lac',
    curriculumId: 'R26-LAC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 3. Applied Physics
  'PHYSICS': {
    username: 'physics',
    role: 'FACULTY_ADMIN',
    branch: 'ECE',
    branchName: 'Electronics and Communication Engineering',
    subject: 'Applied Physics',
    subjectId: 'ece-physics',
    curriculumId: 'R26-AP',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 4. Applied Chemistry
  'CHEMISTRY': {
    username: 'chemistry',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Applied Chemistry for Engineering Technologies',
    subjectId: 'cse-acet',
    curriculumId: 'R26-ACET',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 5. English for Technical Communication
  'ENGLISH': {
    username: 'english',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'English for Technical Communication',
    subjectId: 'cse-etc',
    curriculumId: 'R26-ETC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 6. Design Thinking and Innovation
  'DT': {
    username: 'dt',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Design Thinking and Innovation',
    subjectId: 'cse-dti',
    curriculumId: 'R26-DTI',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // 7. Universal Human Values-II
  'UHV': {
    username: 'uhv',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Universal Human Values-II',
    subjectId: 'cse-uhv',
    curriculumId: 'R26-UHV2',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  // Legacy aliases
  'FAC_CTPSC': {
    username: 'fac_ctpsc',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Computational Thinking and Problem Solving Using C',
    subjectId: 'cse-ctps-c',
    curriculumId: 'R26-CTPSC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  'FAC_LAC': {
    username: 'fac_lac',
    role: 'FACULTY_ADMIN',
    branch: 'CSE',
    branchName: 'Computer Science and Engineering',
    subject: 'Linear Algebra & Calculus',
    subjectId: 'cse-lac',
    curriculumId: 'R26-LAC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  'FAC_ECE_PHYSICS': {
    username: 'fac_ece_physics',
    role: 'FACULTY_ADMIN',
    branch: 'ECE',
    branchName: 'Electronics and Communication Engineering',
    subject: 'Applied Physics',
    subjectId: 'ece-physics',
    curriculumId: 'R26-AP',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
  'FAC_BEC': {
    username: 'fac_bec',
    role: 'FACULTY_ADMIN',
    branch: 'EEE',
    branchName: 'Electrical and Electronics Engineering',
    subject: 'Basic Electrical Circuits',
    subjectId: 'eee-bec',
    curriculumId: 'R26-BEC',
    subjectType: 'theory',
    year: 1,
    semester: 1,
  },
};

/**
 * Resolves the authenticated faculty admin's locked scope from the user object.
 * Returns null if the user does not have faculty_admin role.
 */
export function resolveFacultyScope(user: { register_number?: string | null; branch?: string | null; roles?: string[] } | null): FacultyAssignment | null {
  if (!user) return null;
  const reg = (user.register_number || '').trim().toUpperCase();

  // 1. Direct registry lookup
  if (FACULTY_ASSIGNMENTS[reg]) {
    return FACULTY_ASSIGNMENTS[reg];
  }

  // 2. Check lowercase variants
  for (const [key, assignment] of Object.entries(FACULTY_ASSIGNMENTS)) {
    if (key.toLowerCase() === reg.toLowerCase() || assignment.username.toLowerCase() === reg.toLowerCase()) {
      return assignment;
    }
  }

  // 3. Fallback for dynamic faculty admin accounts
  const isFaculty = user.roles?.some(r => r.toLowerCase() === 'faculty_admin');
  if (isFaculty) {
    const branch = resolveStudentDepartment(user);
    const curriculum = getDepartmentCurriculum(branch);
    const firstSubject = curriculum.theory[0] || {
      id: 'R26-CTPSC',
      name: 'Computational Thinking and Problem Solving Using C',
      type: 'THEORY'
    };

    return {
      username: (user.register_number || 'faculty').toLowerCase(),
      role: 'FACULTY_ADMIN',
      branch,
      branchName: curriculum.name,
      subject: firstSubject.name,
      subjectId: firstSubject.id.toLowerCase(),
      curriculumId: firstSubject.id,
      subjectType: firstSubject.type === 'THEORY' ? 'theory' : 'practical',
      year: 1,
      semester: 1,
    };
  }

  return null;
}
