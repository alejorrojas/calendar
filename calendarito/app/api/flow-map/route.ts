import { readFile } from 'node:fs/promises';

const FLOW_MAP_PATH =
  '/Users/alejorojas/.cursor/projects/Users-alejorojas-have-fun-calendar-calendarito/assets/mapa-0e1c2d91-942b-4649-beda-e3669f553977.png';

export async function GET() {
  try {
    const file = await readFile(FLOW_MAP_PATH);
    return new Response(file, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return Response.json({ error: 'No se pudo cargar el mapa del flujo' }, { status: 404 });
  }
}
