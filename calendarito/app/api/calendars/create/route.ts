import { getOAuthClient } from '@/lib/google';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; googleAccessToken?: string; supabaseAccessToken?: string };

  if (!body.googleAccessToken || !body.supabaseAccessToken || !body.name?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(body.supabaseAccessToken);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getOAuthClient();
    client.setCredentials({ access_token: body.googleAccessToken });

    const calendar = google.calendar({ version: 'v3', auth: client });
    const res = await calendar.calendars.insert({
      requestBody: { summary: body.name.trim() },
    });

    return NextResponse.json({ calendar: { id: res.data.id, name: res.data.summary } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
