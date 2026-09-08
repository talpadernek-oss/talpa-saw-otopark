export type RoleType = 'kokpit' | 'kabin';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ApplicationRecord {
  id: string;
  referenceCode: string;
  role: RoleType;
  tc: string;
  name: string;
  email: string;
  phone: string;
  plate: string;
  ruhsatImage?: string; // base64 or path
  apronCardImage?: string; // base64 or path
  kvkkAccepted: boolean;
  explicitConsentAccepted: boolean;
  isTalpaMember?: boolean;
  status: ApplicationStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalApplications: number;
  kokpitCount: number;
  kabinCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  talpaMemberCount: number;
}

export interface EmailTemplate {
  subject: string;
  body: string; // Plain text or HTML template with variables like {{NAME}}, {{PLATE}}, {{REF_CODE}}, {{ROLE}}, etc.
}

export interface EmailSettings {
  adminNotificationEmail: string;
  applicantConfirmationTemplate: EmailTemplate;
  adminNotificationTemplate: EmailTemplate;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassConfigured: boolean; // boolean flag for UI representation
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}