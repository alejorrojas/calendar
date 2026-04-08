const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const COLORS = [
  { id: '1',  name: 'Lavender'  },
  { id: '2',  name: 'Sage'      },
  { id: '3',  name: 'Grape'     },
  { id: '4',  name: 'Flamingo'  },
  { id: '5',  name: 'Banana'    },
  { id: '6',  name: 'Tangerine' },
  { id: '7',  name: 'Peacock'   },
  { id: '8',  name: 'Blueberry' },
  { id: '9',  name: 'Basil'     },
  { id: '10', name: 'Tomato'    },
  { id: '11', name: 'Flamingo'  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolvePath(input) {
  // Strip surrounding quotes (single or double) and trim whitespace
  let p = input.trim().replace(/^['"]|['"]$/g, '').trim();
  // Normalize Windows backslashes
  p = p.replace(/\\/g, '/');
  // Expand ~
  if (p.startsWith('~')) p = path.join(os.homedir(), p.slice(1));
  return path.resolve(p);
}

function nextDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  for (const col of ['name', 'topic', 'date']) {
    if (!headers.includes(col)) throw new Error(`El CSV debe tener la columna "${col}".`);
  }

  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim());
    const row = Object.fromEntries(headers.map((h, j) => [h, values[j] ?? '']));

    if (!row.name)  throw new Error(`Fila ${i + 2}: falta "name".`);
    if (!row.topic) throw new Error(`Fila ${i + 2}: falta "topic".`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date))
      throw new Error(`Fila ${i + 2}: "date" debe ser YYYY-MM-DD (ej: 2026-04-01).`);

    return { name: row.name, topic: row.topic, date: row.date };
  });
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function promptCSVPath(rl) {
  while (true) {
    const input = await ask(rl, 'Ruta del archivo CSV: ');
    const resolved = resolvePath(input);
    if (fs.existsSync(resolved)) return resolved;
    console.log(`  No se encontró: ${resolved}\n`);
  }
}

async function promptCalendarName(rl) {
  return ask(rl, 'Nombre del calendario de Google: ');
}

async function promptColor(rl) {
  console.log('\nColores disponibles:');
  COLORS.forEach(c => console.log(`  ${c.id.padStart(2)}. ${c.name}`));
  console.log('');

  while (true) {
    const input = await ask(rl, 'Número de color [3 = Grape]: ');
    const val = input === '' ? '3' : input;
    const color = COLORS.find(c => c.id === val);
    if (color) return color;
    console.log(`  Opción inválida. Elegí un número entre 1 y 11.\n`);
  }
}

async function promptNotification(rl) {
  let days;
  while (true) {
    const input = await ask(rl, '\n¿Cuántos días antes querés que te notifiquen? [Enter = 14]: ');
    if (input === '') { days = 14; break; }
    const val = parseInt(input);
    if (!isNaN(val) && val > 0) { days = val; break; }
    console.log('  Ingresá un número mayor a 0.');
  }

  let hour;
  while (true) {
    const input = await ask(rl, '¿A qué hora? (0-23) [Enter = 9]: ');
    if (input === '') { hour = 9; break; }
    const val = parseInt(input);
    if (!isNaN(val) && val >= 0 && val <= 23) { hour = val; break; }
    console.log('  Ingresá un número entre 0 y 23.');
  }

  return { days, hour };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authorize(rl) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
  console.log('\nAbre esta URL en tu navegador y autoriza el acceso:\n');
  console.log(authUrl);
  console.log('');

  const code = await ask(rl, 'Pega aquí el código de autorización: ');
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token guardado.\n');
  return oAuth2Client;
}

async function getCalendarId(calendar, name) {
  const res = await calendar.calendarList.list();
  const cal = res.data.items.find(c => c.summary === name);
  if (!cal) throw new Error(`No se encontró el calendario "${name}". Verificá que existe en tu cuenta.`);
  return cal.id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const rl = createRL();

  console.log('=== Google Calendar Event Creator ===\n');

  const csvPath      = await promptCSVPath(rl);
  const calendarName = await promptCalendarName(rl);
  const color        = await promptColor(rl);
  const notification = await promptNotification(rl);

  // minutes before midnight of the event day that equals X days before at Y hour
  const notifyMinutes = notification.days * 24 * 60 - notification.hour * 60;

  let rows;
  try {
    rows = parseCSV(csvPath);
  } catch (err) {
    console.error(`\nError en el CSV: ${err.message}`);
    rl.close();
    process.exit(1);
  }

  console.log(`\n${rows.length} eventos encontrados:`);
  rows.forEach(r => console.log(`  - ${r.topic} - ${r.name} (${r.date})`));
  console.log('');

  const confirm = await ask(rl, '¿Crear estos eventos? (s/n): ');
  if (confirm.toLowerCase() !== 's') {
    console.log('Cancelado.');
    rl.close();
    return;
  }

  const auth = await authorize(rl);
  rl.close();

  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = await getCalendarId(calendar, calendarName);

  console.log(`\nCreando eventos en "${calendarName}"...\n`);

  for (const row of rows) {
    const event = {
      summary: `${row.topic} - ${row.name}`,
      colorId: color.id,
      start: { date: row.date },
      end:   { date: nextDay(row.date) },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'email', minutes: notifyMinutes }],
      },
    };
    await calendar.events.insert({ calendarId, resource: event });
    console.log(`✓ ${event.summary} (${row.date})`);
  }

  console.log(`\nListo. ${rows.length} eventos creados.`);
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
