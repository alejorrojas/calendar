import { notifyAdmin } from '@/lib/email';
import { newUserTemplate } from '@/templates/new-user';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

// Supabase Database Webhook — fires on auth.users INSERT
export async function POST(req: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await req.json();

  // Only handle INSERT events on auth.users
  if (body.type !== 'INSERT' || body.schema !== 'auth' || body.table !== 'users') {
    return NextResponse.json({ ok: true });
  }

  const { email, created_at } = body.record ?? {};
  if (!email) return NextResponse.json({ ok: true });

  after(async () => {
    const { subject, html } = newUserTemplate(email, created_at);
    await notifyAdmin(subject, html).catch((err) =>
      console.error('[webhook] Failed to send new-user email:', err)
    );
  });

  return NextResponse.json({ ok: true });
}
