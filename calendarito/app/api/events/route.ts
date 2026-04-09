import { notifyAdmin } from '@/lib/email';
import { getOAuthClient, nextDay } from '@/lib/google';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { incrementUsageCounters } from '@/lib/usage-tracking';
import { firstEventTemplate } from '@/templates/first-event';
import { google } from 'googleapis';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

interface EventRow {
  summary?: string;
  name?: string;
  topic?: string;
  date: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  description?: string;
  location?: string;
  invites?: string[];
  hasGoogleMeet?: boolean;
  colorId?: string;
  reminderMinutes?: number;
}

interface EventsPayload {
  events: EventRow[];
  calendarId: string;
  colorId: string;
  notifyDays: number;
  notifyHour: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInviteEmails(emails: string[] | null | undefined): string[] {
  if (!emails?.length) return [];
  const unique = new Set<string>();
  for (const email of emails) {
    const normalized = email.trim().toLowerCase();
    if (EMAIL_REGEX.test(normalized)) unique.add(normalized);
  }
  return Array.from(unique);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Fallback: accept provider_token from extension via header
  const providerToken = session?.provider_token ?? req.headers.get('x-provider-token');

  if (!providerToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: EventsPayload = await req.json();
  const { events, calendarId, colorId, notifyDays, notifyHour } = body;

  if (!events?.length || !calendarId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const notifyMinutes = notifyDays * 24 * 60 - notifyHour * 60;

  try {
    const client = getOAuthClient();
    client.setCredentials({ access_token: providerToken });
    const calendar = google.calendar({ version: 'v3', auth: client });

    const created = [];
    for (const row of events) {
      const summary =
        row.summary?.trim() ||
        `${row.topic ?? ''}${row.topic && row.name ? ' - ' : ''}${row.name ?? ''}`.trim() ||
        'Untitled event';
      const inviteEmails = normalizeInviteEmails(row.invites);
      const isTimed = row.allDay === false && Boolean(row.startTime);
      const eventColorId = row.colorId ?? colorId;
      const reminderValue = row.reminderMinutes ?? notifyMinutes;
      const shouldCreateMeetLink = row.hasGoogleMeet === true;

      let start: { date?: string; dateTime?: string; timeZone?: string };
      let end: { date?: string; dateTime?: string; timeZone?: string };

      if (isTimed && row.startTime) {
        const endTime = row.endTime ?? row.startTime;
        const tz = row.timezone ?? 'UTC';
        start = { dateTime: `${row.date}T${row.startTime}:00`, timeZone: tz };
        end = { dateTime: `${row.date}T${endTime}:00`, timeZone: tz };
      } else {
        start = { date: row.date };
        end = { date: nextDay(row.date) };
      }

      const event = {
        summary,
        colorId: eventColorId,
        start,
        end,
        ...(row.description ? { description: row.description } : {}),
        ...(row.location ? { location: row.location } : {}),
        ...(inviteEmails.length > 0
          ? { attendees: inviteEmails.map((email) => ({ email })) }
          : {}),
        ...(shouldCreateMeetLink
          ? {
              conferenceData: {
                createRequest: {
                  requestId: crypto.randomUUID(),
                  conferenceSolutionKey: { type: 'hangoutsMeet' as const },
                },
              },
            }
          : {}),
        reminders: { useDefault: false, overrides: [{ method: 'email', minutes: reminderValue }] },
      };
      const res = await calendar.events.insert({
        calendarId,
        requestBody: event,
        ...(shouldCreateMeetLink ? { conferenceDataVersion: 1 } : {}),
      });
      const inserted = (res as { data: { htmlLink?: string } }).data;
      created.push({ summary: event.summary, date: row.date, link: inserted.htmlLink });
    }

    const userId = session?.user.id ?? null;
    const userEmail = session?.user.email ?? 'unknown';
    const snapshot = [...created];

    after(async () => {
      if (!userId) return;

      const supabaseBg = await createSupabaseServerClient();
      const { data: prevCounters } = await supabaseBg
        .from('usage_counters')
        .select('events_created_count')
        .eq('user_id', userId)
        .maybeSingle();

      await incrementUsageCounters(supabaseBg, userId, { eventsCreated: snapshot.length });

      const isFirstBatch = !prevCounters || prevCounters.events_created_count === 0;
      if (isFirstBatch && snapshot.length > 0) {
        const firstEvent = snapshot[0];
        const { subject, html } = firstEventTemplate({
          userEmail,
          eventSummary: firstEvent.summary,
          eventDate: firstEvent.date,
          calendarId,
          eventCount: snapshot.length,
        });
        await notifyAdmin(subject, html).catch((err) =>
          console.error('[events] Failed to send first-event email:', err)
        );
      }
    });

    return NextResponse.json({ created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
