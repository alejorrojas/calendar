'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface EventRow {
  summary: string;
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  description?: string;
  location?: string;
  colorId?: string;
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

interface PendingFileSource {
  fileData: string;
  mediaType: string;
  filename: string;
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

function StepCard({
  num,
  title,
  children,
  hoverable = true,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
  hoverable?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion || !hoverable ? undefined : { y: -2 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24 }}
      className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="font-heading flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
          {num}
        </div>
        <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-[#0A0A0A]">{title}</p>
      </div>
      {children}
    </motion.article>
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

function persistExtractedEvents(events: EventRow[]) {
  window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function clearLocalDraftState() {
  window.localStorage.removeItem(EVENTS_STORAGE_KEY);
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function toUserFriendlyErrorMessage(message: string, fallback: string): string {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return fallback;
  if (normalized.includes('file part media type') || normalized.includes('not supported')) {
    return 'This file format is not supported yet. Try PDF, PNG, JPG, or plain text.';
  }
  if (normalized.includes('unauthorized') || normalized.includes('401')) {
    return 'Please log in with Google to continue.';
  }
  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  if (normalized.includes('missing')) {
    return 'Some required information is missing. Please review and try again.';
  }

  return message;
}

export default function EmpezarPage() {
  const shouldReduceMotion = useReducedMotion();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [supabaseAccessToken, setSupabaseAccessToken] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarId, setCalendarId] = useState('');
  const [newCalendarName, setNewCalendarName] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [extractError, setExtractError] = useState('');
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<'file' | 'text'>('file');
  const [sourceSwitchDirection, setSourceSwitchDirection] = useState(1);
  const [inputText, setInputText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [sourceSummary, setSourceSummary] = useState('');
  const [lastExtractedSourceType, setLastExtractedSourceType] = useState<'file' | 'text' | null>(null);
  const [lastExtractedSourceSummary, setLastExtractedSourceSummary] = useState('');
  const [pendingFileSource, setPendingFileSource] = useState<PendingFileSource | null>(null);
  const [colorId, setColorId] = useState('3');
  const [notifyDays, setNotifyDays] = useState(14);
  const [notifyHour, setNotifyHour] = useState(9);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: string; date: string }[] | null>(null);
  const [error, setError] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [storageHydrated, setStorageHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedCalendar = calendars.find((calendar) => calendar.id === calendarId);
  const selectedCalendarLabel = selectedCalendar?.name ?? '';
  const calendarSelectValue = newCalendarName ? '__new__' : (selectedCalendar ? calendarId : '');
  const calendarSelectLabel = calendarSelectValue === '__new__' ? '+ Add new calendar...' : selectedCalendarLabel;

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
            colorId: typeof maybeEvent.colorId === 'string' ? maybeEvent.colorId : undefined,
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
    setStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;
    persistExtractedEvents(events);
  }, [events, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ sourceType, inputText, sourceSummary, colorId, notifyDays, notifyHour }));
  }, [sourceType, inputText, sourceSummary, colorId, notifyDays, notifyHour, storageHydrated]);

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

  async function extractWithAI(body: object, extractionSourceType: 'file' | 'text', extractionSourceSummary: string) {
    setExtracting(true);
    setExtractError('');
    setExtractWarnings([]);
    try {
      const res = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not extract events');
      const extractedEvents = (data.events ?? []) as EventRow[];
      setEvents(extractedEvents);
      persistExtractedEvents(extractedEvents);
      setExtractWarnings(data.warnings ?? []);
      setLastExtractedSourceType(extractionSourceType);
      setLastExtractedSourceSummary(extractionSourceSummary);
      if (!data.events?.length) setExtractError('We could not find clear events in the provided source.');
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Error processing source';
      setExtractError(toUserFriendlyErrorMessage(rawMessage, 'Error processing source'));
    } finally { setExtracting(false); }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setPendingFileSource(null);
      setSourceSummary('');
      setExtractError('File is too large. Please upload a file up to 5MB.');
      return;
    }

    setSourceSummary(file.name);
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    setPendingFileSource({
      fileData: `data:${file.type};base64,${base64}`,
      mediaType: file.type,
      filename: file.name,
    });
    setExtractError('');
    setExtractWarnings([]);
  }

  async function handleAnalyzeFile() {
    if (!pendingFileSource) {
      setExtractError('Choose a file first so we can extract events.');
      return;
    }

    await extractWithAI({
      sourceType: 'file',
      fileData: pendingFileSource.fileData,
      mediaType: pendingFileSource.mediaType,
      filename: pendingFileSource.filename,
    }, 'file', pendingFileSource.filename);
  }

  async function handleAnalyzeText() {
    if (!inputText.trim()) { setExtractError('Write something so we can extract events.'); return; }
    const summary = 'Natural language';
    setSourceSummary(summary);
    await extractWithAI({ sourceType: 'text', inputText: inputText.trim() }, 'text', summary);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let targetCalendarId = calendarId || calendars[0]?.id || '';

      if (newCalendarName.trim()) {
        const calRes = await fetch('/api/calendars/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCalendarName.trim(), googleAccessToken, supabaseAccessToken }),
        });
        const calData = await calRes.json();
        if (!calRes.ok) throw new Error(calData.error ?? 'Error creating calendar');
        const created = calData.calendar as Calendar;
        setCalendars(prev => [...prev, created]);
        targetCalendarId = created.id ?? '';
        setCalendarId(targetCalendarId);
        setNewCalendarName('');
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, calendarId: targetCalendarId, colorId, notifyDays, notifyHour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.created);
      clearLocalDraftState();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Error creating events';
      setError(toUserFriendlyErrorMessage(rawMessage, 'Error creating events'));
    } finally { setLoading(false); }
  }

  function updateEvent(index: number, patch: Partial<EventRow>) {
    setEvents((prev) => prev.map((event, i) => (i === index ? { ...event, ...patch } : event)));
  }

  function removeEvent(index: number) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
    setExpandedEvents((prev) => {
      const next = new Set<number>();
      for (const current of prev) {
        if (current < index) next.add(current);
        if (current > index) next.add(current - 1);
      }
      return next;
    });
  }

  function toggleEventExpanded(index: number) {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSourceTypeChange(nextSourceType: 'file' | 'text') {
    if (nextSourceType === sourceType) return;
    setSourceSwitchDirection(nextSourceType === 'text' ? 1 : -1);
    setSourceType(nextSourceType);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">

      {/* Nav — same floating pill as home/how-it-works */}
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
                href="/login?next=/get-started"
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
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 lg:flex-row">

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
              <StepCard num={1} title="Event source" hoverable={false}>
                <div className="mb-3 flex gap-2">
                  {(['file', 'text'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => handleSourceTypeChange(t)}
                      type="button"
                      className={`font-heading cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        sourceType === t ? 'bg-[#0A0A0A] text-white' : 'border border-[#DDD] bg-white text-[#555] hover:border-[#0A0A0A]'
                      }`}
                    >
                      {t === 'file' ? 'Upload file' : 'Type anything'}
                    </button>
                  ))}
                </div>

                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" initial={false} custom={sourceSwitchDirection}>
                    <motion.div
                      key={sourceType}
                      custom={sourceSwitchDirection}
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: sourceSwitchDirection > 0 ? 18 : -18 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: sourceSwitchDirection > 0 ? -18 : 18 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                    >
                      {sourceType === 'file' ? (
                        <>
                          <div
                            onClick={() => fileRef.current?.click()}
                            className="flex min-h-[162px] cursor-pointer flex-col items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-[#DDD] p-5 text-center transition-colors hover:border-[#0A0A0A]"
                          >
                            {extracting
                              ? <p className="font-heading text-sm font-bold text-[#0A0A0A]">Extracting events...</p>
                              : events.length > 0 && lastExtractedSourceType === 'file' && lastExtractedSourceSummary
                              ? <p className="font-heading text-sm font-bold text-[#0A0A0A]">✓ {events.length} events extracted from {lastExtractedSourceSummary}</p>
                              : <>
                                  <p className="font-heading mb-1 text-sm font-semibold text-[#0A0A0A]">Choose a file, PDF, or image</p>
                                  <p className="text-xs text-[#999]">Up to 5MB.</p>
                                </>
                            }
                          </div>
                          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                          <button
                            onClick={() => void handleAnalyzeFile()}
                            type="button"
                            disabled={extracting || !pendingFileSource}
                            className="font-heading mt-2 w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                          >
                            {extracting ? 'Extracting...' : 'Extract events from file'}
                          </button>
                        </>
                      ) : (
                        <>
                          <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            rows={5}
                            placeholder={`Math Exam next friday
Team sync tomorrow at 10am
Dinner with Valentina on May 12`}
                            className="h-[162px] w-full resize-none rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A]"
                          />
                          <button
                            onClick={handleAnalyzeText}
                            type="button"
                            disabled={extracting}
                            className="font-heading mt-2 w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                          >
                            {extracting ? 'Extracting...' : 'Extract events from text'}
                          </button>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {events.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#ECECEC]">
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F5F5F5]">
                      {events.map((event, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.005 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          className={`${i % 2 === 0 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleEventExpanded(i)}
                            aria-label="Toggle event editor"
                            className="group flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-[#0A0A0A]">{event.summary}</p>
                              <p className="text-[11px] text-[#888]">{eventLabel(event)}</p>
                            </div>
                            <div className="ml-3 flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${COLORS.find((c) => c.id === (event.colorId ?? colorId))?.swatchClass ?? 'bg-[#8e24aa]'}`}
                                aria-hidden="true"
                              />
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                                className="text-[#666] opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <path
                                  d="M12 20h9"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>

                          {expandedEvents.has(i) && (
                            <div className="space-y-2 px-3 pb-3">
                              <Input
                                value={event.summary}
                                onChange={(e) => updateEvent(i, { summary: e.target.value })}
                                className="px-3 py-2 text-xs"
                                placeholder="Event title"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  type="date"
                                  value={event.date}
                                  onChange={(e) => updateEvent(i, { date: e.target.value })}
                                  className="px-3 py-2 text-xs"
                                />
                                <Input
                                  type="time"
                                  value={event.startTime ?? ''}
                                  onChange={(e) => {
                                    const startTime = e.target.value || undefined;
                                    const endTime = event.endTime;
                                    updateEvent(i, { allDay: !(startTime || endTime), startTime, endTime });
                                  }}
                                  className="px-3 py-2 text-xs"
                                />
                                <Input
                                  type="time"
                                  value={event.endTime ?? ''}
                                  onChange={(e) => {
                                    const endTime = e.target.value || undefined;
                                    const startTime = event.startTime;
                                    updateEvent(i, { allDay: !(startTime || endTime), startTime, endTime });
                                  }}
                                  className="px-3 py-2 text-xs"
                                />
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {COLORS.map((c) => (
                                  <button
                                    key={`${i}-${c.id}`}
                                    type="button"
                                    onClick={() => updateEvent(i, { colorId: c.id })}
                                    title={c.name}
                                    className={`h-6 w-6 cursor-pointer rounded-full border-[2px] ${c.swatchClass} ${
                                      (event.colorId ?? colorId) === c.id ? 'border-[#0A0A0A]' : 'border-transparent'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="mt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeEvent(i)}
                                  aria-label="Discard event"
                                  title="Discard event"
                                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#B42318] transition-colors hover:bg-[#FEF3F2] hover:text-[#7A271A]"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 6v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </StepCard>

              {/* Steps 2–4 only when authenticated */}
              {authenticated && (
                <>
                  <StepCard num={2} title="Calendar">
                    <Select
                      value={calendarSelectValue}
                      onValueChange={val => {
                        if (val === '__new__') {
                          setCalendarId('');
                          setNewCalendarName('');
                        } else {
                          setCalendarId(val ?? '');
                          setNewCalendarName('');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] focus:border-[#0A0A0A] focus:ring-0 h-auto">
                        <SelectValue placeholder="Select a calendar">
                          {calendarSelectLabel || undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map(c => (
                          <SelectItem key={c.id} value={c.id ?? ''}>{c.name}</SelectItem>
                        ))}
                        <SelectItem value="__new__" className="text-[#555]">
                          + Add new calendar...
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {(newCalendarName !== '' || calendarId === '') && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="mt-2 overflow-hidden"
                        >
                          <Input
                            type="text"
                            placeholder="Add new calendar..."
                            value={newCalendarName}
                            onChange={e => setNewCalendarName(e.target.value)}
                            autoFocus
                          />
                          {newCalendarName.trim() && (
                            <p className="mt-1.5 text-[11px] text-[#888]">Will be created when you click &quot;Create in Google Calendar&quot;</p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </StepCard>
                </>
              )}

              {/* CTA */}
              {!authenticated ? (
                <div className="space-y-3">
                  <button
                    onClick={() => { window.location.href = '/login?next=/get-started'; }}
                    disabled={events.length === 0}
                    className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E5E5E5] disabled:text-[#AAA]"
                  >
                    Login to continue
                  </button>
                  <p className="text-center text-[13px] text-[#999]">
                    By logging in, you agree to our{' '}
                    <Link href="/privacy" className="text-[#0A0A0A] hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || extracting || events.length === 0 || !calendarId}
                  className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E8E815]/45 disabled:text-[#0A0A0A]/55"
                >
                  {loading
                    ? (newCalendarName.trim() ? 'Creating calendar & events...' : 'Creating in Google Calendar...')
                    : 'Create in Google Calendar'
                  }
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
          <div className="min-w-0 flex-1">
            <div className="lg:sticky lg:top-[84px]">
              <div className="rounded-2xl bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                <CalendarPreview key={events.map(e => `${e.date}${e.summary}`).join('|')} events={events} colorId={colorId} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <p className="font-heading text-xs font-semibold tracking-[0.06em] text-[#999] uppercase">Preview</p>
                {events.length > 0 && (
                  <span className="rounded-full bg-[#E8E815] px-2 py-0.5 font-heading text-[10px] font-bold text-[#0A0A0A]">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {events.length === 0 && (
                <p className="mt-3 text-center text-xs text-[#BBB]">
                  Your events will appear here before creation. This is only a preview, not your real calendar.
                </p>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
