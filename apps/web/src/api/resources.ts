/**
 * MEDHAS: Centralized Resource API & Faculty Admin Service
 * 
 * Central API endpoint connected to the existing Google Apps Script + Drive Backend:
 * Apps Script Web App: https://script.google.com/macros/s/AKfycbx0oMKPLduC-JX52ty-WX5kzkysJwBbZb7MuZH4P04Emp3ni3t1E_TI3ABLGmeEgvVb/exec
 * Drive Folder ID: 1QwnjO4oohqJbifbWvh-v88rb4f-ov7ci
 * Sheet: Sheet1
 */

import { api } from './client';

export const MEDHAS_RESOURCE_API =
  'https://script.google.com/macros/s/AKfycbx0oMKPLduC-JX52ty-WX5kzkysJwBbZb7MuZH4P04Emp3ni3t1E_TI3ABLGmeEgvVb/exec';

export interface FacultyProfile {
  username: string;
  register_number: string;
  display_name: string;
  role: 'FACULTY_ADMIN';
  branch: string;
  branchName: string;
  subject: string;
  subjectId: string;
  curriculumId: string;
  subjectType: 'theory' | 'practical';
  year: number;
  semester: number;
}

export interface FacultyResource {
  id: number | string;
  branch: string;
  subject: string;
  subjectId: string;
  unit: string;
  title: string;
  link: string;
  icon: string;
  date: string;
  fileUpload: boolean;
  fileName: string;
  uploadedBy?: string;
}

export interface ResourceUploadPayload {
  unit: string;
  title: string;
  link?: string;
  icon?: string;
  fileUpload?: boolean;
  fileName?: string;
  fileBase64?: string;
  // Included to verify server-side tampering protection
  branch?: string;
  subjectId?: string;
  year?: number;
  semester?: number;
}

export interface FacultyAuditItem {
  id: number;
  action: string;
  target: string;
  details: string;
  created_at: string;
}

export const facultyApi = {
  /**
   * Fetch authenticated faculty scope (locked branch, subject, curriculum details)
   */
  getProfile: (): Promise<FacultyProfile> => {
    return api.get<FacultyProfile>('/faculty/profile');
  },

  /**
   * Fetch all resources scoped to the faculty's locked branch & subject
   */
  getResources: (): Promise<FacultyResource[]> => {
    return api.get<FacultyResource[]>('/faculty/resources');
  },

  /**
   * Upload / publish a new resource for the faculty's assigned subject
   * Enforces server-side validation against faculty session
   */
  uploadResource: (payload: ResourceUploadPayload): Promise<any> => {
    return api.post<any>('/faculty/resources', payload);
  },

  /**
   * Delete a resource with server-side ownership verification
   */
  deleteResource: (resourceId: string | number): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/faculty/resources/${resourceId}`);
  },

  /**
   * Fetch audit logs for the authenticated faculty member
   */
  getAuditLogs: (): Promise<FacultyAuditItem[]> => {
    return api.get<FacultyAuditItem[]>('/faculty/audit-logs');
  },

  /**
   * Student endpoint to fetch published faculty materials strictly for student's branch + subject
   */
  getStudentResources: (branch: string, subjectId: string): Promise<any[]> => {
    const sp = new URLSearchParams();
    sp.append('branch', branch);
    sp.append('subject_id', subjectId);
    return api.get<any[]>(`/faculty/student-resources?${sp.toString()}`);
  },
};
