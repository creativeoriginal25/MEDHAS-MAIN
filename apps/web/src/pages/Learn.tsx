import React, { useState, useEffect } from 'react';
import { contentApi } from '../api/client';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  FileText, 
  ExternalLink, 
  BookmarkCheck,
  ChevronRight,
  Download,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  FileCheck
} from 'lucide-react';

interface UnitDetail {
  unit_number: number;
  title: string;
  weightage: string;
  topics: string[];
  key_formulas?: string[];
  important_questions: string[];
  lecture_summary: string;
}

// Comprehensive Academic Syllabus, Formulas & Question Bank for SRKR Autonomous Curriculum
const DETAILED_SYLLABUS: Record<string, UnitDetail[]> = {
  // Applied Physics (BS102)
  'BS102': [
    {
      unit_number: 1,
      title: 'Wave Optics & Interference',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Principle of Superposition & Coherence of Light Waves',
        'Interference in Thin Films by Reflection & Cosine Law',
        'Newton\'s Rings Experiment: Theory & Measurement of Wavelength (λ)',
        'Determination of Refractive Index of Liquids using Newton\'s Rings',
        'Michelson\'s Interferometer: Working Principle & Circular Fringes',
        'Engineering Applications: Anti-Reflection Coatings & Surface Testing'
      ],
      key_formulas: [
        'Fringe Width (Interference): β = λ·D / d',
        'Thin Film Condition (Reflected): 2μt cos(r) = (2n - 1)λ / 2',
        'Newton\'s Rings Diameter: Dn² = 4n·λ·R'
      ],
      important_questions: [
        'Derive the condition for constructive and destructive interference in thin films due to reflected light.',
        'Describe Newton\'s rings experiment with neat diagram and derive the expression for diameter of dark rings.',
        'Explain the construction and working of Michelson\'s Interferometer. How can it measure wavelength?'
      ],
      lecture_summary: 'Light behaves as an electromagnetic wave capable of interference. When light strikes a thin film of oil or glass, reflections from the top and bottom surfaces interfere, creating colorful bands governed by the optical path difference 2μt cos(r). Newton\'s rings demonstrate interference in a wedge-shaped air film between a plano-convex lens and glass plate.'
    },
    {
      unit_number: 2,
      title: 'Lasers & Optical Fiber Communication',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Characteristics of Laser Light: Directionality, Monochromaticity & Coherence',
        'Einstein Coefficients: Absorption, Spontaneous & Stimulated Emission',
        'Population Inversion, Pumping Schemes & Optical Cavity Resonator',
        'Construction & Working of Helium-Neon (He-Ne) Gas Laser',
        'Ruby Laser: Three-Level Energy Diagram & Pulsed Output',
        'Optical Fiber Principle: Total Internal Reflection & Acceptance Angle',
        'Numerical Aperture (NA), V-Number & Fiber Modes (Step-Index vs Graded-Index)'
      ],
      key_formulas: [
        'Einstein Relation: B₁₂ = B₂₁, A₂₁ / B₂₁ = 8πhν³ / c³',
        'Numerical Aperture: NA = √(n₁² - n₂²)',
        'Acceptance Angle: θa = sin⁻¹(NA) = sin⁻¹(√(n₁² - n₂²))'
      ],
      important_questions: [
        'Explain the principle of laser. Describe the construction and working of He-Ne laser with energy level diagram.',
        'Derive an expression for the Numerical Aperture and Acceptance Angle of an optical fiber.',
        'Differentiate between Step-Index and Graded-Index optical fibers with refractive index profiles.'
      ],
      lecture_summary: 'Lasers amplify light through stimulated emission of radiation, producing intense, coherent beams. Optical fibers guide this light over long distances with minimal loss using total internal reflection, forming the backbone of worldwide high-speed telecommunications.'
    },
    {
      unit_number: 3,
      title: 'Quantum Mechanics & Matter Waves',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'De Broglie Hypothesis: Wave-Particle Duality of Matter',
        'Davisson & Germer Electron Diffraction Experiment',
        'Heisenberg\'s Uncertainty Principle & Physical Implications',
        'Wave Function (ψ) & Max Born\'s Probabilistic Interpretation (|ψ|²)',
        'Schrödinger Time-Independent Wave Equation Derivation',
        'Particle in an Infinite 1D Potential Box: Eigenvalues & Normalized Eigenfunctions'
      ],
      key_formulas: [
        'De Broglie Wavelength: λ = h / p = h / √(2mE)',
        'Heisenberg Uncertainty: Δx · Δp ≥ ℏ / 2  (ℏ = h / 2π)',
        'Energy Eigenvalues (1D Box): En = (n²h²) / (8mL²), n = 1, 2, 3...'
      ],
      important_questions: [
        'State De Broglie hypothesis. Describe Davisson and Germer experiment for confirmation of matter waves.',
        'Derive Schrödinger\'s time-independent 1-dimensional wave equation.',
        'Obtain the energy eigenvalues and normalized wave functions for a quantum particle in a 1D box.'
      ],
      lecture_summary: 'At microscopic scales, matter exhibits both wave and particle characteristics. The state of a microscopic particle is described by the wave function ψ, calculated via the Schrödinger equation. Confinement in a potential well leads naturally to quantized, discrete energy levels.'
    },
    {
      unit_number: 4,
      title: 'Semiconductor Physics & Hall Effect',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Energy Band Formation in Solids: Valence Band, Conduction Band & Forbidden Gap',
        'Intrinsic Semiconductors: Carrier Concentration (ni) & Fermi Level Location',
        'Extrinsic Semiconductors: N-Type & P-Type Dopants & Carrier Densities',
        'Temperature Dependence of Conductivity in Semiconductors',
        'Hall Effect: Mechanism, Hall Voltage (Vh) & Hall Coefficient (Rh)',
        'Experimental Determination of Carrier Type, Mobility (μ) & Carrier Density',
        'Direct vs Indirect Band Gap Semiconductors'
      ],
      key_formulas: [
        'Intrinsic Carrier Density: ni = √(Nc · Nv) · exp(-Eg / (2kBT))',
        'Hall Coefficient: Rh = 1 / (n·e) [n-type] or 1 / (p·e) [p-type]',
        'Electrical Conductivity: σ = e(n·μe + p·μh)'
      ],
      important_questions: [
        'Derive the expression for carrier concentration in an intrinsic semiconductor and show Fermi level is at center.',
        'Explain Hall Effect. Derive the expression for Hall coefficient and state four practical applications.',
        'Distinguish between direct and indirect bandgap semiconductors with energy momentum (E-k) diagrams.'
      ],
      lecture_summary: 'Semiconductors have electrical conductivity between conductors and insulators. Doping with pentavalent or trivalent atoms increases free electrons or holes. The Hall Effect occurs when a current-carrying conductor is placed in a magnetic field, creating a transverse voltage used to identify carrier polarity.'
    },
    {
      unit_number: 5,
      title: 'Electromagnetic Field Theory',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Vector Calculus Operators: Gradient, Divergence (∇·) & Curl (∇×)',
        'Gauss\'s Law in Electrostatics & Magnetostatics',
        'Faraday\'s Law of Electromagnetic Induction in Differential Form',
        'Ampere\'s Circuital Law & Maxwell\'s Displacement Current Concept (Jd)',
        'Maxwell\'s Four Fundamental Equations in Differential & Integral Forms',
        'Electromagnetic Wave Equation in Free Space & Speed of Light Verification',
        'Poynting Vector (S) & Poynting Theorem: Energy Density and Flow'
      ],
      key_formulas: [
        'Maxwell I (Gauss): ∇ · D = ρv',
        'Maxwell II (Magnetic): ∇ · B = 0',
        'Maxwell III (Faraday): ∇ × E = -∂B / ∂t',
        'Maxwell IV (Ampere-Maxwell): ∇ × H = J + ∂D / ∂t',
        'Poynting Vector: S = E × H  (Watts / m²)'
      ],
      important_questions: [
        'State Maxwell\'s equations in differential and integral forms. Explain physical significance of each equation.',
        'Explain Maxwell\'s modification of Ampere\'s Law by introducing displacement current.',
        'Derive the electromagnetic wave equation from Maxwell\'s equations and prove electromagnetic waves travel at velocity c.'
      ],
      lecture_summary: 'Maxwell unified electricity and magnetism into four comprehensive equations. By identifying displacement current, he predicted that changing electric fields generate magnetic fields, allowing self-propagating electromagnetic waves that travel at the speed of light in vacuum.'
    }
  ],

  // Mathematics (BS101)
  'BS101': [
    {
      unit_number: 1,
      title: 'Matrices & Linear Systems of Equations',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Rank of a Matrix: Echelon Form & Normal Form',
        'Consistency of Non-Homogeneous Linear Systems: AX = B',
        'Homogeneous Systems of Linear Equations: AX = 0',
        'Eigenvalues & Eigenvectors of Real Symmetric Matrices',
        'Cayley-Hamilton Theorem: Verification & Computation of A⁻¹ and Aⁿ',
        'Diagonalization of Matrices by Orthogonal Transformation'
      ],
      key_formulas: [
        'Characteristic Equation: |A - λI| = 0',
        'Sum of Eigenvalues = Trace(A)',
        'Product of Eigenvalues = Det(A)'
      ],
      important_questions: [
        'Find the rank of matrix using Echelon form.',
        'State and prove Cayley-Hamilton theorem, and find A⁻¹ for a 3x3 matrix.',
        'Diagonalize a given real symmetric matrix by orthogonal reduction.'
      ],
      lecture_summary: 'Matrices provide the algebraic foundation for graphics, data science, and system stability. Solving AX = B determines uniqueness of engineering equilibria.'
    },
    {
      unit_number: 2,
      title: 'Differential Equations of First Order',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Exact Differential Equations & Integrating Factors',
        'Linear Differential Equations & Bernoulli\'s Differential Equation',
        'Orthogonal Trajectories: Cartesian & Polar Forms',
        'Newton\'s Law of Cooling & Law of Natural Growth/Decay',
        'Applications in Simple RL and RC Electrical Circuits'
      ],
      key_formulas: [
        'Exact Condition: ∂M/∂y = ∂N/∂x',
        'Linear ODE: dy/dx + P(x)y = Q(x) → y · e^(∫Pdx) = ∫ Q·e^(∫Pdx)dx + C'
      ],
      important_questions: [
        'Solve Bernoulli\'s equation dy/dx + Py = Q·yⁿ.',
        'Find the orthogonal trajectories of family of curves y = a·x².',
        'A body cools from 100°C to 70°C in 15 minutes. Find time to cool to 40°C.'
      ],
      lecture_summary: 'First order differential equations model physical rates of change including thermal dissipation, circuit discharge, and decay curves.'
    },
    {
      unit_number: 3,
      title: 'Higher Order Linear Differential Equations',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Homogeneous Linear ODEs with Constant Coefficients',
        'Complementary Function (CF) & Particular Integral (PI)',
        'Rules for Finding PI: e^(ax), sin(ax)/cos(ax), xᵐ, e^(ax)V(x)',
        'Method of Variation of Parameters for 2nd Order ODEs',
        'Cauchy-Euler Equidimensional Differential Equations'
      ],
      key_formulas: [
        'PI for e^(ax): 1/f(D) · e^(ax) = e^(ax)/f(a), provided f(a) ≠ 0',
        'Variation of Parameters: PI = u·y₁ + v·y₂ where W = y₁y₂\' - y₁\'y₂'
      ],
      important_questions: [
        'Solve (D² + 4D + 5)y = e^(-2x) + sin(x).',
        'Solve by variation of parameters: d²y/dx² + y = sec(x).',
        'Solve Cauchy\'s homogeneous equation x²(d²y/dx²) - 2x(dy/dx) - 4y = x².'
      ],
      lecture_summary: 'Higher-order linear ODEs govern mechanical vibrations, AC resonance, and harmonic motion.'
    },
    {
      unit_number: 4,
      title: 'Multivariable Calculus & Partial Differentiation',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Functions of Two Variables: Limits & Continuity',
        'Euler\'s Theorem for Homogeneous Functions & Corollaries',
        'Total Derivative & Chain Rule for Multivariable Functions',
        'Jacobians: Properties & Coordinate Transformations',
        'Maxima & Minima for Functions of Two Variables',
        'Lagrange\'s Method of Undetermined Multipliers'
      ],
      key_formulas: [
        'Euler\'s Theorem: x(∂u/∂x) + y(∂u/∂y) = n·u',
        'Jacobian: J(u,v/x,y) = (∂u/∂x)(∂v/∂y) - (∂u/∂y)(∂v/∂x)'
      ],
      important_questions: [
        'Verify Euler\'s theorem for u = sin⁻¹((x + y)/(√x + √y)).',
        'Find the maximum and minimum values of f(x,y) = x³ + y³ - 3axy.',
        'Find dimensions of a rectangular box of maximum volume with fixed surface area S.'
      ],
      lecture_summary: 'Partial derivatives calculate local gradients and optimal configurations in multi-dimensional space.'
    },
    {
      unit_number: 5,
      title: 'Vector Calculus & Integral Theorems',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Vector Differentiation: Gradient, Divergence & Curl Identities',
        'Directional Derivatives & Unit Normal Vectors to Surfaces',
        'Line Integrals: Work Done by a Force Field & Conservative Fields',
        'Surface & Volume Integrals',
        'Green\'s Theorem in a Plane: Statement & Verification',
        'Stoke\'s Theorem & Gauss Divergence Theorem: Applications'
      ],
      key_formulas: [
        'Directional Derivative: ∇φ · n̂',
        'Gauss Divergence: ∬ F · n̂ dS = ∭ (∇ · F) dV',
        'Stoke\'s Theorem: ∮ F · dr = ∬ (∇ × F) · n̂ dS'
      ],
      important_questions: [
        'Verify Green\'s theorem in the plane for ∮ (xy + y²)dx + x² dy.',
        'Verify Gauss Divergence theorem for F = 4xz î - y² ĵ + yz k̂ over a unit cube.',
        'State Stoke\'s theorem and verify for F = (2x - y)î - yz² ĵ - y²z k̂.'
      ],
      lecture_summary: 'Vector integration transforms line integrals around boundaries into surface and volume fluxes, central to fluid flow and electromagnetics.'
    }
  ],

  // C Programming (ES101)
  'ES101': [
    {
      unit_number: 1,
      title: 'Algorithms, Flowcharts & C Fundamentals',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Problem Solving Concepts: Algorithms, Flowcharts & Pseudo-code',
        'C Language Structure, Character Set, Identifiers & Keywords',
        'Data Types: Primitive, Derived & User-Defined',
        'Operators: Arithmetic, Relational, Logical, Bitwise & Ternary',
        'Type Casting & Operator Precedence Rules',
        'Formatted Input/Output: printf(), scanf() & Conversion Specifiers'
      ],
      key_formulas: [
        'Bitwise AND (&), OR (|), XOR (^), Left Shift (<<), Right Shift (>>)',
        'Ternary Operator: condition ? value_if_true : value_if_false'
      ],
      important_questions: [
        'Explain various operators supported in C with precedence table and examples.',
        'Write an algorithm and draw a flowchart to find the roots of a quadratic equation.',
        'Discuss primary data types in C and memory occupied by each.'
      ],
      lecture_summary: 'Foundational programming constructs in C, memory representation of numbers, and sequential execution.'
    },
    {
      unit_number: 2,
      title: 'Control Flow & Looping Structures',
      weightage: '14 Marks · Mid-Term 1',
      topics: [
        'Decision Making: Simple if, if-else, nested if-else, else-if ladder',
        'Multi-way Branching: switch-case Statement & break rules',
        'Iteration Structures: while loop, do-while loop & for loop',
        'Loop Control: break, continue & goto Statements',
        'Nested Loops & Pattern Generation Problems'
      ],
      key_formulas: [
        'Sentinel-Controlled vs Counter-Controlled loops'
      ],
      important_questions: [
        'Differentiate between while and do-while loops with syntax and flowcharts.',
        'Write a C program to check whether a given integer is prime or composite.',
        'Explain switch-case statement rules and write a calculator program.'
      ],
      lecture_summary: 'Conditional branching and looping control execution paths to automate repetitive computations.'
    },
    {
      unit_number: 3,
      title: 'Arrays, Strings & Modular Functions',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'One-Dimensional Arrays: Declaration, Memory Layout & Accessing',
        'Two-Dimensional Arrays: Matrix Addition & Matrix Multiplication',
        'Character Arrays & Strings: String Literal storage & Null Terminator (\'\\0\')',
        'String Handling Functions: strlen(), strcpy(), strcat(), strcmp()',
        'User-Defined Functions: Definition, Declaration, Function Prototypes',
        'Call by Value vs Call by Reference Concepts',
        'Recursion: Base Case, Recursive Step & Tower of Hanoi Problem'
      ],
      key_formulas: [
        'Memory Address for Array[i]: Base + (i * sizeof(DataType))'
      ],
      important_questions: [
        'Write a C program to perform matrix multiplication of two matrices with order check.',
        'Explain Call by Value and Call by Reference with suitable swapping code.',
        'What is recursion? Write recursive functions for Factorial and Fibonacci series.'
      ],
      lecture_summary: 'Arrays store contiguous memory collections. Functions provide modular code reuse and recursion solves self-referential subproblems.'
    },
    {
      unit_number: 4,
      title: 'Pointers & Dynamic Memory Allocation',
      weightage: '14 Marks · Mid-Term 2',
      topics: [
        'Pointer Concepts: Address-of Operator (&) & Dereference Operator (*)',
        'Pointer Arithmetic: Increment, Decrement, Pointer Comparison',
        'Pointers and Arrays: Array Name as Constant Pointer',
        'Pointers to Pointers (Double Pointers) & Function Pointers',
        'Dynamic Memory Allocation: malloc(), calloc(), realloc(), free()',
        'Memory Leaks, Dangling Pointers & Wild Pointers Prevention'
      ],
      key_formulas: [
        'malloc(size_in_bytes) vs calloc(num_elements, size_each)'
      ],
      important_questions: [
        'Explain dynamic memory allocation functions (malloc, calloc, realloc, free) with code.',
        'Write a C program using pointers to swap two numbers without temporary variable.',
        'Discuss dangling pointers and how to prevent memory leaks in production C code.'
      ],
      lecture_summary: 'Pointers directly manipulate RAM memory addresses, powering dynamic data structures and high-performance algorithms.'
    },
    {
      unit_number: 5,
      title: 'Structures, Unions & File Handling',
      weightage: '14 Marks · Semester End Exam',
      topics: [
        'Structures: Definition, Initialization, Nested Structures, Array of Structures',
        'Structure Padding & sizeof(struct) memory alignment',
        'Unions: Shared Memory Concept & Differences between Struct and Union',
        'Enumerated Types (enum) & typedef keyword',
        'File Handling in C: FILE pointer, fopen(), modes ("r", "w", "a", "rb", "wb")',
        'File I/O Functions: fgetc(), fputc(), fgets(), fputs(), fscanf(), fprintf()',
        'Random File Access: fseek(), ftell(), rewind()'
      ],
      key_formulas: [
        'Struct memory = Sum of member sizes + padding; Union memory = Max member size'
      ],
      important_questions: [
        'Differentiate between Structures and Unions with memory layout diagrams.',
        'Write a C program to create a student file, write records, and search by roll number.',
        'Explain file opening modes and functions used for sequential and random access.'
      ],
      lecture_summary: 'Structures group heterogeneous data. File operations persist student records and engineering data to disk storage.'
    }
  ]
};

export const Learn: React.FC = () => {
  const [subTab, setSubTab] = useState<'subjects' | 'search' | 'saved'>('subjects');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Saved resources state
  const [savedUnits, setSavedUnits] = useState<Set<string>>(() => {
    const cached = localStorage.getItem('saved_units');
    return cached ? new Set(JSON.parse(cached)) : new Set(['BS102-1', 'BS101-1']);
  });

  // Notes Reader Drawer Modal State
  const [readerUnit, setReaderUnit] = useState<UnitDetail | null>(null);

  const [loading, setLoading] = useState(false);

  // Load departments
  useEffect(() => {
    contentApi.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  // Load subjects when department changes
  useEffect(() => {
    if (subTab === 'subjects') {
      setLoading(true);
      contentApi.getSubjects(selectedDept)
        .then(data => {
          setSubjects(data);
          if (data.length > 0) {
            handleSelectSubject(data[0]);
          } else {
            setSelectedSubject(null);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedDept, subTab]);

  const handleSelectSubject = (subj: any) => {
    setSelectedSubject(subj);
    setSelectedUnitNumber(null);
  };

  const toggleSaveUnit = (key: string) => {
    setSavedUnits(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem('saved_units', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Get active units for selected subject
  const currentUnits: UnitDetail[] = (selectedSubject && DETAILED_SYLLABUS[selectedSubject.code]) 
    ? DETAILED_SYLLABUS[selectedSubject.code] 
    : (selectedSubject && DETAILED_SYLLABUS['BS102']) || [];

  const displayedUnits = selectedUnitNumber === null 
    ? currentUnits 
    : currentUnits.filter(u => u.unit_number === selectedUnitNumber);

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Top Academic Navigation Bar */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${subTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('subjects')}
            >
              <BookOpen size={15} />
              <span>Academic Syllabus & Notes</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${subTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('search')}
            >
              <Search size={15} />
              <span>Search Library</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${subTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('saved')}
            >
              <Bookmark size={15} />
              <span>Saved Units ({savedUnits.size})</span>
            </button>
          </div>

          {/* Branch Picker */}
          {subTab === 'subjects' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600 }}>Branch:</span>
              <select
                className="input-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minWidth: '150px' }}
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: SUBJECTS & STRUCTURED UNITS (APPLIED PHYSICS, MATHS, C, ETC.) */}
      {subTab === 'subjects' && (
        <div>
          {/* Subject Switcher Ribbon for Quick Switching */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
          }}>
            {subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectSubject(sub)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontWeight: isSelected ? 700 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{sub.icon || '📖'}</span>
                  <span>{sub.title}</span>
                  <span className="mono-num" style={{ opacity: 0.75, fontSize: '0.7rem' }}>
                    {sub.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Subject Hero Card */}
          {selectedSubject && (
            <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                      {selectedSubject.code}
                    </span>
                    <span className="badge badge-good" style={{ fontSize: '0.7rem' }}>
                      Core Academic Course
                    </span>
                  </div>
                  <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>
                    {selectedSubject.title}
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {selectedSubject.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                    SRKR R20/R23 Curriculum
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>
                    5 Core Units · 70 Marks External
                  </div>
                </div>
              </div>

              {/* Units Navigation Filter Bar (All Units, Unit 1, Unit 2, Unit 3, Unit 4, Unit 5) */}
              <div style={{
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                paddingTop: '0.5rem',
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedUnitNumber === null ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedUnitNumber(null)}
                  style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem', whiteSpace: 'nowrap' }}
                >
                  <Layers size={13} />
                  <span>All Units (5)</span>
                </button>
                {[1, 2, 3, 4, 5].map((num) => {
                  const isActive = selectedUnitNumber === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSelectedUnitNumber(num)}
                      style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem', whiteSpace: 'nowrap' }}
                    >
                      Unit {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Structured Units List with Crisp Borders and Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {displayedUnits.map((unit) => {
              const saveKey = `${selectedSubject?.code || 'SUB'}-${unit.unit_number}`;
              const isSaved = savedUnits.has(saveKey);

              return (
                <div key={unit.unit_number} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                  {/* Unit Card Header */}
                  <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                          UNIT {unit.unit_number}
                        </span>
                        <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-gold, #d97706)', border: '1px solid rgba(217, 119, 6, 0.3)', fontSize: '0.7rem' }}>
                          {unit.weightage}
                        </span>
                      </div>
                      <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {unit.title}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleSaveUnit(saveKey)}
                        title={isSaved ? 'Remove from Saved' : 'Save Unit to Revision Deck'}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        {isSaved ? <BookmarkCheck size={14} color="var(--accent-gold)" /> : <Bookmark size={14} />}
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setReaderUnit(unit)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <FileText size={14} />
                        <span>Read Lecture Notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Abstract */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '1rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent-gold)', paddingLeft: '0.75rem' }}>
                    {unit.lecture_summary}
                  </p>

                  {/* 2-Column Structured Layout: Topics & Formulas */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}>
                    {/* Topics Covered Box */}
                    <div style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={13} color="var(--good)" />
                        <span>Core Topics & Syllabus Breakdown:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                        {unit.topics.map((t, idx) => (
                          <li key={idx} style={{ marginBottom: '0.2rem' }}>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Formulas & Equations Box */}
                    <div style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={13} color="var(--accent-gold)" />
                        <span>Essential Equations & Formulae:</span>
                      </div>
                      {unit.key_formulas && unit.key_formulas.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {unit.key_formulas.map((f, idx) => (
                            <div key={idx} className="mono-num" style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--rule)',
                              borderRadius: '4px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.78rem',
                              color: 'var(--ink)',
                              fontWeight: 600,
                            }}>
                              {f}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                          Concepts are qualitative & algorithmic.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* University Exam Question Bank */}
                  <div style={{
                    background: 'rgba(36, 27, 78, 0.03)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <HelpCircle size={13} color="var(--ink)" />
                      <span>Previous Exam Questions (14 Marks Weightage):</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {unit.important_questions.map((q, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.45, display: 'flex', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Q{idx + 1}.</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SEARCH LIBRARY */}
      {subTab === 'search' && (
        <div>
          <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Search Academic Registry</span>
            </div>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Search topics, questions, formulas (e.g. Wave Optics, Newton's Rings, Eigenvalues, Pointers)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.9rem' }}
                autoFocus
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
            </div>
          </div>

          {/* Search match cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {searchQuery.trim().length > 1 ? (
              Object.entries(DETAILED_SYLLABUS).flatMap(([code, uList]) => 
                uList.filter(u => 
                  u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  u.important_questions.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map(u => (
                  <div key={`${code}-${u.unit_number}`} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="badge badge-neutral mono-num" style={{ marginBottom: '0.2rem' }}>
                          {code} · Unit {u.unit_number}
                        </span>
                        <h4 className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          {u.title}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                          {u.topics.slice(0, 3).join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setReaderUnit(u)}
                      >
                        <FileText size={14} />
                        <span>View Notes</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              <div className="ledger-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                Type keywords above to instantly locate syllabus units, questions, and lecture summaries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SAVED UNITS REVISION DECK */}
      {subTab === 'saved' && (
        <div>
          <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Bookmarked Units for Exam Revision</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', marginTop: '0.35rem' }}>
              Your personal study bookmark deck. Saved across devices and available offline.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Array.from(savedUnits).map((key) => {
              const [code, unitNum] = key.split('-');
              const unit = DETAILED_SYLLABUS[code]?.find(u => u.unit_number === parseInt(unitNum, 10));
              if (!unit) return null;

              return (
                <div key={key} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span className="badge badge-neutral mono-num">{code}</span>
                        <span className="badge badge-good mono-num">Unit {unit.unit_number}</span>
                      </div>
                      <h4 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {unit.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        {unit.weightage} · {unit.topics.length} Key Topics Covered
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setReaderUnit(unit)}
                      >
                        <FileText size={14} />
                        <span>Open Notes</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleSaveUnit(key)}
                        title="Remove bookmark"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LECTURE NOTES PREVIEW MODAL */}
      {readerUnit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="ledger-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            border: '2px solid var(--rule)',
          }}>
            <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-neutral mono-num" style={{ marginBottom: '0.2rem' }}>
                  UNIT {readerUnit.unit_number} STUDY DECK
                </span>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {readerUnit.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setReaderUnit(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.25rem 0', flex: 1 }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                  Summary Overview:
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                  {readerUnit.lecture_summary}
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                  Syllabus Checklist:
                </h4>
                <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {readerUnit.topics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {readerUnit.key_formulas && readerUnit.key_formulas.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    Formulas & Key Laws:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {readerUnit.key_formulas.map((f, idx) => (
                      <div key={idx} className="mono-num" style={{ background: 'var(--surface-alt)', border: '1px solid var(--rule)', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                  University Exam Questions (14 Marks):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {readerUnit.important_questions.map((q, idx) => (
                    <div key={idx} style={{ background: 'rgba(36, 27, 78, 0.03)', border: '1px solid var(--rule)', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.825rem', lineHeight: 1.45 }}>
                      <strong>Q{idx + 1}.</strong> {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                SRKR Department of Engineering Physics & Core Sciences
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReaderUnit(null)}
              >
                Close Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Learn;
