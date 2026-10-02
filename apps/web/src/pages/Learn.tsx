import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStudentAcademicContext,
  getScopedAcademicData,
  resolveStudentDepartment, 
  getDepartmentCurriculum, 
  SubjectCourse, 
  UnitDetail, 
  LabExperiment 
} from '../data/r26Curriculum';
import { facultyApi } from '../api/resources';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  FileText, 
  BookmarkCheck, 
  ChevronRight, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  X, 
  ArrowLeft, 
  FlaskConical, 
  GraduationCap, 
  FileCheck, 
  Compass, 
  Download,
  ExternalLink,
  Lock
} from 'lucide-react';

export const Learn: React.FC = () => {
  const { user } = useAuth();

  // Authenticated Student Academic Context is the SINGLE SOURCE OF TRUTH
  // Scoped strictly by: Branch + Academic Year + Semester
  const studentContext = useMemo(() => getStudentAcademicContext(user), [user]);
  const deptCode = studentContext.branch;
  const academicYear = studentContext.academicYear;
  const semester = studentContext.semester;

  // Hierarchical scoped curriculum for authenticated student (Year 1 -> Sem 1, Year 2 -> Sem 3, etc.)
  const curriculum = useMemo(
    () => getScopedAcademicData(deptCode, academicYear, semester),
    [deptCode, academicYear, semester]
  );

  const [subTab, setSubTab] = useState<'courses' | 'search' | 'saved'>('courses');
  const [selectedSubject, setSelectedSubject] = useState<SubjectCourse | null>(null);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number | null>(null);

  // Search state (strictly scoped to student's department, year and semester)
  const [searchQuery, setSearchQuery] = useState('');

  // Saved resources state
  const [savedUnits, setSavedUnits] = useState<Set<string>>(() => {
    const cached = localStorage.getItem('medhas_saved_units');
    return cached ? new Set(JSON.parse(cached)) : new Set();
  });

  // Notes Reader Drawer Modal State
  const [readerUnit, setReaderUnit] = useState<{ unit: UnitDetail; subjectName: string; subjectCode: string } | null>(null);
  const [readerLab, setReaderLab] = useState<{ lab: SubjectCourse; experiment?: LabExperiment } | null>(null);

  // Published Faculty Courseware & Resources (Strictly Branch + Year + Semester Scoped)
  const [facultyResources, setFacultyResources] = useState<any[]>([]);
  const [loadingFacultyRes, setLoadingFacultyRes] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      setLoadingFacultyRes(true);
      facultyApi.getStudentResources(deptCode, selectedSubject.id, academicYear, semester)
        .then(data => setFacultyResources(data))
        .catch(err => console.error('Failed to load faculty resources', err))
        .finally(() => setLoadingFacultyRes(false));
    } else {
      setFacultyResources([]);
    }
  }, [selectedSubject, deptCode, academicYear, semester]);

  const toggleSaveUnit = (key: string) => {
    setSavedUnits(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem('medhas_saved_units', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenSubject = (subject: SubjectCourse) => {
    setSelectedSubject(subject);
    setSelectedUnitNumber(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCourses = () => {
    setSelectedSubject(null);
    setSelectedUnitNumber(null);
  };

  // Filter units for selected subject
  const currentUnits: UnitDetail[] = selectedSubject?.units || [];
  const displayedUnits = selectedUnitNumber === null 
    ? currentUnits 
    : currentUnits.filter(u => u.unit_number === selectedUnitNumber);

  // Department-scoped search filter
  const matchingTheoryUnits = searchQuery.trim().length > 1
    ? curriculum.theory.flatMap(sub => 
        (sub.units || [])
          .filter(u => 
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
            u.important_questions.some(q => q.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.key_formulas && u.key_formulas.some(f => f.toLowerCase().includes(searchQuery.toLowerCase())))
          )
          .map(u => ({ subject: sub, unit: u }))
      )
    : [];

  const matchingLabExperiments = searchQuery.trim().length > 1
    ? curriculum.labs.flatMap(lab => 
        (lab.experiments || [])
          .filter(exp => 
            lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lab.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (exp.viva_questions && exp.viva_questions.some(v => v.toLowerCase().includes(searchQuery.toLowerCase())))
          )
          .map(exp => ({ lab, experiment: exp }))
      )
    : [];

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* 1. TOP PERSONALIZED ACADEMIC BANNER */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--accent-gold)',
              marginBottom: '0.2rem'
            }}>
              YOUR ACADEMICS
            </div>
            <h1 className="font-serif" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {curriculum.name}
            </h1>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--ink-soft)',
              marginTop: '0.3rem',
              fontFamily: 'var(--font-mono)'
            }}>
              {curriculum.academicYear} · {curriculum.semester} · {curriculum.regulation} Regulations
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-neutral mono-num" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              BRANCH: {deptCode}
            </span>
            <span className="badge badge-neutral mono-num" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              YEAR {academicYear} · SEM {semester}
            </span>
            <span className="badge badge-good mono-num" style={{ fontSize: '0.78rem' }}>
              {curriculum.theory.length} Theory · {curriculum.labs.length} Practical
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.72rem',
              color: 'var(--ink-soft)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--paper-subtle, #f8fafc)',
              border: '1px solid var(--border-subtle, #e2e8f0)'
            }}>
              <Lock size={11} color="var(--accent-gold, #d97706)" />
              <span>Locked Scope</span>
            </span>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginTop: '0.85rem'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${subTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSubTab('courses'); setSelectedSubject(null); }}
          >
            <BookOpen size={14} />
            <span>Academic Curriculum ({curriculum.theory.length + curriculum.labs.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${subTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('search')}
          >
            <Search size={14} />
            <span>Search Library</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${subTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('saved')}
          >
            <Bookmark size={14} />
            <span>Saved Units ({savedUnits.size})</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB: COURSES OVERVIEW & SUBJECT DETAIL */}
      {subTab === 'courses' && (
        <div>
          {/* A. If a subject is currently selected -> RENDER SUBJECT DETAIL */}
          {selectedSubject ? (
            <div>
              {/* Back to Overview Ribbon */}
              <div style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleBackToCourses}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={14} />
                  <span>← Back to All {curriculum.code} Courses</span>
                </button>
              </div>

              {/* Subject Detail Header Card */}
              <div className="ledger-card" style={{ marginBottom: '1.25rem', border: '1px solid var(--rule)' }}>
                <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                      <span className="badge badge-neutral mono-num" style={{ fontWeight: 800 }}>
                        {selectedSubject.shortName}
                      </span>
                      <span className={`badge ${selectedSubject.type === 'THEORY' ? 'badge-good' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {selectedSubject.type === 'THEORY' ? 'THEORY COURSE' : 'LABORATORY / PRACTICAL'}
                      </span>
                      <span className="badge badge-neutral mono-num" style={{ fontSize: '0.7rem' }}>
                        {selectedSubject.credits} Credits
                      </span>
                    </div>
                    <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      {selectedSubject.name}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      {curriculum.name} · {curriculum.academicYear} · {curriculum.semester} · {curriculum.regulation}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                      SRKR Autonomous Scheme
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>
                      {selectedSubject.type === 'THEORY' ? '5 Units · 70 Marks External' : `${selectedSubject.experiments?.length || 0} Core Experiments`}
                    </div>
                  </div>
                </div>

                {/* If THEORY COURSE: Show Unit Filter Navigation */}
                {selectedSubject.type === 'THEORY' && selectedSubject.units && (
                  <div style={{
                    display: 'flex',
                    gap: '0.35rem',
                    overflowX: 'auto',
                    paddingTop: '0.75rem',
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
                )}
              </div>

              {/* RENDER THEORY UNITS */}
              {selectedSubject.type === 'THEORY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {displayedUnits.map((unit) => {
                    const saveKey = `${selectedSubject.id}-${unit.unit_number}`;
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
                              {unit.weightage && (
                                <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent-gold, #d97706)', border: '1px solid rgba(217, 119, 6, 0.3)', fontSize: '0.7rem' }}>
                                  {unit.weightage}
                                </span>
                              )}
                            </div>
                            <h3 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
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
                              onClick={() => setReaderUnit({ unit, subjectName: selectedSubject.name, subjectCode: selectedSubject.shortName })}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            >
                              <FileText size={14} />
                              <span>Read Lecture Notes</span>
                            </button>
                          </div>
                        </div>



                        {/* Faculty Published Courseware & Study Materials */}
                        {(() => {
                          const unitFacultyMaterials = facultyResources.filter(r => 
                            r.unit === `Unit ${unit.unit_number}` || 
                            r.unit?.includes(String(unit.unit_number)) ||
                            (unit.unit_number === 1 && r.unit === 'General')
                          );
                          if (unitFacultyMaterials.length === 0) return null;
                          return (
                            <div style={{
                              marginTop: '0.85rem',
                              background: 'rgba(230, 162, 60, 0.05)',
                              border: '1px solid rgba(230, 162, 60, 0.35)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.85rem 1rem',
                            }}>
                              <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--accent-gold, #d97706)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}>
                                <Sparkles size={14} color="var(--accent-gold, #d97706)" />
                                <span>Faculty Published Courseware ({unitFacultyMaterials.length} Items)</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {unitFacultyMaterials.map((res: any) => (
                                  <div 
                                    key={res.id} 
                                    style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center', 
                                      padding: '0.4rem 0.65rem', 
                                      background: '#ffffff', 
                                      borderRadius: '4px', 
                                      border: '1px solid var(--rule)' 
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                      <span>{res.icon || '📄'}</span>
                                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{res.title}</span>
                                      {res.fileName && <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>({res.fileName})</span>}
                                    </div>
                                    {res.link && (
                                      <a
                                        href={res.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontSize: '0.75rem',
                                          color: 'var(--accent-gold, #d97706)',
                                          fontWeight: 700,
                                          textDecoration: 'none'
                                        }}
                                      >
                                        <span>Access</span>
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RENDER LABORATORY / PRACTICAL DETAILS */}
              {selectedSubject.type === 'PRACTICAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Lab Structure Overview Card */}
                  <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                    <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
                        Laboratory Manual & Structured Experiments
                      </span>
                      <span className="badge badge-good mono-num">
                        {selectedSubject.experiments?.length || 0} Prescribed Exercises
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      marginTop: '0.75rem',
                    }}>
                      <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Structure</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginTop: '0.2rem' }}>Hands-on Laboratory Work</div>
                      </div>
                      <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Evaluation</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginTop: '0.2rem' }}>Continuous Assessment + Viva</div>
                      </div>
                      <div style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Documentation</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginTop: '0.2rem' }}>Observation Book & Record</div>
                      </div>
                    </div>
                  </div>

                  {/* Experiments List */}
                  {(selectedSubject.experiments || []).map((exp) => (
                    <div key={exp.experiment_number} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                      <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span className="badge badge-neutral mono-num" style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                            EXPERIMENT {exp.experiment_number}
                          </span>
                          <h3 className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                            {exp.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReaderLab({ lab: selectedSubject, experiment: exp })}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <FileText size={14} />
                          <span>View Protocol & Viva</span>
                        </button>
                      </div>

                      {exp.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5, marginTop: '0.5rem' }}>
                          {exp.description}
                        </p>
                      )}

                      {/* Viva Voce Questions Preview */}
                      {exp.viva_questions && exp.viva_questions.length > 0 && (
                        <div style={{
                          marginTop: '0.75rem',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--rule)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 1rem'
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <HelpCircle size={13} color="var(--accent-gold)" />
                            <span>Viva Voce Preparation:</span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                            {exp.viva_questions.map((vq, vIdx) => (
                              <li key={vIdx} style={{ marginBottom: '0.2rem' }}>
                                {vq}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* B. Overview: RENDER THEORY COURSES & LAB COURSES GRIDS OR IN-PREPARATION PLACEHOLDER */
            (!curriculum.isAvailable || (curriculum.theory.length === 0 && curriculum.labs.length === 0)) ? (
              /* Scoped In-Preparation State for Higher Academic Years / Semesters */
              <div className="ledger-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px solid var(--rule)' }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(230, 162, 60, 0.12)',
                  color: 'var(--accent-gold, #d97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <GraduationCap size={30} />
                </div>
                <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  Curriculum & Courseware In Preparation
                </h2>
                <div style={{ maxWidth: 580, margin: '0.85rem auto 1.5rem auto', color: 'var(--ink-soft)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  You are authenticated as a <strong style={{ color: 'var(--ink)' }}>Year {academicYear} (Semester {semester})</strong> student in <strong style={{ color: 'var(--ink)' }}>{curriculum.branchName} ({deptCode})</strong>.
                  <br />
                  {curriculum.statusNote || 'Curriculum for your academic year and semester is currently being finalized by the department faculty.'}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 1rem',
                  background: 'var(--paper-subtle, #f8fafc)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  fontSize: '0.8rem',
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <Lock size={13} color="var(--accent-gold, #d97706)" />
                  <span>Authenticated Academic Scope: {deptCode} · Year {academicYear} · Semester {semester}</span>
                </div>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* SECTION 1: THEORY COURSES */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} color="var(--accent-gold)" />
                    <h2 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      THEORY COURSES
                    </h2>
                  </div>
                  <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                    {curriculum.theory.length} Courses Prescribed
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '1rem',
                }}>
                  {curriculum.theory.map((course) => (
                    <div
                      key={course.id}
                      className="ledger-card"
                      style={{
                        border: '1px solid var(--rule)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                      onClick={() => handleOpenSubject(course)}
                    >
                      <div>
                        {/* Card Header with Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <span className="badge badge-neutral mono-num" style={{ fontWeight: 800, fontSize: '0.78rem' }}>
                            {course.shortName}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <span className="badge badge-good" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                              THEORY
                            </span>
                            <span className="badge badge-neutral mono-num" style={{ fontSize: '0.68rem' }}>
                              {course.credits} Cr
                            </span>
                          </div>
                        </div>

                        {/* Subject Full Name */}
                        <h3 className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35, minHeight: '3rem' }}>
                          {course.name}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                          5 Units · Comprehensive Notes & Q&A
                        </div>
                      </div>

                      {/* Open Subject CTA */}
                      <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--rule)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--accent-gold)'
                      }}>
                        <span>Open Subject</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: LABORATORY / PRACTICAL COURSES */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FlaskConical size={18} color="var(--good)" />
                    <h2 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      LABORATORY / PRACTICAL COURSES
                    </h2>
                  </div>
                  <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                    {curriculum.labs.length} Practical Laboratories
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '1rem',
                }}>
                  {curriculum.labs.map((lab) => (
                    <div
                      key={lab.id}
                      className="ledger-card"
                      style={{
                        border: '1px solid var(--rule)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                      onClick={() => handleOpenSubject(lab)}
                    >
                      <div>
                        {/* Card Header with Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <span className="badge badge-neutral mono-num" style={{ fontWeight: 800, fontSize: '0.78rem' }}>
                            {lab.shortName}
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(36, 27, 78, 0.08)' }}>
                              PRACTICAL
                            </span>
                            <span className="badge badge-neutral mono-num" style={{ fontSize: '0.68rem' }}>
                              {lab.credits} Cr
                            </span>
                          </div>
                        </div>

                        {/* Lab Full Name */}
                        <h3 className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35, minHeight: '3rem' }}>
                          {lab.name}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                          {lab.experiments?.length || 0} Experiments · Viva Voce Guide
                        </div>
                      </div>

                      {/* Open Subject CTA */}
                      <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--rule)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--ink)'
                      }}>
                        <span>Open Laboratory</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )
          )}
        </div>
      )}

      {/* 3. SUBTAB: DEPARTMENT-SCOPED SEARCH LIBRARY */}
      {subTab === 'search' && (
        <div>
          <div className="ledger-card" style={{ marginBottom: '1.25rem', border: '1px solid var(--rule)' }}>
            <div className="card-header-ruled">
              <span className="card-header-title font-serif" style={{ fontSize: '1.2rem' }}>
                Search {deptCode} Academic Repository
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Search restricted to {curriculum.branchName} ({curriculum.yearLabel} · {curriculum.semesterLabel}). Cross-year & cross-department content is isolated.
              </div>
            </div>
            <div style={{ position: 'relative', marginTop: '0.75rem' }}>
              <input
                type="text"
                className="input-control"
                placeholder={`Search ${curriculum.code} topics, questions, formulas, or experiments...`}
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
              matchingTheoryUnits.length === 0 && matchingLabExperiments.length === 0 ? (
                <div className="ledger-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  No matches found in {curriculum.code} curriculum for "{searchQuery}".
                </div>
              ) : (
                <>
                  {matchingTheoryUnits.map(({ subject, unit }) => (
                    <div key={`${subject.id}-${unit.unit_number}`} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <span className="badge badge-neutral mono-num">{subject.shortName}</span>
                            <span className="badge badge-good mono-num">Unit {unit.unit_number}</span>
                          </div>
                          <h4 className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                            {unit.title}
                          </h4>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
                            {unit.topics.slice(0, 3).join(' · ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReaderUnit({ unit, subjectName: subject.name, subjectCode: subject.shortName })}
                        >
                          <FileText size={14} />
                          <span>View Notes</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {matchingLabExperiments.map(({ lab, experiment }) => (
                    <div key={`${lab.id}-${experiment.experiment_number}`} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <span className="badge badge-neutral mono-num">{lab.shortName}</span>
                            <span className="badge badge-neutral mono-num">Exp {experiment.experiment_number}</span>
                          </div>
                          <h4 className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                            {experiment.title}
                          </h4>
                          {experiment.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
                              {experiment.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReaderLab({ lab, experiment })}
                        >
                          <FileText size={14} />
                          <span>View Protocol</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )
            ) : (
              <div className="ledger-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                Type keywords above to instantly locate syllabus units, questions, and lab protocols for {curriculum.name}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB: SAVED UNITS REVISION DECK */}
      {subTab === 'saved' && (
        <div>
          <div className="ledger-card" style={{ marginBottom: '1.25rem', border: '1px solid var(--rule)' }}>
            <div className="card-header-ruled">
              <span className="card-header-title font-serif">Bookmarked Revision Deck</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', marginTop: '0.35rem' }}>
              Your personalized academic bookmarks for {curriculum.name}. Saved across sessions and available for exam prep.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {savedUnits.size === 0 ? (
              <div className="ledger-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
                No units bookmarked yet. Click "Save" on any unit in your curriculum to add it to this revision deck.
              </div>
            ) : (
              Array.from(savedUnits).map((key) => {
                // Find unit in current department
                let matchedSubject: SubjectCourse | undefined;
                let matchedUnit: UnitDetail | undefined;

                for (const sub of curriculum.theory) {
                  const u = (sub.units || []).find(unit => `${sub.id}-${unit.unit_number}` === key);
                  if (u) {
                    matchedSubject = sub;
                    matchedUnit = u;
                    break;
                  }
                }

                if (!matchedSubject || !matchedUnit) return null;

                return (
                  <div key={key} className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span className="badge badge-neutral mono-num">{matchedSubject.shortName}</span>
                          <span className="badge badge-good mono-num">Unit {matchedUnit.unit_number}</span>
                        </div>
                        <h4 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                          {matchedUnit.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                          {matchedUnit.weightage} · {matchedUnit.topics.length} Key Topics Covered
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setReaderUnit({ unit: matchedUnit!, subjectName: matchedSubject!.name, subjectCode: matchedSubject!.shortName })}
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
              })
            )}
          </div>
        </div>
      )}

      {/* 5. LECTURE NOTES PREVIEW MODAL */}
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
                  {readerUnit.subjectCode} · UNIT {readerUnit.unit.unit_number} STUDY DECK
                </span>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {readerUnit.unit.title}
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
              {/* Summary */}
              {readerUnit.unit.lecture_summary && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    Summary Overview:
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {readerUnit.unit.lecture_summary}
                  </p>
                </div>
              )}

              {/* Topics */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                  Syllabus Checklist:
                </h4>
                <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {readerUnit.unit.topics.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Formulas */}
              {readerUnit.unit.key_formulas && readerUnit.unit.key_formulas.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    Formulas & Key Laws:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {readerUnit.unit.key_formulas.map((f, idx) => (
                      <div key={idx} className="mono-num" style={{ background: 'var(--surface-alt)', border: '1px solid var(--rule)', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {readerUnit.unit.important_questions && readerUnit.unit.important_questions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    University Exam Questions (14 Marks):
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {readerUnit.unit.important_questions.map((q, idx) => (
                      <div key={idx} style={{ background: 'rgba(36, 27, 78, 0.03)', border: '1px solid var(--rule)', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.825rem', lineHeight: 1.45 }}>
                        <strong>Q{idx + 1}.</strong> {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                SRKR Engineering College · {curriculum.name}
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

      {/* 6. LAB PROTOCOL & VIVA MODAL */}
      {readerLab && (
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
            maxWidth: '640px',
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
                  {readerLab.lab.shortName} · {readerLab.experiment ? `EXPERIMENT ${readerLab.experiment.experiment_number}` : 'LAB MANUAL'}
                </span>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {readerLab.experiment?.title || readerLab.lab.name}
                </h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setReaderLab(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.25rem 0', flex: 1 }}>
              {readerLab.experiment?.description && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    Objective & Implementation Protocol:
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {readerLab.experiment.description}
                  </p>
                </div>
              )}

              {readerLab.experiment?.viva_questions && readerLab.experiment.viva_questions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>
                    Viva Voce Questions:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {readerLab.experiment.viva_questions.map((vq, idx) => (
                      <div key={idx} style={{ background: 'rgba(36, 27, 78, 0.03)', border: '1px solid var(--rule)', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.825rem', lineHeight: 1.45 }}>
                        <strong>Q{idx + 1}.</strong> {vq}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--rule)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                SRKR Department Laboratory Manual
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReaderLab(null)}
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Learn;
