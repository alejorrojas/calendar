'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const COLORS = [
  { id: '1', name: 'Lavender', swatchClass: 'bg-[#7986cb]' },
  { id: '2', name: 'Sage', swatchClass: 'bg-[#33b679]' },
  { id: '3', name: 'Grape', swatchClass: 'bg-[#8e24aa]' },
  { id: '4', name: 'Flamingo', swatchClass: 'bg-[#e67c73]' },
  { id: '5', name: 'Banana', swatchClass: 'bg-[#f6c026]' },
  { id: '6', name: 'Tangerine', swatchClass: 'bg-[#f5511d]' },
  { id: '7', name: 'Peacock', swatchClass: 'bg-[#039be5]' },
  { id: '8', name: 'Blueberry', swatchClass: 'bg-[#3f51b5]' },
  { id: '9', name: 'Basil', swatchClass: 'bg-[#0b8043]' },
  { id: '10', name: 'Tomato', swatchClass: 'bg-[#d60000]' },
  { id: '11', name: 'Flamingo', swatchClass: 'bg-[#e67c73]' },
];

interface EventRow {
  summary: string;
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  description?: string;
  location?: string;
}

interface Calendar { id: string; name: string }

function eventLabel(event: EventRow): string {
  if (!event.allDay && event.startTime) {
    return `${event.date} ${event.startTime}${event.endTime ? `-${event.endTime}` : ''}`;
  }
  return event.date;
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 no-underline">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="font-heading text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">calendarito</span>
      <span className="rounded-full border border-[#DDD] px-[7px] py-px text-[10px] text-[#999]">beta</span>
    </Link>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="font-heading mb-2.5 text-xs font-semibold tracking-[0.06em] text-[#999] uppercase">{label}</p>
      {children}
    </div>
  );
}

function YellowBtn({ children, onClick, disabled = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA] disabled:hover:bg-[#E5E5E5]"
    >
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-heading w-full cursor-pointer rounded-full border-[1.5px] border-[#DDD] bg-transparent p-[13px] text-sm font-semibold text-[#555] transition-colors hover:border-[#0A0A0A]"
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props;

  return (
    <input
      {...restProps}
      className={`w-full box-border rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A] ${className ?? ''}`}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AppPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [calendars, setCalendars]   = useState<Calendar[]>([]);
  const [events, setEvents]         = useState<EventRow[]>([]);
  const [extractError, setExtractError] = useState('');
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<'file' | 'text'>('file');
  const [inputText, setInputText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [sourceSummary, setSourceSummary] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [colorId, setColorId]       = useState('3');
  const [notifyDays, setNotifyDays] = useState(14);
  const [notifyHour, setNotifyHour] = useState(9);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<{ summary: string; date: string }[] | null>(null);
  const [error, setError]           = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(d => {
      setAuthenticated(d.authenticated);
      if (d.authenticated) fetchCalendars();
    });
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError('Error al autenticar con Google. Intentá de nuevo.');
  }, []);

  async function fetchCalendars() {
    const res = await fetch('/api/calendars');
    const data = await res.json();
    if (data.calendars) { setCalendars(data.calendars); setCalendarId(data.calendars[0]?.id ?? ''); }
  }

  async function extractWithAI(formData: FormData) {
    setExtracting(true);
    setExtractError('');
    setExtractWarnings([]);
    setEvents([]);
    try {
      const res = await fetch('/api/events/extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo extraer eventos');
      setEvents(data.events ?? []);
      setExtractWarnings(data.warnings ?? []);
      if (!data.events?.length) {
        setExtractError('No encontramos eventos claros en la fuente enviada.');
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Error procesando la fuente con IA');
    } finally {
      setExtracting(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceSummary(file.name);
    const formData = new FormData();
    formData.append('sourceType', 'file');
    formData.append('file', file);
    await extractWithAI(formData);
  }

  async function handleAnalyzeText() {
    if (!inputText.trim()) {
      setExtractError('Escribí algo para poder extraer eventos.');
      return;
    }
    setSourceSummary('Texto libre');
    const formData = new FormData();
    formData.append('sourceType', 'text');
    formData.append('inputText', inputText.trim());
    await extractWithAI(formData);
  }

  async function handleSubmit() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, calendarId, colorId, notifyDays, notifyHour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear los eventos');
    } finally { setLoading(false); }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  if (authenticated === null) return null;
  if (!authenticated) { window.location.href = '/'; return null; }

  const cardClass = 'rounded-[20px] border border-[#EBEBEB] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06)]';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-app)] bg-[radial-gradient(circle,var(--dot)_1px,transparent_1px)] pt-[68px] [background-size:22px_22px]">

      {/* Top bar */}
      <div className="fixed top-0 right-0 left-0 z-40 mx-auto box-border flex w-full max-w-[600px] items-center justify-between bg-[var(--bg-app)] bg-[radial-gradient(circle,var(--dot)_1px,transparent_1px)] px-8 pt-5 pb-0 [background-size:22px_22px]">
        <Logo />
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-full border-[1.5px] border-[#DDD] bg-transparent px-4 py-1.5 text-[13px] text-[#777] transition-colors hover:border-[#0A0A0A]"
        >
          Cerrar sesión →
        </button>
      </div>

      {/* Content */}
      <div className="box-border flex flex-1 justify-center px-6 pb-12">
        <div className="w-full max-w-[520px]">

          {error && (
            <div className="mb-4 rounded-xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">
              {error}
            </div>
          )}
          {extractError && (
            <div className="mb-4 rounded-xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">
              {extractError}
            </div>
          )}
          {extractWarnings.length > 0 && (
            <div className="mb-4 rounded-xl border border-[#FFE082] bg-[#FFF9E6] px-4 py-3 text-[13px] text-[#8A6D1A]">
              <p className="font-heading mb-1 text-sm font-semibold">Advertencias de extracción</p>
              <ul className="space-y-0.5">
                {extractWarnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>- {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Form ── */}
          {!result && (
            <div className="flex flex-col gap-3">

              {/* Fuente de eventos */}
              <div className={cardClass}>
                <Section label="1 · Fuente de eventos">
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => setSourceType('file')}
                      type="button"
                      className={`font-heading cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        sourceType === 'file'
                          ? 'bg-[#0A0A0A] text-white'
                          : 'border border-[#DDD] bg-white text-[#555] hover:border-[#0A0A0A]'
                      }`}
                    >
                      Subir archivo
                    </button>
                    <button
                      onClick={() => setSourceType('text')}
                      type="button"
                      className={`font-heading cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        sourceType === 'text'
                          ? 'bg-[#0A0A0A] text-white'
                          : 'border border-[#DDD] bg-white text-[#555] hover:border-[#0A0A0A]'
                      }`}
                    >
                      Escribir texto
                    </button>
                  </div>

                  {sourceType === 'file' && (
                    <>
                      <div
                        onClick={() => fileRef.current?.click()}
                        className={`cursor-pointer rounded-[14px] border-[1.5px] border-dashed p-5 text-center transition-colors ${
                          events.length > 0 && sourceSummary
                            ? 'border-[#86EFAC] bg-[#F0FFF4]'
                            : 'border-[#DDD] hover:border-[#0A0A0A]'
                        }`}
                      >
                        {extracting
                          ? <p className="font-heading text-sm font-bold text-[#0A0A0A]">Extrayendo eventos con IA...</p>
                          : events.length > 0 && sourceSummary
                          ? <p className="font-heading text-sm font-bold text-[#15803D]">✓ {events.length} eventos extraídos de {sourceSummary}</p>
                          : <>
                              <p className="font-heading mb-1 text-sm font-semibold text-[#0A0A0A]">Elegir cualquier archivo</p>
                              <p className="text-xs text-[#999]">Soporta docs, texto, tablas e imágenes.</p>
                            </>
                        }
                      </div>
                      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                    </>
                  )}

                  {sourceType === 'text' && (
                    <>
                      <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        rows={6}
                        placeholder="Ejemplo: reunión con Juan el próximo martes a las 10, demo el 18/04, pago de servicio el 25..."
                        className="w-full resize-y rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A]"
                      />
                      <button
                        onClick={handleAnalyzeText}
                        type="button"
                        disabled={extracting}
                        className="font-heading mt-2 w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                      >
                        {extracting ? 'Extrayendo con IA...' : 'Extraer eventos desde texto'}
                      </button>
                    </>
                  )}

                  {events.length > 0 && (
                    <div className="mt-2.5 max-h-40 overflow-y-auto rounded-[10px] border border-[#F0F0F0]">
                      {events.map((e, i) => (
                        <div
                          key={i}
                          className={`flex justify-between px-3 py-[7px] ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} ${i < events.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
                        >
                          <span className="text-xs">{e.summary}</span>
                          <span className="text-xs text-[#999]">{eventLabel(e)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>

              {/* Calendar */}
              <div className={cardClass}>
                <Section label="2 · Calendario">
                  <select
                    value={calendarId}
                    onChange={e => setCalendarId(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A]"
                  >
                    {calendars.map(c => <option key={c.id} value={c.id ?? ''}>{c.name}</option>)}
                  </select>
                </Section>
              </div>

              {/* Color */}
              <div className={cardClass}>
                <Section label="3 · Color de los eventos">
                  <div className="flex flex-wrap gap-2.5">
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setColorId(c.id)}
                        title={c.name}
                        className={`h-8 w-8 cursor-pointer rounded-full border-[2.5px] transition-transform ${c.swatchClass} ${
                          colorId === c.id
                            ? 'scale-[1.15] border-[#0A0A0A] ring-[2.5px] ring-[#E8E815] ring-offset-1'
                            : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#999]">
                    {COLORS.find(c => c.id === colorId)?.name}
                  </p>
                </Section>
              </div>

              {/* Notification */}
              <div className={cardClass}>
                <Section label="4 · Notificación por email">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="mb-1.5 text-xs text-[#999]">¿Cuántos días antes?</p>
                      <Input type="number" min={1} value={notifyDays} onChange={e => setNotifyDays(Number(e.target.value))} />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1.5 text-xs text-[#999]">¿A qué hora? (0–23)</p>
                      <Input type="number" min={0} max={23} value={notifyHour} onChange={e => setNotifyHour(Number(e.target.value))} />
                    </div>
                  </div>
                </Section>
              </div>

              <YellowBtn onClick={handleSubmit} disabled={loading || extracting || events.length === 0 || !calendarId}>
                {loading ? 'Creando eventos...' : `Crear ${events.length > 0 ? events.length : ''} eventos →`}
              </YellowBtn>
            </div>
          )}

          {/* ── Success ── */}
          {result && (
            <div className={`${cardClass} flex flex-col items-center gap-5 px-7 py-10 text-center`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E815]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading mb-1 text-[22px] font-extrabold tracking-[-0.02em]">
                  {result.length} eventos creados
                </h2>
                <p className="text-sm text-[#888]">Ya aparecen en tu Google Calendar</p>
              </div>
              <div className="max-h-[200px] w-full overflow-y-auto rounded-xl border border-[#EBEBEB]">
                {result.map((e, i) => (
                  <div
                    key={i}
                    className={`flex justify-between px-3 py-[7px] ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} ${i < result.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
                  >
                    <span className="text-xs">{e.summary}</span>
                    <span className="text-xs text-[#999]">{e.date}</span>
                  </div>
                ))}
              </div>
              <OutlineBtn onClick={() => {
                setResult(null);
                setEvents([]);
                setExtractWarnings([]);
                setExtractError('');
                setSourceSummary('');
                setInputText('');
                if (fileRef.current) fileRef.current.value = '';
              }}>
                Cargar más eventos
              </OutlineBtn>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
