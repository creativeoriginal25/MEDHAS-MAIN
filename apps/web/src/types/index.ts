export type RoleType = 
  | 'student' 
  | 'attendance_admin' 
  | 'content_editor' 
  | 'campus_operator' 
  | 'platform_admin';

export interface User {
  id: number;
  register_number: string;
  display_name: string | null;
  department_id: number | null;
  branch?: string | null;
  section_id: number | null;
  section_label?: string | null;
  academic_year: number;
  current_semester: number;
  baseline_attended: number;
  baseline_total: number;
  baseline_date: string | null;
  roles: RoleType[];
  created_at?: string;
}

export interface RegisterPayload {
  register_number: string;
  pin: string;
  display_name?: string;
  branch?: string;
  section?: string;
  academic_year?: number;
  semester?: number;
  baseline_attended?: number;
  baseline_total?: number;
  baseline_date?: string | null;
  platform?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TimetableBlock {
  id: number;
  section_id: number;
  weekday: number; // 0=Sun..6=Sat
  order_index: number;
  subject: string;
  periods: number;
}

export interface DailyLog {
  id?: number;
  log_date: string;
  block_id: number;
  status: 'present' | 'absent' | 'holiday';
  notes?: string;
}

export interface TodayResponse {
  date: string;
  day_name: string;
  can_edit: boolean;
  edit_window: {
    min_date: string;
    max_date: string;
  };
  blocks: Array<{
    id: number;
    subject: string;
    periods: number;
    order_index: number;
    status: 'present' | 'absent' | 'holiday' | 'unmarked';
  }>;
}

export interface SubjectStat {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface DashboardResponse {
  overall_percentage: number;
  total_periods: number;
  attended_periods: number;
  bunkable_periods: number;
  needed_for_75: number;
  status: 'safe' | 'warning' | 'critical';
  subjects: SubjectStat[];
}

export interface ForecastDay {
  date: string;
  day_name: string;
  projected_percentage: number;
  status: 'safe' | 'warning' | 'critical';
  changes: Array<{
    subject: string;
    action: 'attend' | 'bunk';
    periods: number;
  }>;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  icon: string | null;
  category: string | null;
  core_topics: string[];
  career_domains: string[];
}

export interface SubjectUnit {
  id: number;
  subject_id: number;
  unit_number: number;
  title: string;
  description: string | null;
}

export interface LearningResource {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  unit_id: number | null;
  resource_type: string;
  external_url: string | null;
  visibility: string;
  created_at: string;
}

export interface Subject {
  id: number;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  units?: SubjectUnit[];
  resources?: LearningResource[];
}

export interface PromptTemplate {
  id: number;
  category: string;
  task_id: string;
  name: string;
  description: string | null;
  personalize_fields: Array<{
    id: string;
    label: string;
    placeholder: string;
  }>;
  prompt_template: string;
  icon: string | null;
  is_active: boolean;
}

export interface CareerPath {
  id: number;
  department_id: number;
  title: string;
  description: string | null;
  skills: string[];
  resources: Array<{ title: string; url: string }>;
  display_order: number;
}

export interface CampusService {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  external_url: string | null;
  is_active: boolean;
}

export interface ServiceCatalogItem {
  id: number;
  service_id: number;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_available: boolean;
}
