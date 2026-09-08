import nodemailer from 'nodemailer';
import { ApplicationRecord } from '@/types';
import { getEmailSettings } from '@/lib/storage';
import { formatTurkishDate } from '@/lib/tckn';

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'talpa@talpa.org';
  const pass = process.env.SMTP_PASS || 'Dernek-123';

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // TLS / STARTTLS for port 587
    auth: {
      user,
      pass
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
}

function replacePlaceholders(template: string, app: ApplicationRecord): string {
  const roleTitle = app.role === 'kokpit' ? 'Kokpit Görevlisi (Pilot)' : 'Kabin Görevlisi';
  const talpaStatus = app.isTalpaMember ? 'Doğrulanmış TALPA Üyesi' : 'TALPA Üyesi Değil / İlgili Değil';
  const formattedDate = formatTurkishDate(app.createdAt);

  return template
    .replace(/\{\{NAME\}\}/g, app.name || '')
    .replace(/\{\{PLATE\}\}/g, app.plate || '')
    .replace(/\{\{REF_CODE\}\}/g, app.referenceCode || '')
    .replace(/\{\{TC\}\}/g, app.tc || '')
    .replace(/\{\{ROLE\}\}/g, app.role || '')
    .replace(/\{\{ROLE_TITLE\}\}/g, roleTitle)
    .replace(/\{\{EMAIL\}\}/g, app.email || '')
    .replace(/\{\{PHONE\}\}/g, app.phone || '')
    .replace(/\{\{TALPA_STATUS\}\}/g, talpaStatus)
    .replace(/\{\{DATE\}\}/g, formattedDate);
}

/**
 * Send confirmation email to applicant
 */
export async function sendApplicantConfirmationEmail(app: ApplicationRecord): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = getEmailSettings();
    const transporter = createTransporter();
    const user = process.env.SMTP_USER || 'talpa@talpa.org';

    const subject = replacePlaceholders(settings.applicantConfirmationTemplate.subject, app);
    const textBody = replacePlaceholders(settings.applicantConfirmationTemplate.body, app);

    await transporter.sendMail({
      from: `"TALPA SAW Otopark Portalı" <${user}>`,
      to: app.email,
      subject,
      text: textBody
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error sending applicant confirmation email:', err);
    return { success: false, error: err.message || 'E-posta gönderilemedi.' };
  }
}

/**
 * Send notification email to Admin recipient address
 */
export async function sendAdminNotificationEmail(app: ApplicationRecord): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = getEmailSettings();
    const recipient = settings.adminNotificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'talpa@talpa.org';
    const transporter = createTransporter();
    const user = process.env.SMTP_USER || 'talpa@talpa.org';

    const subject = replacePlaceholders(settings.adminNotificationTemplate.subject, app);
    const textBody = replacePlaceholders(settings.adminNotificationTemplate.body, app);

    await transporter.sendMail({
      from: `"TALPA SAW Otopark Portalı" <${user}>`,
      to: recipient,
      subject,
      text: textBody
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error sending admin notification email:', err);
    return { success: false, error: err.message || 'Admin e-postası gönderilemedi.' };
  }
}

/**
 * Send custom or forwarded email to any address
 */
export async function sendCustomEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const user = process.env.SMTP_USER || 'talpa@talpa.org';

    await transporter.sendMail({
      from: `"TALPA SAW Otopark Portalı" <${user}>`,
      to,
      subject,
      text: body
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error sending custom email:', err);
    return { success: false, error: err.message || 'E-posta iletilemedi.' };
  }
}
