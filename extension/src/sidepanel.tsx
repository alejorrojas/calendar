import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"

import "./style.css"

import { SourceInput } from "~features/SourceInput"
import { useAuth } from "~features/useAuth"

const APP = "https://calendarito.com"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeInviteEmails(value: unknown): string[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n;\s]+/)
      : []
  const unique = new Set<string>()
  for (const raw of candidates) {
    if (typeof raw !== "string") continue
    const normalized = raw.trim().toLowerCase()
    if (EMAIL_REGEX.test(normalized)) unique.add(normalized)
  }
  return Array.from(unique)
}

const COLORS = [
  { id: "1", name: "Lavender", hex: "#7986cb" },
  { id: "2", name: "Sage", hex: "#33b679" },
  { id: "3", name: "Grape", hex: "#8e24aa" },
  { id: "4", name: "Flamingo", hex: "#e67c73" },
  { id: "5", name: "Banana", hex: "#f6c026" },
  { id: "6", name: "Tangerine", hex: "#f5511d" },
  { id: "7", name: "Peacock", hex: "#039be5" },
  { id: "8", name: "Blueberry", hex: "#3f51b5" },
  { id: "9", name: "Basil", hex: "#0b8043" },
  { id: "10", name: "Tomato", hex: "#d60000" }
]

export type ExtractedEvent = {
  summary: string
  date: string
  allDay: boolean
  startTime?: string
  endTime?: string
  timezone?: string
  description?: string
  location?: string
  invites?: string[]
  colorId?: string
}

type Calendar = { id: string; name: string }

function eventLabel(event: ExtractedEvent): string {
  if (!event.allDay && event.startTime) {
    return `${event.date} ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`
  }
  return `${event.date} · All day`
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      {...rest}
      className={`box-border w-full rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A] focus:bg-white ${className ?? ""}`}
    />
  )
}

export default function SidePanel() {
  const { session, loading: authLoading } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  // Form state
  const [inputText, setInputText] = useState("")
  const [pendingFile, setPendingFile] = useState<{
    fileData: string; mediaType: string; filename: string
  } | null>(null)
  const [colorId, setColorId] = useState("7")
  const [notifyDays] = useState(1)
  const [notifyHour] = useState(9)

  // Events state
  const [events, setEvents] = useState<ExtractedEvent[]>([])
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())
  const [inviteDraftByEvent, setInviteDraftByEvent] = useState<Record<number, string>>({})
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState("")

  // Calendar state
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [calendarId, setCalendarId] = useState("primary")
  const [newCalendarName, setNewCalendarName] = useState("")

  // Submit state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ summary: string; date: string }[] | null>(null)

  const userEmail = session?.user?.email ?? ""
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

  function handleSignOut() {
    chrome.storage.local.remove("calendarito_session")
    setAvatarMenuOpen(false)
  }

  const calendarLabel = (c: Calendar) =>
    c.id === userEmail ? `Default Calendar - ${userEmail}` : c.name

  const selectedCalendar = calendars.find((c) => c.id === calendarId)
  const calendarSelectValue = newCalendarName ? "__new__" : calendarId
  const calendarSelectLabel =
    calendarSelectValue === "__new__"
      ? "+ Add new calendar..."
      : selectedCalendar ? calendarLabel(selectedCalendar) : "primary"

  const fetchCalendars = useCallback(async () => {
    if (!session?.provider_token) return
    try {
      const res = await fetch(`${APP}/api/calendars`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "X-Provider-Token": session.provider_token
        }
      })
      const data = await res.json()
      if (data.calendars) {
        const sorted = [...data.calendars].sort((a: Calendar, b: Calendar) => {
          if (a.id === userEmail) return -1
          if (b.id === userEmail) return 1
          return 0
        })
        setCalendars(sorted)
        const primary = sorted.find((c: Calendar) => c.id === userEmail)
        setCalendarId(primary?.id ?? sorted[0]?.id ?? "primary")
      }
    } catch {}
  }, [session, userEmail])

  useEffect(() => {
    if (session) void fetchCalendars()
  }, [session, fetchCalendars])

  async function handleExtract() {
    if (extracting) return
    setExtractError("")
    setExtracting(true)
    try {
      const body = pendingFile
        ? { sourceType: "file", fileData: pendingFile.fileData, mediaType: pendingFile.mediaType, filename: pendingFile.filename, ...(inputText.trim() ? { inputText: inputText.trim() } : {}) }
        : { sourceType: "text", inputText: inputText.trim() }

      const res = await fetch(`${APP}/api/events/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not extract events")
      const extracted = (data.events ?? []).flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return []
        const e = item as Partial<ExtractedEvent>
        if (!e.date || !e.summary) return []
        return [{ ...e, invites: normalizeInviteEmails(e.invites) } as ExtractedEvent]
      })
      setEvents(extracted)
      setInviteDraftByEvent({})
      if (!extracted.length) setExtractError("No clear events found in the provided source.")
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Error processing source")
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit() {
    if (!session?.access_token || !session?.provider_token) {
      setError("Google session expired. Please sign in again at calendarito.com.")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)
    try {
      let targetCalendarId = calendarId || "primary"

      if (newCalendarName.trim()) {
        const calRes = await fetch(`${APP}/api/calendars/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCalendarName.trim(),
            googleAccessToken: session.provider_token,
            supabaseAccessToken: session.access_token
          })
        })
        const calData = await calRes.json()
        if (!calRes.ok) throw new Error(calData.error ?? "Error creating calendar")
        const created = calData.calendar as Calendar
        setCalendars((prev) => [...prev, created])
        targetCalendarId = created.id ?? "primary"
        setCalendarId(targetCalendarId)
        setNewCalendarName("")
      }

      const res = await fetch(`${APP}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "X-Provider-Token": session.provider_token
        },
        body: JSON.stringify({
          events: events.map((e) => ({
            ...e,
            timezone: e.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
          })),
          calendarId: targetCalendarId,
          colorId,
          notifyDays,
          notifyHour
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error creating events")
      setResult(data.created)
      setEvents([])
      setInputText("")
      setPendingFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creating events")
    } finally {
      setLoading(false)
    }
  }

  function updateEvent(i: number, patch: Partial<ExtractedEvent>) {
    setEvents((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }

  function addInvites(index: number, rawTokens: string[]) {
    setEvents((prev) =>
      prev.map((event, i) => {
        if (i !== index) return event
        const existing = new Set(
          (event.invites ?? []).map((inv) => inv.trim().toLowerCase()).filter((inv) => EMAIL_REGEX.test(inv))
        )
        for (const token of rawTokens) {
          const normalized = token.trim().toLowerCase()
          if (EMAIL_REGEX.test(normalized)) existing.add(normalized)
        }
        return { ...event, invites: Array.from(existing) }
      })
    )
  }

  function removeInvite(index: number, inviteToRemove: string) {
    const normalizedToRemove = inviteToRemove.trim().toLowerCase()
    setEvents((prev) =>
      prev.map((event, i) => {
        if (i !== index) return event
        return {
          ...event,
          invites: (event.invites ?? []).filter((inv) => inv.trim().toLowerCase() !== normalizedToRemove)
        }
      })
    )
  }

  function removeEvent(i: number) {
    setEvents((prev) => prev.filter((_, idx) => idx !== i))
    setExpandedEvents((prev) => {
      const next = new Set<number>()
      for (const n of prev) {
        if (n < i) next.add(n)
        if (n > i) next.add(n - 1)
      }
      return next
    })
    setInviteDraftByEvent((prev) => {
      const next: Record<number, string> = {}
      for (const [key, value] of Object.entries(prev)) {
        const current = Number(key)
        if (Number.isNaN(current)) continue
        if (current < i) next[current] = value
        if (current > i) next[current - 1] = value
      }
      return next
    })
  }

  function toggleExpanded(i: number) {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f2f2f2]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e8e815] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#f2f2f2]">
      {/* Body */}
      <main className="flex-1 overflow-y-auto p-3">
        {!session ? (
          <NotLoggedIn />
        ) : result ? (
          /* ── Success ── */
          <motion.article
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#ECECEC] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)] flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E815]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontFamily: "Poppins, sans-serif" }} className="mb-1 text-lg font-extrabold tracking-[-0.02em] text-[#0A0A0A]">
                {result.length} event{result.length !== 1 ? "s" : ""} created
              </h2>
              <p className="text-sm text-[#666]">Now in your Google Calendar.</p>
            </div>
            <div className="w-full overflow-hidden rounded-xl border border-[#ECECEC]">
              {result.map((e, i) => (
                <div key={i} className={`flex justify-between px-3 py-2 ${i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"} ${i < result.length - 1 ? "border-b border-[#F5F5F5]" : ""}`}>
                  <span className="text-xs text-[#0A0A0A]">{e.summary}</span>
                  <span className="text-xs text-[#999]">{e.date}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setResult(null)}
              className="w-full cursor-pointer rounded-full border-none bg-[#E8E815] py-3 text-sm font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Add more events
            </button>
          </motion.article>
        ) : (
          /* ── Main form ── */
          <div className="flex flex-col gap-3">
            {/* Errors */}
            {(error || extractError) && (
              <div className="rounded-2xl border border-[#FFCDD2] bg-[#FFF0F0] px-4 py-3 text-[13px] text-[#C62828]">
                {error || extractError}
                {error && /credential|auth|token|OAuth/i.test(error) && (
                  <a
                    href="https://calendarito.com/login"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block font-semibold underline"
                  >
                    Sign in again →
                  </a>
                )}
              </div>
            )}

            {/* Step 1: Input */}
            <Card num={1} title="What's on your schedule?">
              <SourceInput
                inputText={inputText}
                onInputTextChange={setInputText}
                pendingFile={pendingFile}
                onFileAttached={setPendingFile}
                onClearFile={() => setPendingFile(null)}
                onExtract={handleExtract}
                extracting={extracting}
                error=""
              />

              {/* Event list */}
              {events.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[#ECECEC]">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-[#F5F5F5]">
                    {events.map((event, i) => (
                      <motion.div
                        key={i}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.003 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className={i % 2 === 0 ? "bg-[#FAFAFA]" : "bg-white"}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(i)}
                          className="group flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#0A0A0A]">{event.summary}</p>
                            <p className="text-[11px] text-[#888]">{eventLabel(event)}</p>
                            {event.invites && event.invites.length > 0 && (
                              <p className="text-[11px] text-[#888]">
                                {event.invites.length} invite{event.invites.length !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex items-center gap-2 shrink-0">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: COLORS.find((c) => c.id === (event.colorId ?? colorId))?.hex ?? "#039be5" }}
                            />
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                              className="text-[#666] opacity-0 transition-opacity group-hover:opacity-100">
                              <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                            {/* Invite chip input */}
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
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                      <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                value={inviteDraftByEvent[i] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const parts = value.split(/[,\n;]+/)
                                  if (parts.length > 1) {
                                    addInvites(i, parts.slice(0, -1))
                                  }
                                  const draft = parts[parts.length - 1] ?? ""
                                  setInviteDraftByEvent((prev) => ({ ...prev, [i]: draft }))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "," || e.key === "Enter" || e.key === "Tab") {
                                    e.preventDefault()
                                    const draft = inviteDraftByEvent[i] ?? ""
                                    addInvites(i, [draft])
                                    setInviteDraftByEvent((prev) => ({ ...prev, [i]: "" }))
                                  }
                                }}
                                onBlur={() => {
                                  const draft = inviteDraftByEvent[i] ?? ""
                                  if (!draft.trim()) return
                                  addInvites(i, [draft])
                                  setInviteDraftByEvent((prev) => ({ ...prev, [i]: "" }))
                                }}
                                className="min-w-[160px] flex-1 border-0 bg-transparent p-0 text-xs text-[#0A0A0A] outline-none placeholder:text-[#888]"
                                placeholder={(event.invites?.length ?? 0) > 0 ? "" : "Invite emails, comma to add"}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                type="date"
                                value={event.date}
                                onChange={(e) => updateEvent(i, { date: e.target.value })}
                                className="px-2 py-2 text-xs col-span-1"
                              />
                              <Input
                                type="time"
                                value={event.startTime ?? ""}
                                onChange={(e) => {
                                  const startTime = e.target.value || undefined
                                  updateEvent(i, { allDay: !(startTime || event.endTime), startTime })
                                }}
                                className="px-2 py-2 text-xs"
                              />
                              <Input
                                type="time"
                                value={event.endTime ?? ""}
                                onChange={(e) => {
                                  const endTime = e.target.value || undefined
                                  updateEvent(i, { allDay: !(event.startTime || endTime), endTime })
                                }}
                                className="px-2 py-2 text-xs"
                              />
                            </div>
                            {/* Color picker */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {COLORS.map((c) => (
                                <button
                                  key={`${i}-${c.id}`}
                                  type="button"
                                  onClick={() => updateEvent(i, { colorId: c.id })}
                                  title={c.name}
                                  className="h-5 w-5 cursor-pointer rounded-full border-[2px] transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: c.hex,
                                    borderColor: (event.colorId ?? colorId) === c.id ? "#0A0A0A" : "transparent"
                                  }}
                                />
                              ))}
                            </div>
                            {/* Delete */}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeEvent(i)}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[#B42318] transition-colors hover:bg-[#FEF3F2]"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6M10 11v6M14 11v6"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            </Card>

            {/* Step 2: Calendar */}
            {events.length > 0 && (
              <Card num={2} title="Calendar">
                <div className="relative">
                  <select
                    value={calendarSelectValue}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setCalendarId("")
                        setNewCalendarName("")
                      } else {
                        setCalendarId(e.target.value)
                        setNewCalendarName("")
                      }
                    }}
                    className="w-full appearance-none rounded-xl border-[1.5px] border-[#E0E0E0] bg-[#FAFAFA] px-[14px] py-[11px] pr-10 text-sm text-[#0A0A0A] outline-none transition-colors focus:border-[#0A0A0A] cursor-pointer"
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id ?? ""}>{calendarLabel(c)}</option>
                    ))}
                    <option value="__new__">+ Add new calendar...</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999]" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <AnimatePresence>
                  {(newCalendarName !== "" || calendarId === "") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="mt-2 overflow-hidden"
                    >
                      <Input
                        type="text"
                        placeholder="New calendar name..."
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                        autoFocus
                      />
                      {newCalendarName.trim() && (
                        <p className="mt-1.5 text-[11px] text-[#888]">Will be created when you click "Create in Google Calendar"</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}

            {/* CTA */}
            {events.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={loading || extracting || events.length === 0 || (!calendarId && !newCalendarName.trim())}
                className="w-full cursor-pointer rounded-full border-none bg-[#E8E815] py-3.5 text-[15px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {loading
                  ? newCalendarName.trim() ? "Creating calendar & events..." : "Creating in Google Calendar..."
                  : "Create in Google Calendar"}
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#e8e8e8] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "Poppins, sans-serif" }} className="text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Calendarito
          </span>
        </div>
        {session ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((o) => !o)}
              className="h-7 w-7 cursor-pointer overflow-hidden rounded-full bg-[#f0f0f0] transition-opacity hover:opacity-80"
            >
              {session.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#888]">
                  {session.user?.email?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </button>
            <AnimatePresence>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.14 }}
                    className="absolute bottom-9 right-0 z-20 w-[200px] rounded-2xl border border-[#ECECEC] bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
                  >
                    {userEmail && (
                      <p className="mb-2.5 truncate text-[11px] text-[#888]">{userEmail}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      className="w-full cursor-pointer rounded-full border-[1.5px] border-[#DDD] bg-white py-2 text-xs font-semibold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A]"
                    >
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <a href={`${APP}/login`} target="_blank" rel="noreferrer"
            className="rounded-full bg-[#E8E815] px-3 py-1 text-[11px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#d4d512]">
            Sign in
          </a>
        )}
      </footer>
    </div>
  )
}

function Card({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.article
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]"
          style={{ fontFamily: "Poppins, sans-serif" }}>
          {num}
        </div>
        <p className="text-sm font-semibold tracking-[-0.01em] text-[#0A0A0A]"
          style={{ fontFamily: "Poppins, sans-serif" }}>
          {title}
        </p>
      </div>
      {children}
    </motion.article>
  )
}

function NotLoggedIn() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E815]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3" stroke="#0a0a0a" strokeWidth="2" />
          <path d="M3 9h18" stroke="#0a0a0a" strokeWidth="2" />
          <path d="M8 2v3M16 2v3" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-base font-bold text-[#0a0a0a]" style={{ fontFamily: "Poppins, sans-serif" }}>Sign in to get started</p>
        <p className="mt-1 text-sm text-[#aaaaaa]">Open Calendarito in your browser to sign in, then come back here.</p>
      </div>
      <a href="https://calendarito.com/login" target="_blank" rel="noreferrer"
        className="rounded-full bg-[#E8E815] px-5 py-2 text-sm font-bold text-[#0a0a0a] transition-colors hover:bg-[#d4d512]"
        style={{ fontFamily: "Poppins, sans-serif" }}>
        Open Calendarito →
      </a>
    </div>
  )
}
