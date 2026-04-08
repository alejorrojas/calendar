import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
  summary: z.string().min(1).describe('Título corto del evento'),
  date: z.string().regex(DATE_REGEX).describe('Fecha en formato YYYY-MM-DD'),
  allDay: z.boolean().nullable().describe('true si es evento de día completo, null si no hay certeza'),
  startTime: z.string().regex(TIME_REGEX).nullable().describe('Hora de inicio en HH:mm, null si es allDay'),
  endTime: z.string().regex(TIME_REGEX).nullable().describe('Hora de fin en HH:mm, null si es allDay'),
  timezone: z.string().nullable().describe('Timezone, por ejemplo America/Argentina/Buenos_Aires, o null'),
  description: z.string().nullable().describe('Descripción opcional o null'),
  location: z.string().nullable().describe('Ubicación opcional o null'),
});

const extractionSchema = z.object({
  events: z.array(extractedEventSchema),
  warnings: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceType, inputText, fileData, mediaType, filename } = body as {
      sourceType: string;
      inputText?: string;
      fileData?: string;
      mediaType?: string;
      filename?: string;
    };

    if (!sourceType || (sourceType !== 'text' && sourceType !== 'file')) {
      return NextResponse.json({ error: 'sourceType inválido' }, { status: 400 });
    }

    if (sourceType === 'text' && !inputText?.trim()) {
      return NextResponse.json({ error: 'Falta texto para analizar' }, { status: 400 });
    }

    if (sourceType === 'file' && !fileData) {
      return NextResponse.json({ error: 'Falta archivo para analizar' }, { status: 400 });
    }

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'file'; data: string; mediaType: string; filename?: string }
      | { type: 'image'; image: string; mediaType?: string }
    > = [
      {
        type: 'text',
        text: 'Extraé eventos desde la información recibida. Si no hay certeza en hora, devolvé allDay=true y sin horas. No inventes datos críticos. Si falta fecha exacta, agregá warning y omití ese evento.',
      },
    ];

    if (sourceType === 'text') {
      userContent.push({ type: 'text', text: `Texto del usuario:\n${inputText}` });
    }

    if (sourceType === 'file' && fileData && mediaType) {
      if (mediaType.startsWith('image/')) {
        userContent.push({ type: 'image', image: fileData, mediaType });
      } else {
        userContent.push({ type: 'file', data: fileData, mediaType, filename });
      }
    }

    const { currentDate, currentYear } = getCurrentDateTool();

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      system: `
You are Calendarito, an AI tool that extracts events from files, images, or natural-language text, and prepares them to be saved in Google Calendar.

Your only task is to transform the provided input into a valid event structure that matches the schema.
You must not answer or perform tasks outside this scope.

Language behavior:
- Preserve the language of the source information whenever possible.
- Do not translate unless explicitly requested.

Strict rules:
- Dates must use YYYY-MM-DD.
- Today's reference date is ${currentDate}.
- If an event mentions a date without year, assume year ${currentYear}.
- Resolve relative expressions (e.g. "este miércoles", "mañana", "la semana que viene") using the reference date above.
- Times must use HH:mm (24-hour format).
- If time is ambiguous or unclear, set allDay=true and set startTime/endTime/timezone to null.
- If an exact date is missing, omit that event and add a warning.
- Do not invent critical data (date, time, location, or attendees).
`,
      messages: [{ role: 'user', content: userContent }],
      schema: extractionSchema,
    });

    return NextResponse.json(object);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error extrayendo eventos con IA';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
