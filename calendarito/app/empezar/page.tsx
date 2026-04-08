'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const CalendarPreview = dynamic(() => import('./CalendarPreview'), { ssr: false });

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

const EVENTS_STORAGE_KEY = 'calendarito.extracted_events.v1';
const DRAFT_STORAGE_KEY = 'calendarito.extracted_draft.v1';
const GOOGLE_TOKEN_STORAGE_KEY = 'calendarito.google_provider_token.v1';

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

interface Calendar {
  id: string;
  name: string;
}

interface DraftState {
  sourceType: 'file' | 'text';
  inputText: string;
  sourceSummary: string;
  colorId: string;
  notifyDays: number;
  notifyHour: number;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed;

  const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s].+$/);
  if (datePrefixMatch && DATE_ONLY_REGEX.test(datePrefixMatch[1])) {
    return datePrefixMatch[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function eventLabel(event: EventRow): string {
  if (!event.allDay && event.startTime) {
    return `${event.date} ${event.startTime}${event.endTime ? `-${event.endTime}` : ''}`;
  }
  return event.date;
}

function StepCard({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="font-heading flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
          {num}
        </div>
        <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-[#0A0A0A]">{title}</p>
      </div>
      {children}
    </article>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props;
  return (
    <input
      {...restProps}
      className={`box-border w-full rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A] ${className ?? ''}`}
    />
  );
}

export default function EmpezarPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [supabaseAccessToken, setSupabaseAccessToken] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarId, setCalendarId] = useState('');
  const [creatingNewCalendar, setCreatingNewCalendar] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [extractError, setExtractError] = useState('');
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<'file' | 'text'>('file');
  const [inputText, setInputText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [sourceSummary, setSourceSummary] = useState('');
  const [colorId, setColorId] = useState('3');
  const [notifyDays, setNotifyDays] = useState(14);
  const [notifyHour, setNotifyHour] = useState(9);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: string; date: string }[] | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents) as unknown;
        if (!Array.isArray(parsed)) throw new Error('Invalid events payload');

        const normalizedEvents: EventRow[] = parsed.flatMap((item) => {
          if (!item || typeof item !== 'object') return [];
          const maybeEvent = item as Partial<EventRow>;
          const normalizedDate = normalizeDateOnly(maybeEvent.date);
          if (!normalizedDate || typeof maybeEvent.summary !== 'string' || !maybeEvent.summary.trim()) {
            return [];
          }

          return [{
            summary: maybeEvent.summary,
            date: normalizedDate,
            allDay: maybeEvent.allDay !== false,
            startTime: maybeEvent.startTime,
            endTime: maybeEvent.endTime,
            timezone: maybeEvent.timezone,
            description: maybeEvent.description,
            location: maybeEvent.location,
          }];
        });

        setEvents(normalizedEvents);
        window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(normalizedEvents));
      } catch {
        window.localStorage.removeItem(EVENTS_STORAGE_KEY);
      }
    }
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as DraftState;
        setSourceType(draft.sourceType ?? 'file');
        setInputText(draft.inputText ?? '');
        setSourceSummary(draft.sourceSummary ?? '');
        setColorId(draft.colorId ?? '3');
        setNotifyDays(draft.notifyDays ?? 14);
        setNotifyHour(draft.notifyHour ?? 9);
      } catch { window.localStorage.removeItem(DRAFT_STORAGE_KEY); }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ sourceType, inputText, sourceSummary, colorId, notifyDays, notifyHour }));
  }, [sourceType, inputText, sourceSummary, colorId, notifyDays, notifyHour]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const savedToken = window.localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY) ?? '';
    if (savedToken) setGoogleAccessToken(savedToken);

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      if (data.session?.access_token) setSupabaseAccessToken(data.session.access_token);
      const providerToken = data.session?.provider_token;
      if (providerToken) {
        setGoogleAccessToken(providerToken);
        window.localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, providerToken);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      setSupabaseAccessToken(session?.access_token ?? '');
      const providerToken = session?.provider_token;
      if (providerToken) {
        setGoogleAccessToken(providerToken);
        window.localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, providerToken);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchCalendars = useCallback(async () => {
    const res = await fetch('/api/calendars');
    const data = await res.json();
    if (data.calendars) {
      setCalendars(data.calendars);
      setCalendarId(data.calendars[0]?.id ?? '');
    }
  }, []);

  useEffect(() => {
    if (authenticated) void fetchCalendars();
  }, [authenticated, fetchCalendars]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function handleCreateCalendar() {
    if (!newCalendarName.trim()) return;
    setCreatingCalendar(true);
    try {
      const res = await fetch('/api/calendars/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCalendarName.trim(), googleAccessToken, supabaseAccessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error creating calendar');
      const created = data.calendar as Calendar;
      setCalendars(prev => [...prev, created]);
      setCalendarId(created.id);
      setCreatingNewCalendar(false);
      setNewCalendarName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating calendar');
    } finally { setCreatingCalendar(false); }
  }

  async function extractWithAI(body: object) {
    setExtracting(true);
    setExtractError('');
    setExtractWarnings([]);
    setEvents([]);
    try {
      const res = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not extract events');
      setEvents(data.events ?? []);
      setExtractWarnings(data.warnings ?? []);
      if (!data.events?.length) setExtractError('We could not find clear events in the provided source.');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Error processing source with AI');
    } finally { setExtracting(false); }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceSummary(file.name);
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    await extractWithAI({ sourceType: 'file', fileData: `data:${file.type};base64,${base64}`, mediaType: file.type, filename: file.name });
  }

  async function handleAnalyzeText() {
    if (!inputText.trim()) { setExtractError('Write something so we can extract events.'); return; }
    setSourceSummary('Natural language');
    await extractWithAI({ sourceType: 'text', inputText: inputText.trim() });
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, calendarId, colorId, notifyDays, notifyHour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.created);
      window.localStorage.removeItem(EVENTS_STORAGE_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating events');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">

      {/* Nav — same floating pill as home/como-funciona */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">Calendarito</span>
          </Link>
          <div className="flex items-center gap-2">
            {authenticated === false && (
              <Link
                href="/login?next=/empezar"
                className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
              >
                Login
              </Link>
            )}
            {authenticated === true && (
              <button
                onClick={handleLogout}
                className="font-heading cursor-pointer rounded-full border-[1.5px] border-[#DDD] bg-white px-4 py-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A]"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      </div>

      <section className="box-border flex flex-1 px-6 pb-14 pt-10">
        <div className="mx-auto flex w-full max-w-[1280px] gap-8">

          {/* ── Left column: form ── */}
          <div className="w-full max-w-[480px] shrink-0">

          {/* Errors / warnings */}
          {error && (
            <div className="mb-4 rounded-2xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">{error}</div>
          )}
          {extractError && (
            <div className="mb-4 rounded-2xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">{extractError}</div>
          )}
          {extractWarnings.length > 0 && (
            <div className="mb-4 rounded-2xl border border-[#FFE082] bg-[#FFF9E6] px-4 py-3 text-[13px] text-[#8A6D1A]">
              <p className="font-heading mb-1 text-sm font-semibold">Warnings</p>
              <ul className="space-y-0.5">
                {extractWarnings.map((w, i) => <li key={i}>— {w}</li>)}
              </ul>
            </div>
          )}

          {!result && (
            <div className="flex flex-col gap-3">

              {/* Step 1 */}
              <StepCard num={1} title="Event source">
                <div className="mb-3 flex gap-2">
                  {(['file', 'text'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSourceType(t)}
                      type="button"
                      className={`font-heading cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        sourceType === t ? 'bg-[#0A0A0A] text-white' : 'border border-[#DDD] bg-white text-[#555] hover:border-[#0A0A0A]'
                      }`}
                    >
                      {t === 'file' ? 'Upload file' : 'Write text'}
                    </button>
                  ))}
                </div>

                {sourceType === 'file' && (
                  <>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`cursor-pointer rounded-[14px] border-[1.5px] border-dashed p-5 text-center transition-colors ${
                        events.length > 0 && sourceSummary ? 'border-[#86EFAC] bg-[#F0FFF4]' : 'border-[#DDD] hover:border-[#0A0A0A]'
                      }`}
                    >
                      {extracting
                        ? <p className="font-heading text-sm font-bold text-[#0A0A0A]">Extracting events with AI...</p>
                        : events.length > 0 && sourceSummary
                        ? <p className="font-heading text-sm font-bold text-[#15803D]">✓ {events.length} events extracted from {sourceSummary}</p>
                        : <>
                            <p className="font-heading mb-1 text-sm font-semibold text-[#0A0A0A]">Choose a file, PDF, or image</p>
                            <p className="text-xs text-[#999]">Any format works.</p>
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
                      rows={5}
                      placeholder="Write your events in natural language..."
                      className="w-full resize-y rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A]"
                    />
                    <button
                      onClick={handleAnalyzeText}
                      type="button"
                      disabled={extracting}
                      className="font-heading mt-2 w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                    >
                      {extracting ? 'Extracting with AI...' : 'Extract events from text'}
                    </button>
                  </>
                )}

                {events.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#ECECEC]">
                    <div className="max-h-40 overflow-y-auto">
                      {events.map((event, i) => (
                        <div
                          key={i}
                          className={`flex justify-between px-3 py-[7px] ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} ${i < events.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
                        >
                          <span className="text-xs text-[#0A0A0A]">{event.summary}</span>
                          <span className="text-xs text-[#999]">{eventLabel(event)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </StepCard>

              {/* Steps 2–4 only when authenticated */}
              {authenticated && (
                <>
                  <StepCard num={2} title="Calendar">
                    {!creatingNewCalendar ? (
                      <>
                        <select
                          value={calendarId}
                          onChange={e => setCalendarId(e.target.value)}
                          className="w-full cursor-pointer appearance-none rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A]"
                        >
                          {calendars.map(c => <option key={c.id} value={c.id ?? ''}>{c.name}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setCreatingNewCalendar(true)}
                          className="font-heading mt-2 cursor-pointer text-xs font-semibold text-[#777] underline underline-offset-4 hover:text-[#0A0A0A]"
                        >
                          + Create new calendar
                        </button>
                      </>
                    ) : (
                      <>
                        <Input
                          type="text"
                          placeholder="New calendar name"
                          value={newCalendarName}
                          onChange={e => setNewCalendarName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && void handleCreateCalendar()}
                          autoFocus
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCreateCalendar()}
                            disabled={creatingCalendar || !newCalendarName.trim()}
                            className="font-heading flex-1 cursor-pointer rounded-full bg-[#0A0A0A] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                          >
                            {creatingCalendar ? 'Creating...' : 'Create'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setCreatingNewCalendar(false); setNewCalendarName(''); }}
                            className="font-heading cursor-pointer rounded-full border border-[#E0E0E0] px-4 py-2 text-xs font-semibold text-[#555] hover:border-[#0A0A0A]"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </StepCard>

                  <StepCard num={3} title="Event color">
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
                  </StepCard>

                  <StepCard num={4} title="Email reminder">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="mb-1.5 text-xs text-[#999]">Days before</p>
                        <Input type="number" min={1} value={notifyDays} onChange={e => setNotifyDays(Number(e.target.value))} />
                      </div>
                      <div className="flex-1">
                        <p className="mb-1.5 text-xs text-[#999]">Hour (0-23)</p>
                        <Input type="number" min={0} max={23} value={notifyHour} onChange={e => setNotifyHour(Number(e.target.value))} />
                      </div>
                    </div>
                  </StepCard>
                </>
              )}

              {/* CTA */}
              {!authenticated ? (
                <button
                  onClick={() => { window.location.href = '/login?next=/empezar'; }}
                  disabled={events.length === 0}
                  className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                >
                  Login to continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || extracting || events.length === 0 || !calendarId}
                  className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                >
                  {loading ? 'Creating in Google Calendar...' : 'Create in Google Calendar'}
                </button>
              )}
            </div>
          )}

          {/* Success state */}
          {result && (
            <article className="rounded-2xl border border-[#ECECEC] bg-white p-8 shadow-[0_4px_18px_rgba(0,0,0,0.04)] flex flex-col items-center gap-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E815]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading mb-1 text-[22px] font-extrabold tracking-[-0.02em] text-[#0A0A0A]">
                  {result.length} events created
                </h2>
                <p className="text-sm text-[#666]">They are now in your Google Calendar.</p>
              </div>
              <div className="w-full overflow-hidden rounded-xl border border-[#ECECEC]">
                <div className="max-h-[200px] overflow-y-auto">
                  {result.map((e, i) => (
                    <div
                      key={i}
                      className={`flex justify-between px-3 py-[7px] ${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'} ${i < result.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
                    >
                      <span className="text-xs text-[#0A0A0A]">{e.summary}</span>
                      <span className="text-xs text-[#999]">{e.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setResult(null); setEvents([]); setExtractWarnings([]); setExtractError('');
                  setSourceSummary(''); setInputText('');
                  window.localStorage.removeItem(EVENTS_STORAGE_KEY);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512]"
              >
                Add more events
              </button>
            </article>
          )}
          </div>{/* end left column */}

          {/* ── Right column: calendar preview ── */}
          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="sticky top-[84px]">
              <div className="mb-3 flex items-center gap-2">
                <p className="font-heading text-xs font-semibold tracking-[0.06em] text-[#999] uppercase">Preview</p>
                {events.length > 0 && (
                  <span className="rounded-full bg-[#E8E815] px-2 py-0.5 font-heading text-[10px] font-bold text-[#0A0A0A]">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#ECECEC] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                <CalendarPreview key={events.map(e => `${e.date}${e.summary}`).join('|')} events={events} colorId={colorId} />
              </div>
              {events.length === 0 && (
                <p className="mt-3 text-center text-xs text-[#BBB]">
                  Your events will appear here before creation
                </p>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
