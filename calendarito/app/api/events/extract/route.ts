import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { incrementUsageCounters, logEventGeneration, logUpload, normalizeTokenUsage } from '@/lib/usage-tracking';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCurrentDateTool() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return {
    currentDate: `${year}-${month}-${day}`,
    currentYear: year,
  };
}

const extractedEventSchema = z.object({
  summary: z.string().min(1).describe('Short event title'),
  date: z.string().regex(DATE_REGEX).describe('Date in YYYY-MM-DD format'),
  allDay: z.boolean().nullable().describe('true if this is an all-day event, null if uncertain'),
  startTime: z.string().regex(TIME_REGEX).nullable().describe('Start time in HH:mm, null for all-day events'),
  endTime: z.string().regex(TIME_REGEX).nullable().describe('End time in HH:mm, null for all-day events'),
  timezone: z.string().nullable().describe('Timezone, for example America/Argentina/Buenos_Aires, or null'),
  description: z.string().nullable().describe('Optional description or null'),
  location: z.string().nullable().describe('Optional location or null'),
  invites: z.array(z.string().trim().toLowerCase().regex(EMAIL_REGEX))
    .describe('List of attendee emails explicitly mentioned as invitees for this event'),
  hasGoogleMeet: z.boolean()
    .describe('Whether this event should include a Google Meet link'),
});

const extractionSchema = z.object({
  events: z.array(extractedEventSchema),
  warnings: z.array(z.string()),
});

const EXTRACTION_MODEL = 'gpt-4o';

function estimateDataUrlSizeBytes(dataUrl: string): number | null {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return null;
  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

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
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Fallback: accept Bearer token from extension
    let userId = session?.user?.id ?? null;
    if (!userId) {
      const bearer = req.headers.get('authorization')?.replace('Bearer ', '');
      if (bearer) {
        const { data } = await supabase.auth.getUser(bearer);
        userId = data.user?.id ?? null;
      }
    }

    const body = await req.json();
    const { sourceType, inputText, fileData, mediaType, filename } = body as {
      sourceType: string;
      inputText?: string;
      fileData?: string;
      mediaType?: string;
      filename?: string;
    };

    if (!sourceType || (sourceType !== 'text' && sourceType !== 'file')) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    if (sourceType === 'text' && !inputText?.trim()) {
      return NextResponse.json({ error: 'Missing text input to analyze' }, { status: 400 });
    }

    if (sourceType === 'file' && !fileData) {
      return NextResponse.json({ error: 'Missing file input to analyze' }, { status: 400 });
    }

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'file'; data: string; mediaType: string; filename?: string }
      | { type: 'image'; image: string; mediaType?: string }
    > = [
      {
        type: 'text',
        text: 'Extract events from the provided information. If time is uncertain, return allDay=true with no times. Do not invent critical data. If an exact date is missing, add a warning and omit that event.',
      },
    ];

    if (sourceType === 'text') {
      userContent.push({ type: 'text', text: `User text:\n${inputText}` });
    }

    if (sourceType === 'file' && fileData && mediaType) {
      if (mediaType.startsWith('image/')) {
        userContent.push({ type: 'image', image: fileData, mediaType });
      } else {
        userContent.push({ type: 'file', data: fileData, mediaType, filename });
      }
    }

    const { currentDate, currentYear } = getCurrentDateTool();

    const result = await generateObject({
      model: openai(EXTRACTION_MODEL),
      system: `
You are Calendarito, a tool that extracts events from files, images, or natural-language text, and prepares them to be saved in Google Calendar.

Your only task is to transform the provided input into a valid event structure that matches the schema.
You must not answer or perform tasks outside this scope.

Language behavior:
- Preserve the language of the source information whenever possible.
- Do not translate unless explicitly requested.

Strict rules:
- Dates must use YYYY-MM-DD.
- Today's reference date is ${currentDate}.
- If an event mentions a date without year, assume year ${currentYear}.
- Resolve relative expressions (e.g. "this Wednesday", "tomorrow", "next week") using the reference date above.
- Times must use HH:mm (24-hour format).
- If time is ambiguous or unclear, set allDay=true and set startTime/endTime/timezone to null.
- If an exact date is missing, omit that event and add a warning.
- Do not invent critical data (date, time, location, or attendees).
- If attendee emails are explicitly mentioned as part of the meeting/event, return them under "invites".
- If there are no explicit attendee emails for an event, return "invites": [].
- Always return "hasGoogleMeet" for every event.
- Set hasGoogleMeet=true when the source explicitly indicates a meeting/call/video call/meetup online intent.
- Treat wording such as "reunion/reunión", "meeting", "call", "meet", "videollamada", "zoom", "google meet", "gmeet", "huddle", or similar slang as meeting intent unless context clearly indicates in-person only.
- Set hasGoogleMeet=false when in-person context is explicit or there is no clear remote-meeting intent.
`,
      messages: [{ role: 'user', content: userContent }],
      schema: extractionSchema,
    });

    const normalizedObject = {
      ...result.object,
      events: result.object.events.map((event) => {
        const invites = normalizeInviteEmails(event.invites);
        return {
          ...event,
          invites,
          hasGoogleMeet: event.hasGoogleMeet === true,
        };
      }),
    };

    if (userId) {
      const source = sourceType === 'text' ? 'text' : mediaType?.startsWith('image/') ? 'image' : 'file';
      const fileSize = fileData ? estimateDataUrlSizeBytes(fileData) : null;
      const usage = normalizeTokenUsage(result.usage);

      if (source !== 'text') {
        await logUpload(supabase, {
          userId,
          uploadType: source,
          fileName: filename ?? null,
          mimeType: mediaType ?? null,
          sizeBytes: fileSize,
        });
      }

      await logEventGeneration(supabase, {
        userId,
        sourceType: source,
        model: EXTRACTION_MODEL,
        inputText: sourceType === 'text' ? inputText ?? null : null,
        inputFileName: filename ?? null,
        inputFileMime: mediaType ?? null,
        inputFileSizeBytes: fileSize,
        outputJson: normalizedObject,
        warnings: normalizedObject.warnings,
        status: 'success',
        providerUsageRaw: result.usage,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      });

      await incrementUsageCounters(supabase, userId, {
        textRequests: source === 'text' ? 1 : 0,
        fileUploads: source === 'file' ? 1 : 0,
        imageUploads: source === 'image' ? 1 : 0,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      });
    }

    return NextResponse.json(normalizedObject);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error extracting events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
