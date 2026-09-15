import nodemailer from 'nodemailer';
import { ApplicationRecord } from '@/types';
import { getEmailSettings } from '@/lib/storage';
import { formatTurkishDate } from '@/lib/tckn';
import { getPaymentSummary } from '@/lib/payment';

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
  const startDateText = app.startDateOption === 'next_month' ? 'Önümüzdeki Ay Başında' : 'Hemen Başlat';
  const monthlyFeeText = `${app.monthlyFee?.toLocaleString('tr-TR') || (app.role === 'kokpit' ? '2.250' : '2.500')} TL / ay`;
  const paymentInfo = getPaymentSummary(app);

  return template
    .replace(/\{\{PAYMENT_INFO\}\}/g, paymentInfo)
    .replace(/\{\{NAME\}\}/g, app.name || '')
    .replace(/\{\{PLATE\}\}/g, app.plate || '')
    .replace(/\{\{REF_CODE\}\}/g, app.referenceCode || '')
    .replace(/\{\{TC\}\}/g, app.tc || '')
    .replace(/\{\{ROLE\}\}/g, app.role || '')
    .replace(/\{\{ROLE_TITLE\}\}/g, roleTitle)
    .replace(/\{\{EMAIL\}\}/g, app.email || '')
    .replace(/\{\{PHONE\}\}/g, app.phone || '')
    .replace(/\{\{TALPA_STATUS\}\}/g, talpaStatus)
    .replace(/\{\{START_DATE\}\}/g, startDateText)
    .replace(/\{\{MONTHLY_FEE\}\}/g, monthlyFeeText)
    .replace(/\{\{DATE\}\}/g, formattedDate);
}

function createImageAttachment(dataUrl: string | undefined, filename: string) {
  if (!dataUrl?.startsWith('data:image/')) return undefined;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return undefined;

  const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
  return {
    filename: `${filename}.${extension}`,
    content: Buffer.from(match[2], 'base64'),
    contentType: match[1]
  };
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
    const recipient = settings.adminNotificationEmail?.includes('@')
      ? settings.adminNotificationEmail
      : (process.env.ADMIN_NOTIFICATION_EMAIL || 'talpa@talpa.org');
    const transporter = createTransporter();
    const user = process.env.SMTP_USER || 'talpa@talpa.org';

    const subject = replacePlaceholders(settings.adminNotificationTemplate.subject, app);
    const textBody = replacePlaceholders(settings.adminNotificationTemplate.body, app);
    const ruhsatAttachment = createImageAttachment(app.ruhsatImage, `ruhsat-${app.referenceCode}`);

    await transporter.sendMail({
      from: `"TALPA SAW Otopark Portalı" <${user}>`,
      to: recipient,
      subject,
      text: textBody,
      attachments: ruhsatAttachment ? [ruhsatAttachment] : undefined
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
