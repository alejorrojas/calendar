import { getOAuthClient, nextDay } from '@/lib/google';
import { google } from 'googleapis';
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

export async function POST(req: NextRequest) {
  const tokenCookie = req.cookies.get('g_token');
  if (!tokenCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: EventsPayload = await req.json();
  const { events, calendarId, colorId, notifyDays, notifyHour } = body;

  if (!events?.length || !calendarId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // minutes before midnight of event day = X days before at Y hour
  const notifyMinutes = notifyDays * 24 * 60 - notifyHour * 60;

  try {
    const client = getOAuthClient();
    client.setCredentials(JSON.parse(tokenCookie.value));
    const calendar = google.calendar({ version: 'v3', auth: client });

    const created = [];
    for (const row of events) {
      const summary =
        row.summary?.trim() ||
        `${row.topic ?? ''}${row.topic && row.name ? ' - ' : ''}${row.name ?? ''}`.trim() ||
        'Evento sin título';
      const isTimed = row.allDay === false && Boolean(row.startTime);
      const eventColorId = row.colorId ?? colorId;
      const reminderValue = row.reminderMinutes ?? notifyMinutes;

      let start: { date?: string; dateTime?: string; timeZone?: string };
      let end: { date?: string; dateTime?: string; timeZone?: string };

      if (isTimed && row.startTime) {
        const endTime = row.endTime ?? row.startTime;
        start = {
          dateTime: `${row.date}T${row.startTime}:00`,
          ...(row.timezone ? { timeZone: row.timezone } : {}),
        };
        end = {
          dateTime: `${row.date}T${endTime}:00`,
          ...(row.timezone ? { timeZone: row.timezone } : {}),
        };
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
        reminders: {
          useDefault: false,
          overrides: [{ method: 'email', minutes: reminderValue }],
        },
      };
      const res = await calendar.events.insert({ calendarId, requestBody: event });
      const inserted = (res as { data: { htmlLink?: string } }).data;
      created.push({ summary: event.summary, date: row.date, link: inserted.htmlLink });
    }

    return NextResponse.json({ created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
