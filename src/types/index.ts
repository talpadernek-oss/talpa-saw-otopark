export type RoleType = 'kokpit' | 'kabin';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type StartDateOption = 'next_month' | 'immediate';

export interface ApplicationRecord {
  id: string;
  referenceCode: string;
  role: RoleType;
  tc: string;
  name: string;
  email: string;
  phone: string;
  plate: string;
  startDateOption: StartDateOption;
  monthlyFee: number; // 2250 TL for Kokpit/TALPA, 2500 TL for Kabin
  paymentCardLast4?: string;
  paymentCardEncrypted?: string; // AES-256-GCM ciphertext of the full card number (kabin only); never sent to the client list
  paymentCardholderName?: string;
  paymentExpiryMonth?: string;
  paymentExpiryYear?: string;
  paymentConsentAccepted?: boolean;
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
  body: string;
}

export interface EmailSettings {
  adminNotificationEmail: string;
  applicantConfirmationTemplate: EmailTemplate;
  adminNotificationTemplate: EmailTemplate;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassConfigured: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}