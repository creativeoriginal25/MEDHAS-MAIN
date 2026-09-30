/**
 * Unified API Client for College Platform
 * Handles JWT injection, response normalization, and error handling.
 */

import { RegisterPayload } from '../types';

const envBase = (import.meta as any).env?.VITE_API_URL || '';
const BASE_URL = envBase ? `${envBase.replace(/\/$/, '')}/api` : '/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // If unauthorized, clear token if expired
      if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network connection failed. Please check your connection.', 0);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) => 
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// --- AUTH API ---
export const authApi = {
  login: (register_number: string, pin: string, platform = 'web') =>
    api.post<{ token: string; user: any }>('/auth/login', { register_number, pin, platform }),
  register: (payload: RegisterPayload) =>
    api.post<{ token: string; user: any }>('/auth/register', payload),
  logout: () => api.post<{ message: string }>('/auth/logout'),
  getMe: () => api.get<any>('/auth/me'),
  changePin: (current_pin: string, new_pin: string) =>
    api.post<{ message: string }>('/auth/change-pin', { current_pin, new_pin }),
  updateBaseline: (payload: { baseline_attended?: number; baseline_total?: number; baseline_date?: string | null; section_id?: number }) =>
    api.post<{ message: string; user: any }>('/auth/baseline', payload),
  deleteAccount: (pin: string) =>
    api.post<{ message: string }>('/auth/delete-account', { pin }),
};

// --- ATTENDANCE API ---
export const attendanceApi = {
  getToday: () => api.get<any>('/attendance/today'),
  getDate: (date: string) => api.get<any>(`/attendance/date/${date}`),
  markAttendance: (log_date: string, entries: Array<{ block_id: number; status: string; notes?: string }>) =>
    api.post<{ success: boolean; updated_count: number; summary?: any }>('/attendance/mark', { log_date, entries }),
  getDashboard: () => api.get<any>('/attendance/dashboard'),
  getSummary: () => api.get<any>('/attendance/summary'),
  getForecast: (daysOrDate: number | string = 7) => {
    if (typeof daysOrDate === 'string') {
      return api.get<any>(`/attendance/forecast?target_date=${daysOrDate}`);
    }
    return api.get<any>(`/attendance/forecast?days=${daysOrDate}`);
  },
  getTargetCalculation: (targetPercentage = 75) =>
    api.get<any>(`/attendance/target-calculator?target_percentage=${targetPercentage}`),
  getTimetable: () => api.get<any>('/attendance/timetable'),
  getLogs: () => api.get<any>('/attendance/logs'),
  getSections: () => api.get<any>('/attendance/sections'),
  getSectionTimetable: (sectionId: number) => api.get<any>(`/attendance/sections/${sectionId}/timetable`),
  updateTimetable: (sectionId: number, data: { blocks: any[] }) =>
    api.put<any>(`/attendance/sections/${sectionId}/timetable`, data),
  exportCsv: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/attendance/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_ledger.csv`;
    a.click();
  },
};

// --- CONTENT API ---
export const contentApi = {
  getDepartments: () => api.get<any[]>('/content/departments'),
  getSubjects: (department?: string, year = 1, semester = 1) => {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    params.append('year', year.toString());
    params.append('semester', semester.toString());
    return api.get<any[]>(`/content/subjects?${params.toString()}`);
  },
  getSubject: (id: number) => api.get<any>(`/content/subjects/${id}`),
  getSubjectUnits: (id: number) => api.get<any[]>(`/content/subjects/${id}/units`),
  getResources: (params?: { subject_id?: number; unit_id?: number; resource_type?: string }) => {
    const sp = new URLSearchParams();
    if (params?.subject_id) sp.append('subject_id', params.subject_id.toString());
    if (params?.unit_id) sp.append('unit_id', params.unit_id.toString());
    if (params?.resource_type) sp.append('resource_type', params.resource_type);
    return api.get<any[]>(`/content/resources?${sp.toString()}`);
  },
  search: (query: string) => api.get<any[]>(`/content/search?q=${encodeURIComponent(query)}`),
  getSaved: () => api.get<any[]>('/content/saved'),
  saveResource: (resourceId: number) => api.post<any>(`/content/save/${resourceId}`),
  unsaveResource: (resourceId: number) => api.delete<any>(`/content/save/${resourceId}`),
};

// --- GROW API (AI PROMPTS & CAREER) ---
export const growApi = {
  getPrompts: (category?: string) => {
    const url = category ? `/grow/prompts?category=${encodeURIComponent(category)}` : '/grow/prompts';
    return api.get<Record<string, any[]>>(url);
  },
  getPrompt: (id: number) => api.get<any>(`/grow/prompts/${id}`),
  getCareerPaths: (department?: string) => {
    const url = department ? `/grow/career-paths?department=${encodeURIComponent(department)}` : '/grow/career-paths';
    return api.get<any[]>(url);
  },
  getRoadmaps: (department?: string, year?: number) => {
    const sp = new URLSearchParams();
    if (department) sp.append('department', department);
    if (year) sp.append('year', year.toString());
    return api.get<any[]>(`/grow/roadmaps?${sp.toString()}`);
  },
};

// --- CAMPUS API ---
export const campusApi = {
  getServices: () => api.get<any[]>('/campus/services'),
  getCatalog: (serviceId: number) => api.get<any[]>(`/campus/services/${serviceId}/catalog`),
};

// --- ADMIN API ---
export const adminApi = {
  resetPin: (target_register_number: string, new_pin: string) =>
    api.post<any>('/admin/reset-pin', { target_register_number, new_pin }),
  assignRole: (register_number: string, role: string) =>
    api.post<any>('/admin/assign-role', { register_number, role }),
  revokeRole: (register_number: string, role: string) =>
    api.post<any>('/admin/revoke-role', { register_number, role }),
  getAuditLogs: (limit = 50) => api.get<any[]>(`/admin/audit-logs?limit=${limit}`),
};
