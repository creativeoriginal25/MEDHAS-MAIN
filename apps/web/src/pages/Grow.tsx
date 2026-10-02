import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resolveStudentDepartment, getDepartmentCurriculum } from '../data/r26Curriculum';
import { growApi, contentApi } from '../api/client';
import { 
  Sparkles, 
  Compass, 
  Map, 
  Copy, 
  Check, 
  Briefcase, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  X,
  Target,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CareerCard {
  title: string;
  demand: string;
  salary: string;
  summary: string;
  skills: string[];
  certifications: string[];
  companies: string[];
}

const FALLBACK_CAREER_TRACKS: Record<string, CareerCard[]> = {
  'CSE': [
    {
      title: 'Full-Stack Software Engineer',
      demand: 'High Demand · 94% Placement Index',
      salary: '₹7.5 – 18.0 LPA',
      summary: 'Architect scalable web applications, microservices, and reactive user interfaces using modern TypeScript, React, Node.js/FastAPI, and SQL databases.',
      skills: ['TypeScript', 'React.js', 'FastAPI/Node.js', 'PostgreSQL', 'Docker', 'REST & GraphQL'],
      certifications: ['AWS Certified Developer Associate', 'Meta Front-End Professional'],
      companies: ['Amazon', 'Microsoft', 'TCS Digital', 'Accenture', 'Cognizant GenC Next']
    },
    {
      title: 'Cloud & DevOps Architect',
      demand: 'Very High Demand · Cloud Surge',
      salary: '₹8.0 – 22.0 LPA',
      summary: 'Build robust CI/CD pipelines, container orchestration, infrastructure as code, and automated zero-downtime deployment environments on AWS/GCP.',
      skills: ['Docker & Kubernetes', 'Terraform', 'AWS / GCP Cloud', 'GitHub Actions', 'Linux Bash', 'Prometheus & Grafana'],
      certifications: ['AWS Solutions Architect', 'CKA (Certified Kubernetes Administrator)'],
      companies: ['Google Cloud', 'Oracle Cloud', 'Wipro Turbo', 'Persistent', 'Infosys Power Programmer']
    },
    {
      title: 'AI / Machine Learning Engineer',
      demand: 'Emerging · Frontier Tech',
      salary: '₹9.0 – 25.0 LPA',
      summary: 'Train, fine-tune, and deploy deep learning models, LLM agents, and computer vision pipelines to solve complex automation problems.',
      skills: ['Python', 'PyTorch / TensorFlow', 'HuggingFace', 'Pandas & NumPy', 'Vector DBs (Chroma/Pinecone)', 'MLOps'],
      certifications: ['Google Professional Machine Learning Engineer', 'DeepLearning.AI Specialization'],
      companies: ['NVIDIA', 'Tiger Analytics', 'Fractal Analytics', 'Bosch', 'Tech Mahindra Makers Lab']
    },
    {
      title: 'Cybersecurity & Security Engineer',
      demand: 'Critical Defense · High Resilience',
      salary: '₹7.0 – 17.5 LPA',
      summary: 'Audit software vulnerabilities, implement encryption protocols, conduct penetration testing, and protect corporate digital infrastructure.',
      skills: ['Network Security', 'OWASP Top 10', 'Penetration Testing', 'Cryptography', 'SIEM & SOC Tools', 'Wireshark'],
      certifications: ['CompTIA Security+', 'CEH (Certified Ethical Hacker)'],
      companies: ['KPMG Cyber', 'Deloitte Risk Advisory', 'Cisco', 'PwC Cyber Defense']
    }
  ],
  'CSIT': [
    {
      title: 'Enterprise Software & Cloud Engineer',
      demand: 'High Demand · Core Computing',
      salary: '₹7.5 – 18.0 LPA',
      summary: 'Design large-scale distributed architectures, enterprise database integrations, and high-availability cloud APIs.',
      skills: ['Java / Spring Boot', 'Python', 'Docker & Kubernetes', 'PostgreSQL', 'Microservices', 'RESTful APIs'],
      certifications: ['AWS Certified Solutions Architect', 'Oracle Certified Java Professional'],
      companies: ['Microsoft', 'Infosys Power Programmer', 'TCS Digital', 'Cognizant GenC Next', 'Accenture']
    },
    {
      title: 'DevOps & Site Reliability Engineer',
      demand: 'Critical Infrastructure · High Growth',
      salary: '₹8.0 – 20.0 LPA',
      summary: 'Automate build deployments, manage container orchestration, and monitor system resilience across hybrid cloud environments.',
      skills: ['Docker & Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Linux Systems', 'Prometheus & Grafana'],
      certifications: ['Certified Kubernetes Administrator (CKA)', 'AWS DevOps Engineer'],
      companies: ['Google Cloud', 'Oracle Cloud', 'Wipro Turbo', 'Persistent Systems']
    }
  ],
  'AIML': [
    {
      title: 'Machine Learning & Deep Learning Engineer',
      demand: 'Exponential Demand · Frontier AI',
      salary: '₹9.0 – 26.0 LPA',
      summary: 'Design neural network architectures, train computer vision and NLP models, and deploy scalable ML inference engines.',
      skills: ['Python', 'PyTorch / TensorFlow', 'Hugging Face', 'NumPy & Pandas', 'OpenCV', 'MLOps & Triton'],
      certifications: ['Google Professional ML Engineer', 'DeepLearning.AI Specialization'],
      companies: ['NVIDIA', 'Tiger Analytics', 'Fractal Analytics', 'Bosch AI', 'Qualcomm AI Lab']
    },
    {
      title: 'Generative AI & LLM Systems Specialist',
      demand: 'Emerging · Frontier Innovation',
      salary: '₹10.0 – 28.0 LPA',
      summary: 'Build Retrieval-Augmented Generation (RAG) pipelines, fine-tune open weights LLMs, and implement multi-agent workflows.',
      skills: ['LangChain / LlamaIndex', 'Vector Databases (Chroma/Pinecone)', 'Python', 'Prompt Engineering', 'FastAPI'],
      certifications: ['Databricks Generative AI Engineer', 'AWS Machine Learning Specialty'],
      companies: ['Amazon AWS', 'Microsoft AI', 'Accenture AI Studio', 'TCS AI Labs']
    }
  ],
  'AIDS': [
    {
      title: 'Data Science & Predictive Modeling Engineer',
      demand: 'High Industry Demand · Strategic Analytics',
      salary: '₹8.0 – 22.0 LPA',
      summary: 'Analyze massive structured and unstructured datasets, build predictive statistical models, and drive data-informed business decisions.',
      skills: ['Python / R', 'SQL & Database Warehousing', 'Scikit-Learn', 'Tableau / PowerBI', 'Statistical Modeling'],
      certifications: ['Google Advanced Data Analytics', 'Microsoft Certified: Power BI Data Analyst'],
      companies: ['Fractal Analytics', 'Tiger Analytics', 'LatentView', 'Deloitte Analytics', 'Mu Sigma']
    },
    {
      title: 'Big Data Pipeline Architect',
      demand: 'Critical Data Engineering Surge',
      salary: '₹8.5 – 24.0 LPA',
      summary: 'Engineer real-time streaming data ingestion pipelines, ETL workflows, and lakehouse storage platforms for enterprise scale.',
      skills: ['Apache Spark', 'Kafka', 'SQL', 'Databricks / Snowflake', 'Python', 'AWS S3 & Glue'],
      certifications: ['Databricks Certified Data Engineer', 'AWS Certified Data Engineer'],
      companies: ['Walmart Global Tech', 'Tiger Analytics', 'Cognizant', 'TCS Data Practice']
    }
  ],
  'IT': [
    {
      title: 'Full-Stack Web & Cloud Developer',
      demand: 'Consistent High Demand · 92% Placement Index',
      salary: '₹7.0 – 17.0 LPA',
      summary: 'Architect responsive modern frontends and cloud microservices backends using TypeScript, React, and serverless architectures.',
      skills: ['TypeScript', 'React.js', 'Node.js / Express', 'PostgreSQL / MongoDB', 'AWS Cloud', 'Docker'],
      certifications: ['Meta Full-Stack Professional', 'AWS Certified Developer'],
      companies: ['Cognizant', 'TCS Digital', 'Accenture', 'Infosys', 'Capgemini']
    }
  ],
  'CSBS': [
    {
      title: 'FinTech & Enterprise Solutions Consultant',
      demand: 'High Enterprise Demand · Techno-Business Blend',
      salary: '₹8.0 – 20.0 LPA',
      summary: 'Bridge core software engineering and financial/business systems, engineering enterprise ERP platforms and fintech workflows.',
      skills: ['Python', 'SQL', 'Financial Data Modeling', 'Enterprise Architecture', 'FastAPI', 'Cloud Computing'],
      certifications: ['PMI Agile Certified Practitioner', 'AWS Cloud Solutions'],
      companies: ['TCS Digital (TCS-CSBS Partner)', 'Deloitte', 'KPMG', 'Goldman Sachs', 'Morgan Stanley']
    }
  ],
  'CSD': [
    {
      title: 'UI/UX & Interactive Design Systems Engineer',
      demand: 'Frontier Creative Tech · Product Design',
      salary: '₹7.5 – 18.0 LPA',
      summary: 'Synthesize computational design principles, human-computer interaction (HCI), and advanced reactive frontends to build digital product interfaces.',
      skills: ['Figma & Design Systems', 'React & TypeScript', 'CSS Architecture & Animation', 'HCI Principles', 'User Research'],
      certifications: ['Google UX Design Professional', 'Nielsen Norman Group UX Master'],
      companies: ['Adobe', 'Zoho', 'Thoughtworks', 'Swiggy', 'Freshworks']
    }
  ],
  'CIC': [
    {
      title: 'Cybersecurity Analyst & Threat Defense Engineer',
      demand: 'National Strategic Demand · Critical Defense',
      salary: '₹7.5 – 19.0 LPA',
      summary: 'Defend organizational networks, identify zero-day vulnerabilities, implement cryptographic access protocols, and manage SOC workflows.',
      skills: ['Network Security', 'Cryptography', 'SIEM & SOC Tools', 'Wireshark', 'Ethical Hacking', 'Linux Hardening'],
      certifications: ['CompTIA Security+', 'CEH (Certified Ethical Hacker)', 'Cisco CyberOps'],
      companies: ['Cisco', 'Palo Alto Networks', 'Deloitte Cyber', 'PwC Defense', 'KPMG Security']
    },
    {
      title: 'Blockchain & Decentralized Ledger Engineer',
      demand: 'Frontier Emerging Technology',
      salary: '₹8.5 – 22.0 LPA',
      summary: 'Engineer smart contracts, consensus algorithms, and decentralized applications (dApps) across secure blockchain networks.',
      skills: ['Solidity', 'Ethereum / Hyperledger', 'Cryptography', 'Web3.js', 'Go / Rust', 'Distributed Systems'],
      certifications: ['Certified Blockchain Solution Architect (CBSA)'],
      companies: ['Polygon', 'ConsenSys', 'Wipro Blockchain', 'Tech Mahindra Makers Lab']
    }
  ],
  'ECE': [
    {
      title: 'VLSI Design & Verification Engineer',
      demand: 'High Core Demand · Semiconductor Wave',
      salary: '₹8.5 – 24.0 LPA',
      summary: 'Design, simulate, and verify digital/analog integrated circuits, ASIC chips, and FPGA logic for semiconductor fabrication.',
      skills: ['Verilog / SystemVerilog', 'UVM Verification', 'FPGA Programming', 'Cadence / Synopsys Tools', 'CMOS Logic', 'Digital Circuit Design'],
      certifications: ['Cadence Certified VLSI Designer', 'ARM Accredited Engineer'],
      companies: ['Intel', 'Qualcomm', 'Texas Instruments', 'AMD', 'MediaTek']
    },
    {
      title: 'Embedded Systems & IoT Architect',
      demand: 'High Growth · Automotive & Smart Devices',
      salary: '₹6.5 – 16.0 LPA',
      summary: 'Program microcontrollers, real-time operating systems (RTOS), firmware, and IoT sensor telemetry for automotive and medical devices.',
      skills: ['Embedded C / C++', 'ARM Cortex Microcontrollers', 'FreeRTOS', 'I2C / SPI / UART protocols', 'PCB Design', 'MQTT & BLE'],
      certifications: ['ARM Embedded Certification', 'Cisco IoT Fundamentals'],
      companies: ['Bosch', 'Continental', 'Tata Elxsi', 'Honeywell', 'Schneider Electric']
    }
  ],
  'EEE': [
    {
      title: 'Power Systems & Smart Grid Automation Engineer',
      demand: 'Energy Transition Demand · Core Infrastructure',
      salary: '₹6.5 – 16.5 LPA',
      summary: 'Design electrical distribution systems, smart grid automation networks, substation SCADA telemetry, and power quality controllers.',
      skills: ['Power World / ETAP', 'MATLAB & Simulink', 'SCADA & PLC Programming', 'Power Electronics', 'Substation Automation'],
      certifications: ['Siemens Certified Automation Professional', 'IEEE Smart Grid Specialist'],
      companies: ['L&T Power', 'Schneider Electric', 'ABB', 'Siemens', 'NTPC / PowerGrid']
    },
    {
      title: 'Electric Vehicle (EV) Power Electronics Specialist',
      demand: 'High Growth · EV & Clean Mobility Boom',
      salary: '₹7.0 – 18.0 LPA',
      summary: 'Design DC-DC converters, motor drives, battery management systems (BMS), and regenerative braking controls for electric vehicles.',
      skills: ['Power Electronics', 'Simulink / MATLAB', 'Battery Management Systems (BMS)', 'Motor Control Algorithms', 'Inverter Design'],
      certifications: ['Certified EV Systems Engineer', 'MATLAB Simulink Associate'],
      companies: ['Tata Motors EV', 'Ather Energy', 'Ola Electric', 'Bosch Mobility', 'Mahindra Electric']
    }
  ],
  'CIVIL': [
    {
      title: 'Structural Design & BIM Engineer',
      demand: 'Core Infrastructure Demand · Smart Cities',
      salary: '₹5.5 – 14.0 LPA',
      summary: 'Perform structural stress calculations, concrete/steel building analysis, and 3D architectural Building Information Modeling (BIM).',
      skills: ['AutoCAD & Revit', 'STAAD.Pro / ETABS', 'BIM Coordination', 'Reinforced Concrete Design', 'IS Code Standards'],
      certifications: ['Autodesk Certified Professional: Revit Structure', 'Bentley STAAD.Pro Specialist'],
      companies: ['L&T Construction', 'Tata Projects', 'Afcons Infrastructure', 'Shapoorji Pallonji', 'AECOM']
    },
    {
      title: 'Geotechnical & Transportation Infrastructure Engineer',
      demand: 'National Highways & Metro Infrastructure',
      salary: '₹5.5 – 13.5 LPA',
      summary: 'Assess soil mechanics, foundation stability, pavement design, and highway traffic engineering for national infrastructure projects.',
      skills: ['Geotechnical Analysis', 'MX Road / Civil 3D', 'Soil Mechanics Testing', 'Pavement Design', 'Environmental Impact Assessment'],
      certifications: ['Certified Transportation Engineering Professional', 'GeoStudio Specialist'],
      companies: ['NHAI Projects', 'L&T Infrastructure', 'IRCON International', 'RITES Ltd']
    }
  ],
  'MECH': [
    {
      title: 'CAD/CAM Design & FEA Simulation Engineer',
      demand: 'Core Automotive & Aerospace Manufacturing',
      salary: '₹6.0 – 15.5 LPA',
      summary: 'Model 3D precision mechanical components, conduct finite element stress analysis (FEA), and prepare CNC manufacturing toolpaths.',
      skills: ['CATIA / SolidWorks', 'ANSYS Mechanical / Workbench', 'GD&T Standards', 'FEA Structural & Thermal Analysis', 'CNC G-Code'],
      certifications: ['Dassault Systèmes Certified SolidWorks Professional', 'ANSYS Mechanical Specialist'],
      companies: ['Tata Motors', 'Mahindra & Mahindra', 'L&T Heavy Engineering', 'Boeing India', 'Godrej Aerospace']
    },
    {
      title: 'Robotics & Mechatronics Automation Engineer',
      demand: 'Industry 4.0 Surge · Smart Factory Systems',
      salary: '₹7.0 – 17.5 LPA',
      summary: 'Integrate multi-axis industrial robotic arms, pneumatic actuators, programmable logic controllers (PLC), and factory automation cells.',
      skills: ['Robotics Kinematics', 'PLC & SCADA Programming', 'Pneumatics & Hydraulics', 'Industrial Sensors', 'Python & C++ for Robotics'],
      certifications: ['FANUC Certified Robot Operator', 'Siemens Certified Mechatronics Systems Associate'],
      companies: ['Bosch', 'ABB Robotics', 'KUKA India', 'Maruti Suzuki Automation', 'Tata Advanced Systems']
    }
  ]
};

const YEARLY_MILESTONES = [
  {
    year: 1,
    title: 'Year 1: Foundations & Algorithmic Thinking',
    badge: 'Semester 1 & 2',
    description: 'Master core engineering sciences, programming logic in C, and establish academic consistency.',
    semesters: [
      {
        sem: 'Semester 1',
        cgpaGoal: 'Target: ≥ 8.25 CGPA',
        checklist: [
          'Master C programming syntax, arrays, loops and pointers',
          'Understand Engineering Physics wave mechanics and calculus',
          'Build strong fundamentals in Linear Algebra & Differential Equations',
          'Attend college orientation & join Google Developer Student Club (GDSC)'
        ]
      },
      {
        sem: 'Semester 2',
        cgpaGoal: 'Target: ≥ 8.50 CGPA',
        checklist: [
          'Learn Data Structures (Linked Lists, Stacks, Queues, Binary Trees)',
          'Create active GitHub account and complete 50 LeetCode Easy problems',
          'Participate in first 24-hour campus hackathon or technical quiz',
          'Maintain attendance ≥ 75% across all core subjects'
        ]
      }
    ]
  },
  {
    year: 2,
    title: 'Year 2: Core Engineering & Systems Mastery',
    badge: 'Semester 3 & 4',
    description: 'Deep dive into computer architecture, databases, OOP, and begin domain specialization.',
    semesters: [
      {
        sem: 'Semester 3',
        cgpaGoal: 'Target: ≥ 8.50 CGPA',
        checklist: [
          'Master Database Management Systems (SQL queries, normalization, ACID)',
          'Learn Object Oriented Programming in Java / C++ (Inheritance, Polymorphism)',
          'Understand Digital Logic & Computer Organization',
          'Complete 100 Medium LeetCode problems on Trees & Dynamic Programming'
        ]
      },
      {
        sem: 'Semester 4',
        cgpaGoal: 'Target: ≥ 8.75 CGPA',
        checklist: [
          'Learn Operating Systems (Processes, Threads, Semaphores, Memory Management)',
          'Build first end-to-end full-stack project (React + REST API + PostgreSQL)',
          'Form project team for SIH (Smart India Hackathon)',
          'Earn first cloud certification (AWS Cloud Practitioner or Azure Fundamentals)'
        ]
      }
    ]
  },
  {
    year: 3,
    title: 'Year 3: Advanced Specialization & Internships',
    badge: 'Semester 5 & 6',
    description: 'Build enterprise-grade software, publish research, and secure summer industry internships.',
    semesters: [
      {
        sem: 'Semester 5',
        cgpaGoal: 'Target: ≥ 8.50 CGPA',
        checklist: [
          'Computer Networks (TCP/IP, Socket Programming, Routing Algorithms)',
          'Design and implement microservices architecture project',
          'Create professional resume with verified projects and live demo links',
          'Participate in off-campus coding contests (Codeforces / CodeChef)'
        ]
      },
      {
        sem: 'Semester 6',
        cgpaGoal: 'Target: Placement Readiness',
        checklist: [
          'Crack campus summer internship drive (4-8 weeks industrial training)',
          'Mock technical and HR interview rounds with alumni mentors',
          'Complete quantitative aptitude, reasoning, and verbal practice modules',
          'Submit Capstone major project proposal to department review panel'
        ]
      }
    ]
  },
  {
    year: 4,
    title: 'Year 4: Corporate Placements & Capstone Project',
    badge: 'Semester 7 & 8',
    description: 'Convert campus placement drives into high-tier offers and complete undergraduate defense.',
    semesters: [
      {
        sem: 'Semester 7',
        cgpaGoal: 'Placement Drive Season',
        checklist: [
          'Attend Day-1 Dream and Super Dream campus placement interviews',
          'System Design interviews preparation (Caching, Load Balancers, Sharding)',
          'Secure full-time PPO (Pre-Placement Offer) or corporate letter of intent',
          'Begin Major Project implementation and hardware/software testing'
        ]
      },
      {
        sem: 'Semester 8',
        cgpaGoal: 'Graduation & Transition',
        checklist: [
          'Publish research paper in IEEE / Scopus indexed conference journal',
          'Complete final project defense and viva voce examination',
          'Corporate background verification & onboarding formalities',
          'Join SRKR Engineering College Alumni Association network'
        ]
      }
    ]
  }
];

export const Grow: React.FC = () => {
  const { user } = useAuth();
  const studentDept = resolveStudentDepartment(user);
  const curriculum = getDepartmentCurriculum(studentDept);

  const [subTab, setSubTab] = useState<'prompts' | 'career' | 'roadmap'>('career');
  const [promptsByCategory, setPromptsByCategory] = useState<Record<string, any[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('study');
  
  // Customizer modal state
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Career state: defaults automatically to authenticated student's department
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(studentDept);

  useEffect(() => {
    growApi.getPrompts().then(setPromptsByCategory).catch(console.error);
    contentApi.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  // Update selectedDept when user updates
  useEffect(() => {
    if (user) {
      const dept = resolveStudentDepartment(user);
      setSelectedDept(dept);
    }
  }, [user]);

  const handleOpenPrompt = (p: any) => {
    setSelectedPrompt(p);
    // Automatically pre-populate student's department, year, semester context
    // Never ask student to type their branch or year manually
    const initial: Record<string, string> = {};
    if (p.personalize_fields) {
      p.personalize_fields.forEach((f: any) => {
        const idLower = (f.id || '').toLowerCase();
        if (idLower.includes('branch') || idLower.includes('dept') || idLower.includes('department')) {
          initial[f.id] = curriculum.name;
        } else if (idLower.includes('year')) {
          initial[f.id] = curriculum.academicYear;
        } else if (idLower.includes('sem') || idLower.includes('semester')) {
          initial[f.id] = curriculum.semester;
        } else if (idLower.includes('reg') || idLower.includes('regulation')) {
          initial[f.id] = curriculum.regulation;
        } else if (idLower.includes('college')) {
          initial[f.id] = 'SRKR Engineering College';
        }
      });
    }
    setFieldValues(initial);
    setCopied(false);
  };

  const generateFinalPrompt = () => {
    if (!selectedPrompt) return '';
    let result = selectedPrompt.prompt_template || '';

    // Smart default mapping from student context
    const autoContext: Record<string, string> = {
      branch: curriculum.code,
      department: curriculum.name,
      year: curriculum.academicYear,
      semester: curriculum.semester,
      regulation: curriculum.regulation,
      college: 'SRKR Engineering College'
    };

    if (selectedPrompt.personalize_fields) {
      selectedPrompt.personalize_fields.forEach((field: any) => {
        const idLower = (field.id || '').toLowerCase();
        const val = fieldValues[field.id] || autoContext[idLower] || `[${field.label}]`;
        const regex = new RegExp(`\\{\\{${field.id}\\}\\}`, 'g');
        result = result.replace(regex, val);
      });
    }

    // Prepend intelligent, non-intrusive academic context preamble
    // Never invent grades, skills, or achievements - only provide authentic academic institutional context
    if (!result.includes('SRKR Engineering College') && !result.includes(curriculum.code)) {
      const preamble = `[Academic Context: You are assisting a first-year ${curriculum.name} (${curriculum.code}) undergraduate student at SRKR Engineering College (Regulation ${curriculum.regulation}, ${curriculum.academicYear} · ${curriculum.semester}). Provide rigorous, academically structured guidance tailored to this curriculum without assuming prior background beyond standard 10+2 science and mathematics.]\n\n`;
      result = preamble + result;
    }

    return result;
  };

  const handleCopyPrompt = () => {
    const text = generateFinalPrompt();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = Object.keys(promptsByCategory);
  const careerCards = FALLBACK_CAREER_TRACKS[selectedDept] || FALLBACK_CAREER_TRACKS[studentDept] || FALLBACK_CAREER_TRACKS['CSE'];

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Top Grow Sub-navigation */}
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
              className={`btn btn-sm ${subTab === 'career' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('career')}
            >
              <Compass size={15} />
              <span>Career Pathways ({careerCards.length})</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${subTab === 'roadmap' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('roadmap')}
            >
              <Map size={15} />
              <span>4-Year Milestones Roadmap</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${subTab === 'prompts' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubTab('prompts')}
            >
              <Sparkles size={15} />
              <span>AI Study Prompt Studio</span>
            </button>
          </div>

          {/* Department Picker for Career */}
          {subTab === 'career' && (
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

      {/* VIEW 1: CAREER PATHWAYS (HIGH POLISH WITH CRISP BORDERS) */}
      {subTab === 'career' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
            <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-header-title font-serif" style={{ fontSize: '1.25rem' }}>
                  Engineering Career Pathways — {selectedDept}
                </span>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                  Industry-aligned career specializations curated for SRKR Engineering College undergraduates
                </div>
              </div>
              <span className="badge badge-good" style={{ fontSize: '0.75rem' }}>
                Verified 2026 Industry Specs
              </span>
            </div>
          </div>

          {/* Structured Grid of Career Pathway Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}>
            {careerCards.map((cp, idx) => (
              <div key={idx} className="ledger-card" style={{
                border: '1px solid var(--rule)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  {/* Card Header with Ruled Border */}
                  <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Briefcase size={15} color="var(--accent-gold)" />
                        <span className="badge badge-neutral mono-num" style={{ fontSize: '0.7rem' }}>
                          TRACK 0{idx + 1}
                        </span>
                      </div>
                      <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {cp.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-good mono-num" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {cp.salary}
                      </span>
                    </div>
                  </div>

                  {/* Demand Badge */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <span className="badge" style={{ background: 'rgba(36, 27, 78, 0.06)', color: 'var(--ink)', fontSize: '0.72rem' }}>
                      <TrendingUp size={12} color="var(--good)" /> {cp.demand}
                    </span>
                  </div>

                  {/* Summary */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {cp.summary}
                  </p>

                  {/* Core Skill Stack Box */}
                  <div style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    marginBottom: '0.85rem',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      Required Industry Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {cp.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="mono-num" style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--rule)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '3px',
                          fontSize: '0.72rem',
                          color: 'var(--ink)',
                          fontWeight: 600,
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications Box */}
                  <div style={{
                    border: '1px dashed var(--rule)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem',
                    marginBottom: '0.85rem',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={13} color="var(--accent-gold)" />
                      <span>Recommended Certifications:</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                      {cp.certifications.join(' · ')}
                    </div>
                  </div>
                </div>

                {/* Target Companies */}
                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--rule)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                    Top Recruiters: <strong>{cp.companies.slice(0, 3).join(', ')}</strong>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    High Campus Intake
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: 4-YEAR MILESTONES ROADMAP (STRUCTURED TIMELINE WITH CLEAR BORDERS) */}
      {subTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
            <div className="card-header-ruled">
              <span className="card-header-title font-serif" style={{ fontSize: '1.25rem' }}>
                4-Year Undergraduate Academic & Career Milestones
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Progressive roadmap from Semester 1 to Semester 8 for academic distinction and campus placements
              </div>
            </div>
          </div>

          {/* 4 Years Timeline Cards */}
          {YEARLY_MILESTONES.map((yr) => (
            <div key={yr.year} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
              {/* Year Card Ruled Header */}
              <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--ink)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                  }}>
                    Y{yr.year}
                  </div>
                  <div>
                    <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
                      {yr.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
                      {yr.description}
                    </p>
                  </div>
                </div>

                <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                  {yr.badge}
                </span>
              </div>

              {/* Semester Breakdown Columns with Distinct Borders */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginTop: '0.5rem',
              }}>
                {yr.semesters.map((sem, sIdx) => (
                  <div key={sIdx} style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--rule)' }}>
                      <span className="font-serif" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
                        {sem.sem}
                      </span>
                      <span className="badge badge-good mono-num" style={{ fontSize: '0.7rem' }}>
                        {sem.cgpaGoal}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {sem.checklist.map((item, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                          <CheckCircle2 size={14} color="var(--good)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: AI STUDY TOOLS (PROMPTS GRID WITH CRISP BORDERS) */}
      {subTab === 'prompts' && (
        <div>
          {/* Category Ribbon */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
          }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* Prompts Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1rem',
          }}>
            {(promptsByCategory[activeCategory] || []).map((prompt: any) => (
              <div key={prompt.id} className="ledger-card" style={{
                border: '1px solid var(--rule)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-neutral mono-num" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                        {prompt.task_id}
                      </span>
                      <h4 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {prompt.name}
                      </h4>
                    </div>
                    <span style={{ fontSize: '1.3rem' }}>{prompt.icon || '✨'}</span>
                  </div>

                  {prompt.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', lineHeight: 1.45, marginTop: '0.4rem' }}>
                      {prompt.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => handleOpenPrompt(prompt)}
                >
                  <Sparkles size={14} color="var(--accent-gold)" />
                  <span>Customize & Generate</span>
                </button>
              </div>
            ))}
          </div>

          {/* Customizer Modal */}
          {selectedPrompt && (
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
                maxWidth: '600px',
                width: '100%',
                maxHeight: '88vh',
                overflowY: 'auto',
                border: '2px solid var(--rule)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
              }}>
                <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="badge badge-neutral mono-num" style={{ marginBottom: '0.2rem' }}>
                      AI STUDY PROMPT STUDIO
                    </span>
                    <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      {selectedPrompt.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setSelectedPrompt(null)}
                    style={{ width: '30px', height: '30px' }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div style={{ padding: '1rem 0' }}>
                  {/* Inputs */}
                  {selectedPrompt.personalize_fields && selectedPrompt.personalize_fields.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                        Parameters & Context:
                      </div>
                      {selectedPrompt.personalize_fields.map((f: any) => (
                        <div key={f.id} className="input-group" style={{ marginBottom: '0.75rem' }}>
                          <label className="input-label">{f.label}</label>
                          <input
                            type="text"
                            className="input-control"
                            placeholder={f.placeholder}
                            value={fieldValues[f.id] || ''}
                            onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                            style={{ width: '100%' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Output Preview */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                      Engineered Prompt Output:
                    </div>
                    <div style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}>
                      {generateFinalPrompt()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--rule)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedPrompt(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCopyPrompt}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Grow;
