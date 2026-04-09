"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UnifiedSourceInput,
  type PendingFileSource,
} from "@/components/UnifiedSourceInput";

const CalendarPreview = dynamic(() => import("./CalendarPreview"), {
  ssr: false,
});

const COLORS = [
  { id: "1", name: "Lavender", swatchClass: "bg-[#7986cb]" },
  { id: "2", name: "Sage", swatchClass: "bg-[#33b679]" },
  { id: "3", name: "Grape", swatchClass: "bg-[#8e24aa]" },
  { id: "4", name: "Flamingo", swatchClass: "bg-[#e67c73]" },
  { id: "5", name: "Banana", swatchClass: "bg-[#f6c026]" },
  { id: "6", name: "Tangerine", swatchClass: "bg-[#f5511d]" },
  { id: "7", name: "Peacock", swatchClass: "bg-[#039be5]" },
  { id: "8", name: "Blueberry", swatchClass: "bg-[#3f51b5]" },
  { id: "9", name: "Basil", swatchClass: "bg-[#0b8043]" },
  { id: "10", name: "Tomato", swatchClass: "bg-[#d60000]" },
  { id: "11", name: "Flamingo", swatchClass: "bg-[#e67c73]" },
];

const EVENTS_STORAGE_KEY = "calendarito.extracted_events.v1";
const DRAFT_STORAGE_KEY = "calendarito.extracted_draft.v2";
const GOOGLE_TOKEN_STORAGE_KEY = "calendarito.google_provider_token.v1";
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
  invites?: string[];
  hasGoogleMeet?: boolean;
  colorId?: string;
}

interface Calendar {
  id: string;
  name: string;
}

interface DraftState {
  inputText: string;
  sourceSummary: string;
  colorId: string;
  notifyDays: number;
  notifyHour: number;
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInviteEmails(value: unknown): string[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n;\s]+/)
      : [];
  const unique = new Set<string>();
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const normalized = raw.trim().toLowerCase();
    if (EMAIL_REGEX.test(normalized)) unique.add(normalized);
  }
  return Array.from(unique);
}

function normalizeDateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
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
    return `${event.date} ${event.startTime}${event.endTime ? `-${event.endTime}` : ""}`;
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
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 24 }
      }
      className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="font-heading flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
          {num}
        </div>
        <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-[#0A0A0A]">
          {title}
        </p>
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
      className={`box-border w-full rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A] ${className ?? ""}`}
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
  if (
    normalized.includes("file part media type") ||
    normalized.includes("not supported")
  ) {
    return "This file format is not supported yet. Try PDF, PNG, JPG, or plain text.";
  }
  if (normalized.includes("unauthorized") || normalized.includes("401")) {
    return "Please log in with Google to continue.";
  }
  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch")
  ) {
    return "Network error. Please check your connection and try again.";
  }
  if (normalized.includes("missing")) {
    return "Some required information is missing. Please review and try again.";
  }

  return message;
}

export default function EmpezarPage() {
  const shouldReduceMotion = useReducedMotion();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [supabaseAccessToken, setSupabaseAccessToken] = useState("");
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarId, setCalendarId] = useState("");
  const [newCalendarName, setNewCalendarName] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [extractError, setExtractError] = useState("");
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [sourceSummary, setSourceSummary] = useState("");
  const [lastExtractedSourceSummary, setLastExtractedSourceSummary] =
    useState("");
  const [pendingFileSource, setPendingFileSource] =
    useState<PendingFileSource | null>(null);
  const [colorId, setColorId] = useState("7");
  const [notifyDays, setNotifyDays] = useState(14);
  const [notifyHour, setNotifyHour] = useState(9);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { summary: string; date: string }[] | null
  >(null);
  const [error, setError] = useState("");
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [inviteDraftByEvent, setInviteDraftByEvent] = useState<
    Record<number, string>
  >({});
  const [storageHydrated, setStorageHydrated] = useState(false);
  const selectedCalendar = calendars.find(
    (calendar) => calendar.id === calendarId,
  );
  const calendarLabel = (c: Calendar) =>
    c.id === userEmail ? `Default Calendar - ${userEmail}` : c.name;
  const selectedCalendarLabel = selectedCalendar
    ? calendarLabel(selectedCalendar)
    : "";
  const calendarSelectValue = newCalendarName
    ? "__new__"
    : selectedCalendar
      ? calendarId
      : "";
  const calendarSelectLabel =
    calendarSelectValue === "__new__"
      ? "+ Add new calendar..."
      : selectedCalendarLabel;

  useEffect(() => {
    const savedEvents = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (savedEvents) {
      try {
        const parsed = JSON.parse(savedEvents) as unknown;
        if (!Array.isArray(parsed)) throw new Error("Invalid events payload");

        const normalizedEvents: EventRow[] = parsed.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const maybeEvent = item as Partial<EventRow>;
          const normalizedDate = normalizeDateOnly(maybeEvent.date);
          if (
            !normalizedDate ||
            typeof maybeEvent.summary !== "string" ||
            !maybeEvent.summary.trim()
          ) {
            return [];
          }

          return [
            {
              summary: maybeEvent.summary,
              date: normalizedDate,
              allDay: maybeEvent.allDay !== false,
              startTime: maybeEvent.startTime,
              endTime: maybeEvent.endTime,
              timezone: maybeEvent.timezone,
              description: maybeEvent.description,
              location: maybeEvent.location,
              invites: normalizeInviteEmails(maybeEvent.invites),
              hasGoogleMeet: maybeEvent.hasGoogleMeet === true,
              colorId:
                typeof maybeEvent.colorId === "string"
                  ? maybeEvent.colorId
                  : undefined,
            },
          ];
        });

        setEvents(normalizedEvents);
        window.localStorage.setItem(
          EVENTS_STORAGE_KEY,
          JSON.stringify(normalizedEvents),
        );
      } catch {
        window.localStorage.removeItem(EVENTS_STORAGE_KEY);
      }
    }
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as DraftState;
        setInputText(draft.inputText ?? "");
        setSourceSummary(draft.sourceSummary ?? "");
        setColorId(draft.colorId ?? "7");
        setNotifyDays(draft.notifyDays ?? 14);
        setNotifyHour(draft.notifyHour ?? 9);
      } catch {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
    setStorageHydrated(true);
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;
    persistExtractedEvents(events);
  }, [events, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        inputText,
        sourceSummary,
        colorId,
        notifyDays,
        notifyHour,
      }),
    );
  }, [
    inputText,
    sourceSummary,
    colorId,
    notifyDays,
    notifyHour,
    storageHydrated,
  ]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const savedToken =
      window.localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY) ?? "";
    if (savedToken) setGoogleAccessToken(savedToken);

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
      if (data.session?.access_token)
        setSupabaseAccessToken(data.session.access_token);
      if (data.session?.user?.email) setUserEmail(data.session.user.email);
      const providerToken = data.session?.provider_token;
      if (providerToken) {
        setGoogleAccessToken(providerToken);
        window.localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, providerToken);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthenticated(Boolean(session));
        setSupabaseAccessToken(session?.access_token ?? "");
        if (session?.user?.email) setUserEmail(session.user.email);
        const providerToken = session?.provider_token;
        if (providerToken) {
          setGoogleAccessToken(providerToken);
          window.localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, providerToken);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchCalendars = useCallback(async () => {
    const res = await fetch("/api/calendars");
    const data = await res.json();
    if (data.calendars) {
      const all: Calendar[] = data.calendars;
      // Sort so the primary calendar (id === user email) appears first
      const sorted = [...all].sort((a, b) => {
        if (a.id === userEmail) return -1;
        if (b.id === userEmail) return 1;
        return 0;
      });
      setCalendars(sorted);
      const primary = sorted.find((c) => c.id === userEmail);
      setCalendarId(primary?.id ?? sorted[0]?.id ?? "");
    }
  }, [userEmail]);

  useEffect(() => {
    if (authenticated && userEmail) void fetchCalendars();
  }, [authenticated, userEmail, fetchCalendars]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function extractWithAI(
    body: object,
    _extractionSourceType: "file" | "text",
    extractionSourceSummary: string,
  ) {
    setExtracting(true);
    setExtractError("");
    setExtractWarnings([]);
    try {
      const res = await fetch("/api/events/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not extract events");
      const extractedEvents = (data.events ?? []).flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return [];
        const maybeEvent = item as Partial<EventRow>;
        const normalizedDate = normalizeDateOnly(maybeEvent.date);
        if (!normalizedDate || typeof maybeEvent.summary !== "string") return [];
        return [
          {
            summary: maybeEvent.summary,
            date: normalizedDate,
            allDay: maybeEvent.allDay !== false,
            startTime: maybeEvent.startTime,
            endTime: maybeEvent.endTime,
            timezone: maybeEvent.timezone,
            description: maybeEvent.description,
            location: maybeEvent.location,
            invites: normalizeInviteEmails(maybeEvent.invites),
            hasGoogleMeet: maybeEvent.hasGoogleMeet === true,
            colorId: maybeEvent.colorId,
          } satisfies EventRow,
        ];
      });
      setEvents(extractedEvents);
      setInviteDraftByEvent({});
      persistExtractedEvents(extractedEvents);
      setExtractWarnings(data.warnings ?? []);
      setLastExtractedSourceSummary(extractionSourceSummary);
      if (!data.events?.length)
        setExtractError(
          "We could not find clear events in the provided source.",
        );
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : "Error processing source";
      setExtractError(
        toUserFriendlyErrorMessage(rawMessage, "Error processing source"),
      );
    } finally {
      setExtracting(false);
    }
  }

  function handleFileAttached(source: PendingFileSource) {
    setPendingFileSource(source);
    setSourceSummary(source.filename);
    setExtractError("");
    setExtractWarnings([]);
  }

  function handleClearFile() {
    setPendingFileSource(null);
    setSourceSummary("");
  }

  async function handleExtract() {
    if (pendingFileSource) {
      await extractWithAI(
        {
          sourceType: "file",
          fileData: pendingFileSource.fileData,
          mediaType: pendingFileSource.mediaType,
          filename: pendingFileSource.filename,
        },
        "file",
        pendingFileSource.filename,
      );
    } else if (inputText.trim()) {
      setSourceSummary("Natural language");
      await extractWithAI(
        { sourceType: "text", inputText: inputText.trim() },
        "text",
        "Natural language",
      );
    } else {
      setExtractError("Type something or attach a file to extract events.");
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let targetCalendarId = calendarId || calendars[0]?.id || "";

      if (newCalendarName.trim()) {
        const calRes = await fetch("/api/calendars/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCalendarName.trim(),
            googleAccessToken,
            supabaseAccessToken,
          }),
        });
        const calData = await calRes.json();
        if (!calRes.ok)
          throw new Error(calData.error ?? "Error creating calendar");
        const created = calData.calendar as Calendar;
        setCalendars((prev) => [...prev, created]);
        targetCalendarId = created.id ?? "";
        setCalendarId(targetCalendarId);
        setNewCalendarName("");
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: events.map((e) => ({
            ...e,
            timezone: e.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          })),
          calendarId: targetCalendarId,
          colorId,
          notifyDays,
          notifyHour,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.created);
      clearLocalDraftState();
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : "Error creating events";
      setError(toUserFriendlyErrorMessage(rawMessage, "Error creating events"));
    } finally {
      setLoading(false);
    }
  }

  function updateEvent(index: number, patch: Partial<EventRow>) {
    setEvents((prev) =>
      prev.map((event, i) => (i === index ? { ...event, ...patch } : event)),
    );
  }

  function addInvites(index: number, rawTokens: string[]) {
    setEvents((prev) =>
      prev.map((event, i) => {
        if (i !== index) return event;
        const existing = new Set(
          (event.invites ?? [])
            .map((invite) => invite.trim().toLowerCase())
            .filter((invite) => EMAIL_REGEX.test(invite)),
        );
        for (const token of rawTokens) {
          const normalized = token.trim().toLowerCase();
          if (EMAIL_REGEX.test(normalized)) existing.add(normalized);
        }
        return { ...event, invites: Array.from(existing) };
      }),
    );
  }

  function removeInvite(index: number, inviteToRemove: string) {
    const normalizedToRemove = inviteToRemove.trim().toLowerCase();
    setEvents((prev) =>
      prev.map((event, i) => {
        if (i !== index) return event;
        return {
          ...event,
          invites: (event.invites ?? []).filter(
            (invite) => invite.trim().toLowerCase() !== normalizedToRemove,
          ),
        };
      }),
    );
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
    setInviteDraftByEvent((prev) => {
      const next: Record<number, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        const current = Number(key);
        if (Number.isNaN(current)) continue;
        if (current < index) next[current] = value;
        if (current > index) next[current - 1] = value;
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

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">
      {/* Nav — same floating pill as home/how-it-works */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
              Calendarito
            </span>
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
              <div className="mb-4 rounded-2xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">
                {error}
              </div>
            )}
            {extractError && (
              <div className="mb-4 rounded-2xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">
                {extractError}
              </div>
            )}
            {extractWarnings.length > 0 && (
              <div className="mb-4 rounded-2xl border border-[#FFE082] bg-[#FFF9E6] px-4 py-3 text-[13px] text-[#8A6D1A]">
                <p className="font-heading mb-1 text-sm font-semibold">
                  Warnings
                </p>
                <ul className="space-y-0.5">
                  {extractWarnings.map((w, i) => (
                    <li key={i}>— {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {!result && (
              <div className="flex flex-col gap-3">
                {/* Step 1 */}
                <StepCard
                  num={1}
                  title="What's on your schedule?"
                  hoverable={false}
                >
                  <UnifiedSourceInput
                    inputText={inputText}
                    onInputTextChange={setInputText}
                    pendingFileSource={pendingFileSource}
                    onFileAttached={handleFileAttached}
                    onClearFile={handleClearFile}
                    onExtract={() => void handleExtract()}
                    extracting={extracting}
                    authenticated={!!authenticated}
                    hasExtracted={events.length > 0}
                  />

                  {events.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#ECECEC]">
                      <div className="max-h-[280px] overflow-y-auto divide-y divide-[#F5F5F5]">
                        {events.map((event, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.005 }}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 28,
                            }}
                            className={`${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"}`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleEventExpanded(i)}
                              aria-label="Toggle event editor"
                              className="group flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left"
                            >
                              <div className="min-w-0">
                                <p className="mb-0.5 truncate text-xs font-medium text-[#0A0A0A]">
                                  {event.summary}
                                </p>
                                <p className="text-[11px] text-[#888]">
                                  {eventLabel(event)}
                                </p>
                                {event.invites && event.invites.length > 0 && (
                                  <p className="text-[11px] text-[#888]">
                                    {event.invites.length} invite
                                    {event.invites.length !== 1 ? "s" : ""}
                                  </p>
                                )}
                                {event.hasGoogleMeet && (
                                  <p className="text-[11px] text-[#888]">
                                    Google Meet
                                  </p>
                                )}
                              </div>
                              <div className="ml-3 flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${COLORS.find((c) => c.id === (event.colorId ?? colorId))?.swatchClass ?? "bg-[#8e24aa]"}`}
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
                                  onChange={(e) =>
                                    updateEvent(i, { summary: e.target.value })
                                  }
                                  className="px-3 py-2 text-xs"
                                  placeholder="Event title"
                                />
                                <label className="flex items-center justify-between rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-3 py-2 text-xs text-[#0A0A0A]">
                                  <span>Google Meet</span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={event.hasGoogleMeet === true}
                                    onClick={() =>
                                      updateEvent(i, {
                                        hasGoogleMeet: !(event.hasGoogleMeet === true),
                                      })
                                    }
                                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors ${event.hasGoogleMeet === true
                                      ? "bg-[#0A0A0A]"
                                      : "bg-[#D0D5DD]"
                                      }`}
                                  >
                                    <span
                                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${event.hasGoogleMeet === true
                                        ? "translate-x-4"
                                        : "translate-x-0.5"
                                        }`}
                                    />
                                  </button>
                                </label>
                                <div className="box-border flex min-h-[34px] w-full flex-wrap items-center gap-1.5 rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-3 py-2 text-xs text-[#0A0A0A] outline-none transition-colors focus-within:border-[#0A0A0A]">
                                  {(event.invites ?? []).map((invite) => (
                                    <span
                                      key={`${i}-${invite}`}
                                      className="inline-flex items-center gap-1 rounded-full bg-[#EDEDED] px-2 py-0.5 text-[11px] text-[#0A0A0A]"
                                    >
                                      <span>{invite}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeInvite(i, invite)}
                                        aria-label={`Remove invite ${invite}`}
                                        className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#DDDDDD] hover:text-[#0A0A0A]"
                                      >
                                        <svg
                                          width="10"
                                          height="10"
                                          viewBox="0 0 12 12"
                                          fill="none"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M9 3L3 9M3 3l6 6"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                      </button>
                                    </span>
                                  ))}
                                  <input
                                    type="text"
                                    value={inviteDraftByEvent[i] ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const parts = value.split(/[,\n;]+/);
                                      if (parts.length > 1) {
                                        const completed = parts.slice(0, -1);
                                        addInvites(i, completed);
                                      }
                                      const draft = parts[parts.length - 1] ?? "";
                                      setInviteDraftByEvent((prev) => ({
                                        ...prev,
                                        [i]: draft,
                                      }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "," ||
                                        e.key === "Enter" ||
                                        e.key === "Tab"
                                      ) {
                                        e.preventDefault();
                                        const draft = inviteDraftByEvent[i] ?? "";
                                        addInvites(i, [draft]);
                                        setInviteDraftByEvent((prev) => ({
                                          ...prev,
                                          [i]: "",
                                        }));
                                      }
                                    }}
                                    onBlur={() => {
                                      const draft = inviteDraftByEvent[i] ?? "";
                                      if (!draft.trim()) return;
                                      addInvites(i, [draft]);
                                      setInviteDraftByEvent((prev) => ({
                                        ...prev,
                                        [i]: "",
                                      }));
                                    }}
                                    className="min-w-[180px] flex-1 border-0 bg-transparent p-0 text-xs text-[#0A0A0A] outline-none placeholder:text-[#888]"
                                    placeholder={
                                      (event.invites?.length ?? 0) > 0
                                        ? ""
                                        : "Add invite emails and press comma"
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <Input
                                    type="date"
                                    value={event.date}
                                    onChange={(e) =>
                                      updateEvent(i, { date: e.target.value })
                                    }
                                    className="px-3 py-2 text-xs"
                                  />
                                  <Input
                                    type="time"
                                    value={event.startTime ?? ""}
                                    onChange={(e) => {
                                      const startTime =
                                        e.target.value || undefined;
                                      const endTime = event.endTime;
                                      updateEvent(i, {
                                        allDay: !(startTime || endTime),
                                        startTime,
                                        endTime,
                                      });
                                    }}
                                    className="px-3 py-2 text-xs"
                                  />
                                  <Input
                                    type="time"
                                    value={event.endTime ?? ""}
                                    onChange={(e) => {
                                      const endTime =
                                        e.target.value || undefined;
                                      const startTime = event.startTime;
                                      updateEvent(i, {
                                        allDay: !(startTime || endTime),
                                        startTime,
                                        endTime,
                                      });
                                    }}
                                    className="px-3 py-2 text-xs"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {COLORS.map((c) => (
                                    <button
                                      key={`${i}-${c.id}`}
                                      type="button"
                                      onClick={() =>
                                        updateEvent(i, { colorId: c.id })
                                      }
                                      title={c.name}
                                      className={`h-6 w-6 cursor-pointer rounded-full border-[2px] ${c.swatchClass} ${(event.colorId ?? colorId) === c.id
                                        ? "border-[#0A0A0A]"
                                        : "border-transparent"
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
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M3 6h18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M19 6v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M10 11v6M14 11v6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
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
                        onValueChange={(val) => {
                          if (val === "__new__") {
                            setCalendarId("");
                            setNewCalendarName("");
                          } else {
                            setCalendarId(val ?? "");
                            setNewCalendarName("");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] focus:border-[#0A0A0A] focus:ring-0 h-auto">
                          <SelectValue placeholder="Select a calendar">
                            {calendarSelectLabel || undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {calendars.map((c) => (
                            <SelectItem key={c.id} value={c.id ?? ""}>
                              {calendarLabel(c)}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__" className="text-[#555]">
                            + Add new calendar...
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {(newCalendarName !== "" || calendarId === "") && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="mt-2 overflow-hidden"
                          >
                            <Input
                              type="text"
                              placeholder="Add new calendar..."
                              value={newCalendarName}
                              onChange={(e) =>
                                setNewCalendarName(e.target.value)
                              }
                              autoFocus
                            />
                            {newCalendarName.trim() && (
                              <p className="mt-1.5 text-[11px] text-[#888]">
                                Will be created when you click &quot;Create in
                                Google Calendar&quot;
                              </p>
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
                      onClick={() => {
                        window.location.href = "/login?next=/get-started";
                      }}
                      disabled={events.length === 0}
                      className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E8E815]/45 disabled:text-[#0A0A0A]/55"
                    >
                      Login to continue
                    </button>
                    <p className="text-center text-[13px] text-[#999]">
                      By logging in, you agree to our{" "}
                      <Link
                        href="/privacy"
                        className="text-[#0A0A0A] hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      extracting ||
                      events.length === 0 ||
                      (!calendarId && !newCalendarName.trim())
                    }
                    className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:bg-[#E8E815]/45 disabled:text-[#0A0A0A]/55"
                  >
                    {loading
                      ? newCalendarName.trim()
                        ? "Creating calendar & events..."
                        : "Creating in Google Calendar..."
                      : "Create in Google Calendar"}
                  </button>
                )}
              </div>
            )}

            {/* Success state */}
            {result && (
              <article className="rounded-2xl border border-[#ECECEC] bg-white p-8 shadow-[0_4px_18px_rgba(0,0,0,0.04)] flex flex-col items-center gap-5 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E815]">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0A0A0A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-heading mb-1 text-[22px] font-extrabold tracking-[-0.02em] text-[#0A0A0A]">
                    {result.length} events created
                  </h2>
                  <p className="text-sm text-[#666]">
                    They are now in your Google Calendar.
                  </p>
                </div>
                <div className="w-full overflow-hidden rounded-xl border border-[#ECECEC]">
                  <div className="max-h-[200px] overflow-y-auto">
                    {result.map((e, i) => (
                      <div
                        key={i}
                        className={`flex justify-between px-3 py-[7px] ${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"} ${i < result.length - 1 ? "border-b border-[#F5F5F5]" : ""}`}
                      >
                        <span className="text-xs text-[#0A0A0A]">
                          {e.summary}
                        </span>
                        <span className="text-xs text-[#999]">{e.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setEvents([]);
                    setExtractWarnings([]);
                    setExtractError("");
                    setSourceSummary("");
                    setInputText("");
                    setPendingFileSource(null);
                    window.localStorage.removeItem(EVENTS_STORAGE_KEY);
                  }}
                  className="font-heading w-full cursor-pointer rounded-full border-none bg-[#E8E815] p-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512]"
                >
                  Add more events
                </button>
              </article>
            )}
          </div>
          {/* end left column */}

          {/* ── Right column: calendar preview ── */}
          <div className="min-w-0 flex-1">
            <div className="lg:sticky lg:top-[84px]">
              <div className="rounded-2xl bg-white shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
                <CalendarPreview
                  key={events
                    .map(
                      (e) =>
                        `${e.date}${e.summary}${e.colorId ?? colorId}${e.description ?? ""}${(e.invites ?? []).join(",")}${e.hasGoogleMeet ? "meet" : "nomeet"}`,
                    )
                    .join("|")}
                  events={events}
                  colorId={colorId}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {events.length > 0 && (
                  <p className="font-heading text-xs font-semibold tracking-[0.06em] text-[#999] uppercase">
                    Preview
                  </p>
                )}
                {events.length > 0 && (
                  <span className="rounded-full bg-[#E8E815] px-2 py-0.5 font-heading text-[10px] font-bold text-[#0A0A0A]">
                    {events.length} event{events.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {events.length === 0 && (
                <p className="mt-3 text-center text-xs text-[#BBB]">
                  Your events will appear here before creation. This is only a
                  preview, not your real calendar.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
