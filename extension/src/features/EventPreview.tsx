import { useState } from "react"

import type { ExtractedEvent } from "../sidepanel"

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

type Props = {
  events: ExtractedEvent[]
  onUpdate: (events: ExtractedEvent[]) => void
  onAdd: (event: ExtractedEvent, idx: number) => void
  addingIdx: number | null
  addedIdx: Set<number>
  error: string
}

export function EventPreview({
  events,
  onUpdate,
  onAdd,
  addingIdx,
  addedIdx,
  error
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(
    events.length === 1 ? 0 : null
  )

  function updateEvent(idx: number, patch: Partial<ExtractedEvent>) {
    const updated = events.map((e, i) => (i === idx ? { ...e, ...patch } : e))
    onUpdate(updated)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#aaaaaa]">
        {events.length} event{events.length !== 1 ? "s" : ""} found
      </p>

      {events.map((event, idx) => {
        const isExpanded = expandedIdx === idx
        const isAdded = addedIdx.has(idx)
        const isAdding = addingIdx === idx
        const colorDef = COLORS.find((c) => c.id === event.colorId) ?? COLORS[6]

        return (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
            {/* Card header */}
            <div
              className="flex cursor-pointer items-start gap-3 p-4"
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
              {/* Color dot */}
              <div
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: colorDef.hex }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0a0a0a]">
                  {event.summary || "Untitled event"}
                </p>
                <p className="mt-0.5 text-[11px] text-[#aaaaaa]">
                  {event.date}
                  {!event.allDay && event.startTime
                    ? ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`
                    : " · All day"}
                </p>
              </div>

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className={`shrink-0 text-[#cccccc] transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Expanded edit form */}
            {isExpanded && (
              <div className="border-t border-[#f5f5f5] px-4 pb-4 pt-3">
                <div className="flex flex-col gap-3">
                  {/* Title */}
                  <Field label="Title">
                    <input
                      value={event.summary}
                      onChange={(e) =>
                        updateEvent(idx, { summary: e.target.value })
                      }
                      className="input-base"
                      placeholder="Event title"
                    />
                  </Field>

                  {/* Date */}
                  <Field label="Date">
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) =>
                        updateEvent(idx, { date: e.target.value })
                      }
                      className="input-base"
                    />
                  </Field>

                  {/* All day toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#888]">
                      All day
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateEvent(idx, { allDay: !event.allDay })
                      }
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        event.allDay ? "bg-[#e8e815]" : "bg-[#e0e0e0]"
                      }`}>
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          event.allDay ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Time fields */}
                  {!event.allDay && (
                    <div className="flex gap-2">
                      <Field label="Start" className="flex-1">
                        <input
                          type="time"
                          value={event.startTime ?? ""}
                          onChange={(e) =>
                            updateEvent(idx, { startTime: e.target.value })
                          }
                          className="input-base"
                        />
                      </Field>
                      <Field label="End" className="flex-1">
                        <input
                          type="time"
                          value={event.endTime ?? ""}
                          onChange={(e) =>
                            updateEvent(idx, { endTime: e.target.value })
                          }
                          className="input-base"
                        />
                      </Field>
                    </div>
                  )}

                  {/* Location */}
                  <Field label="Location">
                    <input
                      value={event.location ?? ""}
                      onChange={(e) =>
                        updateEvent(idx, { location: e.target.value })
                      }
                      className="input-base"
                      placeholder="Add location"
                    />
                  </Field>

                  {/* Description */}
                  <Field label="Notes">
                    <textarea
                      value={event.description ?? ""}
                      onChange={(e) =>
                        updateEvent(idx, { description: e.target.value })
                      }
                      className="input-base resize-none"
                      rows={2}
                      placeholder="Add notes"
                    />
                  </Field>

                  {/* Color picker */}
                  <Field label="Color">
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateEvent(idx, { colorId: c.id })}
                          title={c.name}
                          className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
                            event.colorId === c.id
                              ? "ring-2 ring-offset-1 ring-[#0a0a0a]"
                              : ""
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* Add to calendar button */}
            <div className="border-t border-[#f5f5f5] px-4 py-3">
              <button
                type="button"
                disabled={isAdded || isAdding}
                onClick={() => onAdd(event, idx)}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-bold transition-all ${
                  isAdded
                    ? "bg-[#f0faf0] text-[#33b679]"
                    : "bg-[#e8e815] text-[#0a0a0a] hover:bg-[#d4d512] disabled:cursor-not-allowed disabled:opacity-60"
                }`}>
                {isAdding ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="#0a0a0a"
                        strokeWidth="3"
                        strokeDasharray="28 28"
                        strokeDashoffset="14"
                      />
                    </svg>
                    Adding…
                  </>
                ) : isAdded ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="#33b679"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Added to Calendar
                  </>
                ) : (
                  "Add to Google Calendar"
                )}
              </button>
            </div>
          </div>
        )
      })}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <style>{`
        .input-base {
          width: 100%;
          background: #f9f9f9;
          border: 1.5px solid #eeeeee;
          border-radius: 0.625rem;
          padding: 6px 10px;
          font-size: 12px;
          color: #0a0a0a;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .input-base:focus {
          border-color: #0a0a0a;
          background: #fff;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
  className = ""
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#bbbbbb]">
        {label}
      </span>
      {children}
    </div>
  )
}
