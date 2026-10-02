import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  resolveFacultyScope, 
  getDepartmentCurriculum, 
  FacultyAssignment,
  UnitDetail,
  SubjectCourse
} from '../../data/r26Curriculum';
import { 
  facultyApi, 
  FacultyResource, 
  FacultyAuditItem,
  ResourceUploadPayload,
  MEDHAS_RESOURCE_API
} from '../../api/resources';
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  LogOut, 
  Clock, 
  Sparkles,
  FileCheck,
  RefreshCw,
  FolderOpen,
  Info
} from 'lucide-react';

export const FacultyAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // 1. Resolve locked scope from centralized R26 Single Source of Truth
  const staticScope = resolveFacultyScope(user);
  const [scope, setScope] = useState<FacultyAssignment | null>(staticScope);
  const [scopeLoading, setScopeLoading] = useState(false);

  // Tabs: Subject Overview, Unit Management, Upload Resource, Published Resources, Activity
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'upload' | 'resources' | 'activity'>('overview');

  // Resources state
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');

  // Upload Form state
  const [selectedUnit, setSelectedUnit] = useState('Unit 1');
  const [resourceTitle, setResourceTitle] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [externalLink, setExternalLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Deletion modal state
  const [deletingResource, setDeletingResource] = useState<FacultyResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<FacultyAuditItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // 2. Fetch authoritative scope from server
  useEffect(() => {
    const fetchProfile = async () => {
      setScopeLoading(true);
      try {
        const profile = await facultyApi.getProfile();
        if (profile) {
          setScope(prev => ({
            ...prev,
            username: profile.username,
            role: 'FACULTY_ADMIN',
            branch: profile.branch as any,
            branchName: profile.branchName,
            subject: profile.subject,
            subjectId: profile.subjectId,
            curriculumId: profile.curriculumId,
            subjectType: profile.subjectType,
            year: profile.year,
            semester: profile.semester,
          }));
        }
      } catch (err) {
        console.warn('Using client-resolved faculty scope:', err);
      } finally {
        setScopeLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // 3. Direct URL / Hash Protection
  // If the user tries to manipulate the URL hash or query params to escape their assigned branch/subject
  useEffect(() => {
    const sanitizeUrl = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('branch=') || hash.includes('subject='))) {
        // Enforce locked faculty workspace
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    sanitizeUrl();
    window.addEventListener('hashchange', sanitizeUrl);
    return () => window.removeEventListener('hashchange', sanitizeUrl);
  }, []);

  // 4. Fetch resources for assigned scope
  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const data = await facultyApi.getResources();
      setResources(data);
    } catch (err: any) {
      console.error('Failed to load faculty resources', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // 5. Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const data = await facultyApi.getAuditLogs();
      setAuditLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchAuditLogs();
  }, [scope?.branch, scope?.subjectId]);

  // Get syllabus data for assigned subject from centralized R26 curriculum
  const deptCurriculum = scope ? getDepartmentCurriculum(scope.branch) : null;
  const courseSyllabus: SubjectCourse | undefined = deptCurriculum?.theory.find(
    s => s.id.toLowerCase() === scope?.curriculumId.toLowerCase() ||
         s.id.toLowerCase() === scope?.subjectId.toLowerCase() ||
         s.name.toLowerCase().includes(scope?.subject.toLowerCase() || '___')
  ) || deptCurriculum?.labs.find(
    l => l.id.toLowerCase() === scope?.curriculumId.toLowerCase() ||
         l.id.toLowerCase() === scope?.subjectId.toLowerCase()
  );

  const unitsList: UnitDetail[] = courseSyllabus?.units || [
    { unit_number: 1, title: 'Unit 1: Fundamentals & Conceptual Architecture', topics: ['Core concepts', 'Methodologies'], important_questions: [] },
    { unit_number: 2, title: 'Unit 2: Analytical Foundations & Core Principles', topics: ['Applied techniques', 'Problem formulations'], important_questions: [] },
    { unit_number: 3, title: 'Unit 3: Structural Analysis & Intermediate Concepts', topics: ['Systems evaluation', 'Procedures'], important_questions: [] },
    { unit_number: 4, title: 'Unit 4: Advanced Mechanisms & Computational Design', topics: ['Optimization', 'Implementation'], important_questions: [] },
    { unit_number: 5, title: 'Unit 5: Applications, Frameworks & Contemporary Trends', topics: ['Engineering practices', 'Modern standards'], important_questions: [] },
  ];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!resourceTitle) {
        // Auto-fill title from filename without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setResourceTitle(nameWithoutExt);
      }

      // Convert to Base64 for Google Apps Script + Drive pipeline
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:*;base64, prefix
        const base64Clean = result.split(',')[1] || result;
        setFileBase64(base64Clean);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Resource Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim()) {
      setUploadError('Please provide a descriptive resource title.');
      return;
    }
    if (uploadMode === 'file' && (!selectedFile || !fileBase64)) {
      setUploadError('Please select a file to upload to Google Drive.');
      return;
    }
    if (uploadMode === 'link' && !externalLink.trim()) {
      setUploadError('Please provide a valid Google Drive or resource link.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const payload: ResourceUploadPayload = {
      unit: selectedUnit,
      title: resourceTitle.trim(),
      link: uploadMode === 'link' ? externalLink.trim() : '',
      icon: uploadMode === 'file' ? '📄' : '🔗',
      fileUpload: uploadMode === 'file',
      fileName: selectedFile ? selectedFile.name : '',
      fileBase64: uploadMode === 'file' ? fileBase64 : '',
      // Bound strictly to session
      branch: scope?.branch,
      subjectId: scope?.subjectId,
      year: scope?.year || 1,
      semester: scope?.semester || 1,
    };

    try {
      await facultyApi.uploadResource(payload);
      setUploadSuccess(`"${resourceTitle}" published successfully! Visible to ${scope?.branch} students.`);
      setResourceTitle('');
      setSelectedFile(null);
      setFileBase64('');
      setExternalLink('');
      // Refresh published resources & activity
      fetchResources();
      fetchAuditLogs();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload resource. Please verify your connection.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Resource Deletion
  const confirmDelete = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await facultyApi.deleteResource(deletingResource.id);
      setResources(prev => prev.filter(r => r.id !== deletingResource.id));
      setDeletingResource(null);
      fetchAuditLogs();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete resource. Ensure authorization.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter published resources by search query
  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    r.unit.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 0.5rem 3rem 0.5rem' }}>
      
      {/* 1. LOCKED SCOPE BANNER (MEDHAS WARM ACADEMIC LEDGER STYLE) */}
      <div 
        className="ledger-card" 
        style={{ 
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(36, 35, 76, 0.04) 0%, rgba(230, 162, 60, 0.08) 100%)',
          borderColor: 'var(--accent-gold, #d97706)',
          borderWidth: '1.5px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span 
                style={{ 
                  background: 'var(--accent-gold, #d97706)', 
                  color: '#ffffff', 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  letterSpacing: '0.08em', 
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '3px'
                }}
              >
                Course Faculty Admin
              </span>
              <span 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.725rem', 
                  color: 'var(--ink-soft)', 
                  fontWeight: 600 
                }}
              >
                <Lock size={12} color="var(--accent-gold, #d97706)" />
                Workspace Locked
              </span>
            </div>

            <h1 
              className="font-serif" 
              style={{ 
                margin: '0.25rem 0', 
                fontSize: '1.45rem', 
                fontWeight: 800, 
                color: 'var(--ink, #24234C)',
                lineHeight: 1.25
              }}
            >
              {scope?.subject || 'Computational Thinking & Problem Solving Using C'}
            </h1>

            <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft, #7C8092)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--ink, #24234C)' }}>
                {scope?.branchName || 'Computer Science and Engineering'} ({scope?.branch || 'CSE'})
              </span>
              <span>•</span>
              <span>I B.Tech · I Semester</span>
              <span>•</span>
              <span style={{ 
                background: 'rgba(36, 35, 76, 0.08)', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '3px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                [ {scope?.subjectType || 'Theory'} ]
              </span>
              <span>•</span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Regulation: R26
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn-text" 
              onClick={fetchResources}
              title="Refresh Resources"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} className={loadingResources ? 'spin' : ''} />
              <span>Sync</span>
            </button>
            <button
              type="button"
              className="btn-text"
              onClick={() => logout()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#dc2626' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Locked Scope Security Notice */}
        <div 
          style={{ 
            marginTop: '0.85rem', 
            padding: '0.5rem 0.75rem', 
            background: '#ffffff', 
            borderRadius: '4px',
            border: '1px solid var(--border-color, #EBE6DA)',
            fontSize: '0.75rem',
            color: 'var(--ink-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldCheck size={16} color="var(--accent-gold, #d97706)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Scope Security:</strong> You are authenticated as <code>{scope?.username}</code>. Published materials are directly routed to the verified Google Apps Script backend and made visible strictly to <strong>{scope?.branch}</strong> students.
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          borderBottom: '2px solid var(--border-color, #EBE6DA)', 
          marginBottom: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ 
            padding: '0.55rem 0.9rem', 
            fontSize: '0.825rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2.5px solid var(--accent-gold, #d97706)' : 'none',
            color: activeTab === 'overview' ? 'var(--ink)' : 'var(--ink-soft)',
            cursor: 'pointer'
          }}
        >
          <BookOpen size={15} />
          <span>Subject Overview</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'units' ? 'active' : ''}`}
          onClick={() => setActiveTab('units')}
          style={{ 
            padding: '0.55rem 0.9rem', 
            fontSize: '0.825rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'units' ? '2.5px solid var(--accent-gold, #d97706)' : 'none',
            color: activeTab === 'units' ? 'var(--ink)' : 'var(--ink-soft)',
            cursor: 'pointer'
          }}
        >
          <Layers size={15} />
          <span>Unit Management</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
          style={{ 
            padding: '0.55rem 0.9rem', 
            fontSize: '0.825rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'upload' ? '2.5px solid var(--accent-gold, #d97706)' : 'none',
            color: activeTab === 'upload' ? 'var(--ink)' : 'var(--ink-soft)',
            cursor: 'pointer'
          }}
        >
          <Upload size={15} />
          <span>Upload Resource</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
          style={{ 
            padding: '0.55rem 0.9rem', 
            fontSize: '0.825rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'resources' ? '2.5px solid var(--accent-gold, #d97706)' : 'none',
            color: activeTab === 'resources' ? 'var(--ink)' : 'var(--ink-soft)',
            cursor: 'pointer'
          }}
        >
          <FolderOpen size={15} />
          <span>Published Resources ({resources.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
          style={{ 
            padding: '0.55rem 0.9rem', 
            fontSize: '0.825rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '2.5px solid var(--accent-gold, #d97706)' : 'none',
            color: activeTab === 'activity' ? 'var(--ink)' : 'var(--ink-soft)',
            cursor: 'pointer'
          }}
        >
          <Clock size={15} />
          <span>Recent Activity</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: SUBJECT OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div className="ledger-card">
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Curriculum Specification</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>R26 Regulation</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Course Code:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{scope?.curriculumId || 'R26-CTPSC'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Academic Credits:</span>
                <span style={{ fontWeight: 700 }}>{courseSyllabus?.credits || 3} Credits</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Assigned Units:</span>
                <span style={{ fontWeight: 700 }}>5 Standard Units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Published Materials:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{resources.length} Items Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Backend Storage:</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Google Sheets (Sheet1) & Drive</span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('upload')}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <Upload size={16} />
                <span>Upload New Resource</span>
              </button>
            </div>
          </div>

          <div className="ledger-card">
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Syllabus Breakdown</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>5 Units Total</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
              {unitsList.map(u => (
                <div 
                  key={u.unit_number} 
                  style={{ 
                    padding: '0.65rem 0.8rem', 
                    borderRadius: '4px', 
                    background: 'rgba(36, 35, 76, 0.02)',
                    border: '1px solid var(--border-color, #EBE6DA)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>
                      Unit {u.unit_number}: {u.title.replace(/^Unit \d+:\s*/, '')}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                      {u.topics.slice(0, 2).join(' • ')}...
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setSelectedUnit(`Unit ${u.unit_number}`);
                      setActiveTab('upload');
                    }}
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)' }}
                  >
                    + Add Material
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB B: UNIT MANAGEMENT */}
      {activeTab === 'units' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="ledger-card">
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Unit-wise Content & Curriculum Control</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Click a unit to manage its active resources</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {unitsList.map(unit => {
                const unitResources = resources.filter(r => r.unit === `Unit ${unit.unit_number}` || r.unit.includes(String(unit.unit_number)));
                return (
                  <div 
                    key={unit.unit_number}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-color, #EBE6DA)',
                      background: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-gold, #d97706)' }}>
                          Unit {unit.unit_number}
                        </div>
                        <h3 className="font-serif" style={{ margin: '0.2rem 0', fontSize: '1.05rem', color: 'var(--ink)' }}>
                          {unit.title}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn-text"
                          onClick={() => {
                            setSelectedUnit(`Unit ${unit.unit_number}`);
                            setActiveTab('upload');
                          }}
                          style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--accent-gold)' }}
                        >
                          + Upload to Unit {unit.unit_number}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.75rem' }}>
                      <strong>Topics:</strong> {unit.topics.join('; ')}
                    </div>

                    {/* Resources for this unit */}
                    <div style={{ borderTop: '1px solid var(--border-color, #EBE6DA)', paddingTop: '0.65rem' }}>
                      <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Published Unit Materials ({unitResources.length})
                      </div>
                      {unitResources.length === 0 ? (
                        <div style={{ fontSize: '0.785rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                          No materials published for this unit yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {unitResources.map(res => (
                            <div 
                              key={res.id}
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.4rem', 
                                padding: '0.35rem 0.65rem', 
                                borderRadius: '4px',
                                background: 'rgba(36, 35, 76, 0.04)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.775rem'
                              }}
                            >
                              <span>{res.icon || '📄'}</span>
                              <span style={{ fontWeight: 600 }}>{res.title}</span>
                              {res.link && (
                                <a 
                                  href={res.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--accent-gold)', marginLeft: '0.25rem' }}
                                  title="Open Resource"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeletingResource(res)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0 2px' }}
                                title="Delete Resource"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB C: UPLOAD RESOURCE FORM */}
      {activeTab === 'upload' && (
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <div className="ledger-card">
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Publish Resource to Students</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                {scope?.branch} · {scope?.subject}
              </span>
            </div>

            {uploadSuccess && (
              <div 
                style={{ 
                  margin: '1rem 0', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '4px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid #10b981', 
                  color: '#065f46',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div 
                style={{ 
                  margin: '1rem 0', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '4px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid #ef4444', 
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              
              {/* Locked Context Display (No dropdown tampering!) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(36, 35, 76, 0.03)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Target Department (Locked)</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Lock size={12} color="var(--accent-gold)" />
                    {scope?.branch} — {scope?.branchName}
                  </div>
                </div>

                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(36, 35, 76, 0.03)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase' }}>Target Subject (Locked)</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Lock size={12} color="var(--accent-gold)" />
                    {scope?.subject}
                  </div>
                </div>
              </div>

              {/* Unit Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Target Academic Unit *
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="input-ledger"
                  style={{ width: '100%', padding: '0.65rem' }}
                >
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                  <option value="Unit 3">Unit 3</option>
                  <option value="Unit 4">Unit 4</option>
                  <option value="Unit 5">Unit 5</option>
                  <option value="General">General / Reference Notes</option>
                  {scope?.subjectType === 'practical' && (
                    <option value="Lab Manual">Lab Manual & Experiments</option>
                  )}
                </select>
              </div>

              {/* Resource Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 2: Control Structures & Iteration Comprehensive Notes"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="input-ledger"
                  style={{ width: '100%', padding: '0.65rem' }}
                  required
                />
              </div>

              {/* Mode Toggle: PDF File Upload OR Google Drive / External Link */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--ink)' }}>
                  Delivery Pipeline *
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'file'}
                      onChange={() => setUploadMode('file')}
                    />
                    <span>Direct File / PDF Upload (Automated Drive Sync)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'link'}
                      onChange={() => setUploadMode('link')}
                    />
                    <span>Google Drive / External Link</span>
                  </label>
                </div>

                {uploadMode === 'file' ? (
                  <div 
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: '6px', 
                      border: '2px dashed var(--border-color, #EBE6DA)', 
                      background: 'rgba(36, 35, 76, 0.02)',
                      textAlign: 'center'
                    }}
                  >
                    <input
                      type="file"
                      id="facultyFileInput"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="facultyFileInput" 
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Upload size={32} color="var(--accent-gold, #d97706)" />
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        {selectedFile ? selectedFile.name : 'Choose a PDF or Document'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        Supported formats: PDF, DOCX, PPTX (Max 20MB) • Uploads directly to Medhas Drive
                      </div>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      className="input-ledger"
                      style={{ width: '100%', padding: '0.65rem' }}
                    />
                    <div style={{ fontSize: '0.725rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
                      Ensure file sharing permission is set to "Anyone with the link can view".
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontSize: '0.95rem', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '0.5rem' 
                  }}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Syncing with Google Apps Script & Drive...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Publish Resource to {scope?.branch} Students</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAB D: PUBLISHED RESOURCES */}
      {activeTab === 'resources' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div>
              <span className="card-header-title font-serif">Published Subject Resources</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Active resources scoped to {scope?.branch} · {scope?.subject}
              </div>
            </div>
            
            {/* Search within faculty's scope */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                <input
                  type="text"
                  placeholder="Filter resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  style={{
                    padding: '0.35rem 0.6rem 0.35rem 1.8rem',
                    fontSize: '0.8rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    width: '180px'
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-text"
                onClick={() => setActiveTab('upload')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)' }}
              >
                + Upload
              </button>
            </div>
          </div>

          {loadingResources ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--ink-soft)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Fetching resources from Google Apps Script...</div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-soft)' }}>
              <FileText size={36} color="var(--border-color)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>No published resources found</div>
              <div style={{ fontSize: '0.825rem', marginTop: '0.25rem' }}>
                Publish notes, question banks, or reference guides to make them visible to students.
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('upload')}
                style={{ marginTop: '1rem', fontSize: '0.825rem' }}
              >
                Upload First Resource
              </button>
            </div>
          ) : (
            <div className="table-responsive" style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color, #EBE6DA)', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Type</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Title</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Unit</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Uploaded Date</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Link</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map(res => (
                    <tr 
                      key={res.id} 
                      style={{ borderBottom: '1px solid var(--border-color, #EBE6DA)' }}
                    >
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{res.icon || '📄'}</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{res.title}</div>
                        {res.fileName && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--ink-soft)' }}>File: {res.fileName}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '3px', 
                          background: 'rgba(36, 35, 76, 0.05)',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {res.unit}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                        {res.date ? res.date.split('T')[0] : 'Recent'}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        {res.link ? (
                          <a 
                            href={res.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.25rem', 
                              color: 'var(--accent-gold, #d97706)',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setDeletingResource(res)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            color: '#dc2626',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB E: RECENT ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <span className="card-header-title font-serif">Audit Trail & Activity Log</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Filtered strictly to your actions</span>
          </div>

          {loadingAudit ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--ink-soft)' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading audit trail...</div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--ink-soft)' }}>
              <Clock size={32} color="var(--border-color)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600 }}>No recent audit records found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
              {auditLogs.map(log => (
                <div 
                  key={log.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '4px',
                    background: 'rgba(36, 35, 76, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span 
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          background: log.action.includes('UPLOAD') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: log.action.includes('UPLOAD') ? '#065f46' : '#991b1b',
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--ink)' }}>
                        {log.target}
                      </span>
                    </div>
                    {log.details && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        {log.details}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.725rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deletingResource && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', marginBottom: '0.75rem' }}>
              <AlertCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Delete this resource?
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
              Are you sure you want to remove <strong>"{deletingResource.title}"</strong> ({deletingResource.unit})? This will delete the entry from the Google Sheet and remove it from the Medhas student portal.
            </p>

            {deleteError && (
              <div style={{ fontSize: '0.8rem', color: '#991b1b', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-text"
                disabled={isDeleting}
                onClick={() => setDeletingResource(null)}
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
