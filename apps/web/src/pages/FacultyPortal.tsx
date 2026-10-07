import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  resolveFacultyScope, 
  getDepartmentCurriculum, 
  FacultyAssignment,
  UnitDetail,
  SubjectCourse
} from '../data/r26Curriculum';
import { 
  facultyApi, 
  FacultyResource, 
  FacultyAuditItem,
  ResourceUploadPayload,
  MEDHAS_RESOURCE_API
} from '../api/resources';
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
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
  Info,
  X,
  FileUp,
  Link as LinkIcon,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const RESOURCE_TYPES = [
  'Lecture Notes',
  'Important Questions & Q&A',
  'Syllabus & Lecture Plan',
  'Presentation / PPT',
  'Lab Manual & Code',
  'Formula Sheet',
  'Previous Question Papers',
  'Reference Material'
];

const RESOURCE_ICONS = ['📘', '📄', '📑', '📊', '📝', '💡', '🔗', '🧪'];

export const FacultyPortal: React.FC = () => {
  const { user, logout } = useAuth();
  
  // 1. Resolve locked scope
  const initialScope = useMemo(() => resolveFacultyScope(user), [user]);
  const [scope, setScope] = useState<FacultyAssignment | null>(initialScope);
  const [scopeLoading, setScopeLoading] = useState(false);

  // Active view section
  const [activeSection, setActiveSection] = useState<'overview' | 'resources' | 'activity'>('overview');

  // Resource listing state
  const [resources, setResources] = useState<FacultyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadUnit, setUploadUnit] = useState('Unit 1');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('Lecture Notes');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [uploadLink, setUploadLink] = useState('');
  const [uploadIcon, setUploadIcon] = useState('📘');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Deletion Modal State
  const [deletingResource, setDeletingResource] = useState<FacultyResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<FacultyAuditItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Fetch authoritative scope from server
  useEffect(() => {
    const fetchScope = async () => {
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
    fetchScope();
  }, [user]);

  // Load published resources strictly within scope
  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const data = await facultyApi.getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load published resources', err);
    } finally {
      setLoadingResources(false);
    }
  };

  // Load audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await facultyApi.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (scope?.branch && scope?.subjectId) {
      fetchResources();
      fetchAuditLogs();
    }
  }, [scope?.branch, scope?.subjectId]);

  // Resolve curriculum syllabus units for the assigned subject
  const currentSubject: SubjectCourse | undefined = useMemo(() => {
    if (!scope) return undefined;
    const curriculum = getDepartmentCurriculum(scope.branch);
    return curriculum.theory.find(s => 
      s.id.toLowerCase() === scope.curriculumId.toLowerCase() ||
      s.id.toLowerCase() === scope.subjectId.toLowerCase() ||
      s.name.toLowerCase().includes(scope.subject.toLowerCase())
    ) || curriculum.theory[0];
  }, [scope]);

  const unitsList: { number: number; label: string; title: string; topicsCount: number }[] = useMemo(() => {
    if (currentSubject?.units && currentSubject.units.length > 0) {
      return currentSubject.units.map(u => ({
        number: u.unit_number,
        label: `Unit ${u.unit_number}`,
        title: u.title,
        topicsCount: u.topics?.length || 0,
      }));
    }
    return [1, 2, 3, 4, 5].map(n => ({
      number: n,
      label: `Unit ${n}`,
      title: `Unit ${n} Syllabus Core`,
      topicsCount: 4,
    }));
  }, [currentSubject]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setPublishStatus({ type: 'error', message: 'File exceeds 20MB limit. Please provide a Google Drive link.' });
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open upload preselected to unit
  const openUploadForUnit = (unitLabel: string) => {
    setUploadUnit(unitLabel);
    setPublishStatus(null);
    setIsUploadOpen(true);
  };

  // Publish resource
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope) return;
    setPublishStatus(null);

    const title = uploadTitle.trim();
    if (!title) {
      setPublishStatus({ type: 'error', message: 'Please enter a resource title.' });
      return;
    }

    if (uploadMode === 'link') {
      if (!uploadLink.trim()) {
        setPublishStatus({ type: 'error', message: 'Please enter a valid Google Drive or resource link.' });
        return;
      }
    } else {
      if (!selectedFile && !fileBase64) {
        setPublishStatus({ type: 'error', message: 'Please select a file to upload or paste a link.' });
        return;
      }
    }

    setIsPublishing(true);
    try {
      const payload: ResourceUploadPayload = {
        unit: uploadUnit,
        title: title,
        link: uploadMode === 'link' ? uploadLink.trim() : '',
        icon: uploadIcon,
        fileUpload: uploadMode === 'file' && !!fileBase64,
        fileName: selectedFile?.name || '',
        fileBase64: fileBase64 || '',
        branch: scope.branch,
        subjectId: scope.subjectId,
        year: scope.year,
        semester: scope.semester,
      };

      await facultyApi.uploadResource(payload);

      setPublishStatus({
        type: 'success',
        message: 'Resource published successfully! It is now immediately visible to students on Medhas.',
      });

      // Reset form
      setUploadTitle('');
      setSelectedFile(null);
      setFileBase64('');
      setUploadLink('');

      // Refresh list & logs immediately
      await fetchResources();
      await fetchAuditLogs();

      setTimeout(() => {
        setIsUploadOpen(false);
        setPublishStatus(null);
      }, 1800);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to publish resource to Google Apps Script.';
      setPublishStatus({ type: 'error', message: msg });
    } finally {
      setIsPublishing(false);
    }
  };

  // Execute deletion
  const confirmDelete = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await facultyApi.deleteResource(deletingResource.id);
      setResources(prev => prev.filter(r => String(r.id) !== String(deletingResource.id)));
      setDeletingResource(null);
      await fetchAuditLogs();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete resource.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered published resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.fileName && res.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesUnit = filterUnit === 'ALL' || res.unit === filterUnit;

      return matchesSearch && matchesUnit;
    });
  }, [resources, searchQuery, filterUnit]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F6EF',
      color: '#24234C',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    }}>
      {/* =================================================================== */}
      {/* 1. DEDICATED FACULTY PORTAL HEADER (ZERO STUDENT NAVIGATION)        */}
      {/* =================================================================== */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EBE6DA',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(36, 35, 76, 0.04)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#24234C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 2px 6px rgba(36, 35, 76, 0.2)',
            }}>
              M
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '0.04em',
                color: '#24234C',
                lineHeight: 1.1,
              }}>
                MEDHAS
              </div>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#E6A23C',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '0.15rem',
              }}>
                Faculty Resource Portal
              </div>
            </div>
          </div>

          {/* Academic Scope Preview Badge */}
          {scope && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8F6EF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.4rem 0.85rem',
              gap: '0.65rem',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#24234C',
                  lineHeight: 1.2,
                }}>
                  {scope.subject}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#7C8092',
                  fontFamily: 'var(--font-mono, monospace)',
                }}>
                  {scope.branch} • Year {scope.year} • Semester {scope.semester}
                </div>
              </div>
            </div>
          )}

          {/* Actions: Primary Upload CTA + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => openUploadForUnit('Unit 1')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#24234C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1c1b3c')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#24234C')}
            >
              <Upload size={14} color="#E6A23C" />
              <span>+ Upload Resource</span>
            </button>

            <button
              type="button"
              onClick={logout}
              title="Logout from Faculty Portal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'transparent',
                color: '#7C8092',
                border: '1px solid #EBE6DA',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7C8092';
                e.currentTarget.style.borderColor = '#EBE6DA';
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. MAIN WORKSPACE CONTAINER                                         */}
      {/* =================================================================== */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.5rem 1.25rem 3rem',
      }}>
        {/* TOP AUTHORITATIVE SCOPE CARDS (READ-ONLY) */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EBE6DA',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(36, 35, 76, 0.03)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderBottom: '1px solid #EBE6DA',
            paddingBottom: '0.85rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(230, 162, 60, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Lock size={15} color="#E6A23C" />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#24234C',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  Authoritative Faculty Scope
                </h1>
                <div style={{ fontSize: '0.72rem', color: '#7C8092' }}>
                  Locked to your authenticated account · Read-only server scope
                </div>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              color: '#7C8092',
              backgroundColor: '#F8F6EF',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #EBE6DA',
            }}>
              <Info size={12} />
              <span>Resources publish instantly to enrolled students</span>
            </div>
          </div>

          {/* 4 Read-only Grid Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}>
            {/* SUBJECT */}
            <div style={{
              backgroundColor: '#F8F6EF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#7C8092',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}>
                SUBJECT
              </div>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#24234C',
                lineHeight: 1.3,
              }}>
                {scope?.subject || 'Assigned Subject'}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#E6A23C',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                marginTop: '0.2rem',
              }}>
                {scope?.curriculumId || 'R26'}
              </div>
            </div>

            {/* BRANCH */}
            <div style={{
              backgroundColor: '#F8F6EF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#7C8092',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}>
                BRANCH
              </div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#24234C',
              }}>
                {scope?.branch || 'CSE'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7C8092', marginTop: '0.15rem' }}>
                {scope?.branchName || 'Department'}
              </div>
            </div>

            {/* YEAR */}
            <div style={{
              backgroundColor: '#F8F6EF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#7C8092',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}>
                YEAR
              </div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#24234C',
              }}>
                Year {scope?.year || 1}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7C8092', marginTop: '0.15rem' }}>
                Undergraduate I B.Tech
              </div>
            </div>

            {/* SEMESTER */}
            <div style={{
              backgroundColor: '#F8F6EF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#7C8092',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.35rem',
              }}>
                SEMESTER
              </div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#24234C',
              }}>
                Semester {scope?.semester || 1}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7C8092', marginTop: '0.15rem' }}>
                Curriculum Regulation R26
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. NAVIGATION TAB BAR (FACULTY FOCUSED)                             */}
        {/* =================================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid #EBE6DA',
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSection === 'overview' ? '#24234C' : 'transparent',
                color: activeSection === 'overview' ? '#FFFFFF' : '#7C8092',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={14} />
              <span>Unit Management</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                backgroundColor: activeSection === 'overview' ? 'rgba(255,255,255,0.2)' : '#EBE6DA',
                color: activeSection === 'overview' ? '#FFFFFF' : '#24234C',
              }}>
                {unitsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('resources')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSection === 'resources' ? '#24234C' : 'transparent',
                color: activeSection === 'resources' ? '#FFFFFF' : '#7C8092',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BookOpen size={14} />
              <span>Published Resources</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                backgroundColor: activeSection === 'resources' ? '#E6A23C' : '#EBE6DA',
                color: activeSection === 'resources' ? '#FFFFFF' : '#24234C',
                fontWeight: 700,
              }}>
                {resources.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('activity')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSection === 'activity' ? '#24234C' : 'transparent',
                color: activeSection === 'activity' ? '#FFFFFF' : '#7C8092',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={14} />
              <span>Recent Activity</span>
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => { fetchResources(); fetchAuditLogs(); }}
            title="Refresh Live Resources"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE6DA',
              borderRadius: '6px',
              padding: '0.45rem 0.75rem',
              color: '#7C8092',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={loadingResources ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* 4. SECTION: UNIT MANAGEMENT (UNITS 1 TO 5)                          */}
        {/* =================================================================== */}
        {activeSection === 'overview' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#24234C',
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}>
                  Academic Units & Syllabus Structure
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#7C8092', marginTop: '0.2rem' }}>
                  Select a unit to publish notes, questions, or presentation slides
                </div>
              </div>

              <button
                type="button"
                onClick={() => openUploadForUnit('Unit 1')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#24234C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Upload size={13} color="#E6A23C" />
                <span>+ Upload to Unit</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}>
              {unitsList.map((unit) => {
                const unitResources = resources.filter(r => r.unit === unit.label);
                return (
                  <div
                    key={unit.number}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EBE6DA',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(36, 35, 76, 0.03)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <div>
                      {/* Unit Header Badge */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.65rem',
                      }}>
                        <span style={{
                          backgroundColor: '#24234C',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                        }}>
                          {unit.label}
                        </span>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: unitResources.length > 0 ? '#10B981' : '#7C8092',
                          backgroundColor: unitResources.length > 0 ? 'rgba(16, 185, 129, 0.1)' : '#F8F6EF',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: unitResources.length > 0 ? 'rgba(16, 185, 129, 0.3)' : '#EBE6DA',
                        }}>
                          {unitResources.length} Published
                        </span>
                      </div>

                      {/* Syllabus Title */}
                      <h3 style={{
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        color: '#24234C',
                        lineHeight: 1.35,
                        margin: '0 0 0.5rem 0',
                        minHeight: '2.7rem',
                      }}>
                        {unit.title}
                      </h3>

                      <div style={{
                        fontSize: '0.72rem',
                        color: '#7C8092',
                        fontFamily: 'var(--font-mono, monospace)',
                        marginBottom: '0.85rem',
                      }}>
                        {unit.topicsCount} Curriculum Topics · Mid-Term Evaluation Scope
                      </div>

                      {/* Published items quick list */}
                      {unitResources.length > 0 && (
                        <div style={{
                          backgroundColor: '#F8F6EF',
                          border: '1px solid #EBE6DA',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}>
                          {unitResources.slice(0, 3).map(res => (
                            <div key={res.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              color: '#24234C',
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                <span>{res.icon || '📄'}</span>
                                <span style={{ fontWeight: 600 }}>{res.title}</span>
                              </div>
                              {res.link && (
                                <a
                                  href={res.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#E6A23C', display: 'flex', alignItems: 'center' }}
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          ))}
                          {unitResources.length > 3 && (
                            <div style={{ fontSize: '0.68rem', color: '#7C8092', textAlign: 'center' }}>
                              + {unitResources.length - 3} more published items
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => openUploadForUnit(unit.label)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #24234C',
                        color: '#24234C',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#24234C';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.color = '#24234C';
                      }}
                    >
                      <Upload size={13} />
                      <span>+ Publish to {unit.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. SECTION: PUBLISHED RESOURCES LIST                                */}
        {/* =================================================================== */}
        {activeSection === 'resources' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#24234C',
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}>
                  Published Teaching Resources
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#7C8092', marginTop: '0.2rem' }}>
                  Manage materials actively served to enrolled students
                </div>
              </div>

              <button
                type="button"
                onClick={() => openUploadForUnit('Unit 1')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#24234C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Upload size={14} color="#E6A23C" />
                <span>+ Upload Resource</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EBE6DA',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#F8F6EF',
                border: '1px solid #EBE6DA',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                flex: '1',
                minWidth: '240px',
              }}>
                <Search size={15} color="#7C8092" />
                <input
                  type="text"
                  placeholder="Search resources by title, unit, or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.82rem',
                    color: '#24234C',
                    width: '100%',
                  }}
                />
              </div>

              {/* Unit filter buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFilterUnit('ALL')}
                  style={{
                    border: '1px solid',
                    borderColor: filterUnit === 'ALL' ? '#24234C' : '#EBE6DA',
                    backgroundColor: filterUnit === 'ALL' ? '#24234C' : '#FFFFFF',
                    color: filterUnit === 'ALL' ? '#FFFFFF' : '#7C8092',
                    borderRadius: '4px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All Units
                </button>
                {unitsList.map(u => (
                  <button
                    key={u.number}
                    type="button"
                    onClick={() => setFilterUnit(u.label)}
                    style={{
                      border: '1px solid',
                      borderColor: filterUnit === u.label ? '#24234C' : '#EBE6DA',
                      backgroundColor: filterUnit === u.label ? '#24234C' : '#FFFFFF',
                      color: filterUnit === u.label ? '#FFFFFF' : '#7C8092',
                      borderRadius: '4px',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources List */}
            {loadingResources ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE6DA',
                borderRadius: '8px',
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#7C8092',
                fontSize: '0.85rem',
              }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem', color: '#E6A23C' }} />
                <div>Fetching live published resources from Google Apps Script...</div>
              </div>
            ) : filteredResources.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE6DA',
                borderRadius: '8px',
                padding: '3rem 1rem',
                textAlign: 'center',
                color: '#7C8092',
              }}>
                <FolderOpen size={36} color="#E6A23C" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#24234C', margin: '0 0 0.35rem 0' }}>
                  No published resources found
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#7C8092', maxWidth: '420px', margin: '0 auto 1rem' }}>
                  {searchQuery ? 'No resources match your search criteria.' : 'You have not published any resources yet. Click below to add your first resource.'}
                </p>
                <button
                  type="button"
                  onClick={() => openUploadForUnit('Unit 1')}
                  style={{
                    backgroundColor: '#24234C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Upload First Resource
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredResources.map((res) => (
                  <div
                    key={res.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EBE6DA',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      boxShadow: '0 1px 2px rgba(36, 35, 76, 0.02)',
                    }}
                  >
                    {/* Item Information */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1', minWidth: '260px' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: '#F8F6EF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #EBE6DA',
                      }}>
                        {res.icon || '📄'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            backgroundColor: '#24234C',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                          }}>
                            {res.unit}
                          </span>
                          {res.fileUpload && (
                            <span style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}>
                              File Drive
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#7C8092',
                            fontFamily: 'var(--font-mono, monospace)',
                          }}>
                            {res.date || 'Published'}
                          </span>
                        </div>
                        <h4 style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#24234C',
                          margin: 0,
                          lineHeight: 1.3,
                        }}>
                          {res.title}
                        </h4>
                        {res.fileName && (
                          <div style={{ fontSize: '0.72rem', color: '#7C8092', marginTop: '0.15rem' }}>
                            Attachment: {res.fileName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Open & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {res.link && (
                        <a
                          href={res.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: '#F8F6EF',
                            border: '1px solid #EBE6DA',
                            color: '#24234C',
                            borderRadius: '6px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={13} color="#E6A23C" />
                          <span>Open</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingResource(res)}
                        title="Delete this resource"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. SECTION: RECENT ACTIVITY (AUDIT LOGS)                            */}
        {/* =================================================================== */}
        {activeSection === 'activity' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#24234C',
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}>
                  Faculty Audit Activity Log
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#7C8092', marginTop: '0.2rem' }}>
                  Complete audit trail of content publications and deletions
                </div>
              </div>

              <button
                type="button"
                onClick={fetchAuditLogs}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EBE6DA',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#7C8092',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={loadingAudit ? 'spin' : ''} />
                <span>Refresh Log</span>
              </button>
            </div>

            {loadingAudit ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE6DA',
                borderRadius: '8px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: '#7C8092',
                fontSize: '0.85rem',
              }}>
                Loading activity logs...
              </div>
            ) : auditLogs.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE6DA',
                borderRadius: '8px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: '#7C8092',
              }}>
                No recent activity recorded for this faculty account.
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #EBE6DA',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                {auditLogs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderBottom: idx < auditLogs.length - 1 ? '1px solid #EBE6DA' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: log.action.includes('DELETE') ? '#fee2e2' : '#e0e7ff',
                          color: log.action.includes('DELETE') ? '#991b1b' : '#3730a3',
                        }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#24234C' }}>
                          {log.target}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#7C8092' }}>
                        {log.details}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.72rem',
                      color: '#7C8092',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 7. UPLOAD RESOURCE MODAL                                            */}
      {/* =================================================================== */}
      {isUploadOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(36, 35, 76, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EBE6DA',
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(36, 35, 76, 0.15)',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #EBE6DA',
              paddingBottom: '0.85rem',
              marginBottom: '1.25rem',
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#24234C',
                  margin: 0,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                }}>
                  Publish Academic Resource
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#7C8092', marginTop: '0.2rem' }}>
                  Publishes to Google Drive & immediately visible on Medhas Learn
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsUploadOpen(false); setPublishStatus(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7C8092',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Status Feedback Alert */}
            {publishStatus && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: publishStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: publishStatus.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${publishStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              }}>
                {publishStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{publishStatus.message}</span>
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handlePublish}>
              {/* Unit Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#24234C', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Academic Unit *
                </label>
                <select
                  value={uploadUnit}
                  onChange={(e) => setUploadUnit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #EBE6DA',
                    backgroundColor: '#F8F6EF',
                    color: '#24234C',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {unitsList.map(u => (
                    <option key={u.number} value={u.label}>
                      {u.label}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#24234C', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 1 Complete Handwritten Notes"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #EBE6DA',
                    backgroundColor: '#FFFFFF',
                    color: '#24234C',
                    fontSize: '0.85rem',
                  }}
                  required
                />
              </div>

              {/* Resource Type & Icon Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#24234C', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Resource Type
                  </label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #EBE6DA',
                      backgroundColor: '#FFFFFF',
                      color: '#24234C',
                      fontSize: '0.82rem',
                    }}
                  >
                    {RESOURCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#24234C', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Icon
                  </label>
                  <select
                    value={uploadIcon}
                    onChange={(e) => setUploadIcon(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #EBE6DA',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#24234C',
                    }}
                  >
                    {RESOURCE_ICONS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode Toggle: File Upload vs Link */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#24234C', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Delivery Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: uploadMode === 'file' ? '#24234C' : '#EBE6DA',
                      backgroundColor: uploadMode === 'file' ? '#24234C' : '#F8F6EF',
                      color: uploadMode === 'file' ? '#FFFFFF' : '#7C8092',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <FileUp size={14} />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: uploadMode === 'link' ? '#24234C' : '#EBE6DA',
                      backgroundColor: uploadMode === 'link' ? '#24234C' : '#F8F6EF',
                      color: uploadMode === 'link' ? '#FFFFFF' : '#7C8092',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <LinkIcon size={14} />
                    <span>Paste Link</span>
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div>
                    <div style={{
                      border: '2px dashed #EBE6DA',
                      borderRadius: '8px',
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      backgroundColor: '#F8F6EF',
                    }}>
                      <input
                        type="file"
                        id="faculty-file-input"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                      />
                      <label
                        htmlFor="faculty-file-input"
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Upload size={22} color="#E6A23C" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#24234C' }}>
                          {selectedFile ? selectedFile.name : 'Choose File from Computer'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#7C8092' }}>
                          PDF, Word, PPT or ZIP up to 20MB
                        </span>
                      </label>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#7C8092', margin: '0.4rem 0 0', textAlign: 'center' }}>
                      💡 Tip: For faster student access, you can also select <strong>Paste Link</strong> to attach a Google Drive link directly.
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="Paste Google Drive link, OneDrive, or document URL..."
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #EBE6DA',
                        backgroundColor: '#FFFFFF',
                        color: '#24234C',
                        fontSize: '0.85rem',
                      }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#7C8092', marginTop: '0.3rem' }}>
                      Ensure file sharing permissions are set to "Anyone with the link can view".
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #EBE6DA',
                    backgroundColor: '#FFFFFF',
                    color: '#7C8092',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  disabled={isPublishing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPublishing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#24234C',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isPublishing ? 'not-allowed' : 'pointer',
                    opacity: isPublishing ? 0.75 : 1,
                  }}
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Publishing to Medhas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} color="#E6A23C" />
                      <span>Publish Resource</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 8. DELETE CONFIRMATION MODAL                                        */}
      {/* =================================================================== */}
      {deletingResource && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(36, 35, 76, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EBE6DA',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <ShieldAlert size={24} color="#dc2626" />
            </div>

            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#24234C',
              margin: '0 0 0.5rem 0',
            }}>
              Confirm Resource Deletion
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#7C8092', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong style={{ color: '#24234C' }}>"{deletingResource.title}"</strong> ({deletingResource.unit})? This will immediately remove it from the student learning portal.
            </p>

            {deleteError && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '0.75rem',
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => { setDeletingResource(null); setDeleteError(null); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #EBE6DA',
                  backgroundColor: '#FFFFFF',
                  color: '#7C8092',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.75 : 1,
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyPortal;
