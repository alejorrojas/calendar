import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Calendarito <notifications@calendarito.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export async function sendEmail(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function notifyAdmin(subject: string, html: string) {
  return sendEmail(ADMIN_EMAIL, subject, html);
}
