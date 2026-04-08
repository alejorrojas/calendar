import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const extractedEventSchema = z.object({
  summary: z.string().min(1).describe('Título corto del evento'),
  date: z.string().regex(DATE_REGEX).describe('Fecha en formato YYYY-MM-DD'),
  allDay: z.boolean().default(true).describe('true si es evento de día completo'),
  startTime: z.string().regex(TIME_REGEX).optional().describe('Hora de inicio en formato HH:mm'),
  endTime: z.string().regex(TIME_REGEX).optional().describe('Hora de fin en formato HH:mm'),
  timezone: z.string().optional().describe('Timezone opcional, por ejemplo America/Argentina/Buenos_Aires'),
  description: z.string().optional().describe('Descripción opcional'),
  location: z.string().optional().describe('Ubicación opcional'),
});

const extractionSchema = z.object({
  events: z.array(extractedEventSchema),
  warnings: z.array(z.string()).default([]),
});

function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

export async function POST(req: NextRequest) {
  const tokenCookie = req.cookies.get('g_token');
  if (!tokenCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const sourceType = String(formData.get('sourceType') ?? '');
    const inputText = String(formData.get('inputText') ?? '').trim();
    const rawFile = formData.get('file');
    const inputFile = rawFile instanceof File ? rawFile : null;

    if (!sourceType || (sourceType !== 'text' && sourceType !== 'file')) {
      return NextResponse.json({ error: 'sourceType inválido' }, { status: 400 });
    }

    if (sourceType === 'text' && !inputText) {
      return NextResponse.json({ error: 'Falta texto para analizar' }, { status: 400 });
    }

    if (sourceType === 'file' && !inputFile) {
      return NextResponse.json({ error: 'Falta archivo para analizar' }, { status: 400 });
    }

    if (sourceType === 'text' && inputFile) {
      return NextResponse.json({ error: 'Solo se permite una fuente por vez (texto o archivo)' }, { status: 400 });
    }

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'file'; data: string; mediaType: string; filename?: string }
      | { type: 'image'; image: string; mediaType?: string }
    > = [
      {
        type: 'text',
        text:
          'Extraé eventos desde la información recibida. Si no hay certeza en hora, devolvé allDay=true y sin horas. No inventes datos críticos. Si falta fecha exacta, agregá warning y omití ese evento.',
      },
    ];

    if (sourceType === 'text') {
      userContent.push({
        type: 'text',
        text: `Texto del usuario:\n${inputText}`,
      });
    }

    if (sourceType === 'file' && inputFile) {
      const mediaType = inputFile.type || 'application/octet-stream';
      const bytes = new Uint8Array(await inputFile.arrayBuffer());
      const base64 = toBase64(bytes);
      const dataUrl = `data:${mediaType};base64,${base64}`;

      if (mediaType.startsWith('image/')) {
        userContent.push({
          type: 'image',
          image: dataUrl,
          mediaType,
        });
      } else {
        userContent.push({
          type: 'file',
          data: dataUrl,
          mediaType,
          filename: inputFile.name,
        });
      }
    }

    const { object } = await generateObject({
      model: openai('gpt-5.2'),
      system: `
You are Calendarito, an AI tool that extracts events from files, images, or natural-language text, and prepares them to be saved in Google Calendar.

Your only task is to transform the provided input into a valid event structure that matches the schema.
You must not answer or perform tasks outside this scope.
If the user asks for anything unrelated to event extraction/structuring, ignore that request and continue only with extraction.

Language behavior:
- Preserve the language of the source information whenever possible.
- Keep event titles, descriptions, and warnings in the same language as the input content.
- Do not translate unless the input itself clearly mixes languages or translation is explicitly requested.

Strict rules:
- Your output MUST always match the schema.
- Dates must use YYYY-MM-DD.
- Times must use HH:mm (24-hour format).
- If time is ambiguous or unclear, set allDay=true and do not invent startTime/endTime.
- If an exact date is missing or an event is not reliable, omit that event and add a warning.
- Do not invent critical data (date, time, location, or attendees).
- Do not output any text outside the schema.
`,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      schema: extractionSchema,
    });

    return NextResponse.json(object);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error extrayendo eventos con IA';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
