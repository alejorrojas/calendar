'use client';

import { useMemo } from 'react';
import { Temporal as TemporalPolyfill } from '@js-temporal/polyfill';
import { createViewMonthGrid } from '@schedule-x/calendar';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { ScheduleXCalendar, useNextCalendarApp } from '@schedule-x/react';
import '@schedule-x/theme-default/dist/index.css';

// Install polyfill on globalThis when native Temporal is unavailable.
// Schedule-x reads Temporal as a bare global, so it must be the same instance
// used to create event objects — otherwise instanceof checks fail on mobile.
const g = globalThis as unknown as { Temporal?: typeof TemporalPolyfill };
if (typeof g.Temporal === 'undefined') {
  g.Temporal = TemporalPolyfill;
}
const Temporal = g.Temporal as typeof TemporalPolyfill;

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface EventRow {
  summary: string;
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  description?: string;
  invites?: string[];
  colorId?: string;
}

const COLOR_MAP: Record<string, string> = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa',
  '4': '#e67c73', '5': '#f6c026', '6': '#f5511d',
  '7': '#039be5', '8': '#3f51b5', '9': '#0b8043',
  '10': '#d60000', '11': '#e67c73',
};

interface Props {
  events: EventRow[];
  colorId: string;
}

function normalizeDateOnly(value: string): string | null {
  const trimmed = value.trim();
  if (DATE_ONLY_REGEX.test(trimmed)) return trimmed;

  const datetimeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s].+$/);
  if (datetimeMatch && DATE_ONLY_REGEX.test(datetimeMatch[1])) {
    return datetimeMatch[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function toTemporalStart(dateOnly: string, allDay: boolean, time?: string) {
  if (allDay || !time) return Temporal.PlainDate.from(dateOnly);
  return Temporal.ZonedDateTime.from(`${dateOnly}T${time}:00[UTC]`);
}

function toTemporalEnd(dateOnly: string, allDay: boolean, time?: string) {
  if (allDay || !time) return Temporal.PlainDate.from(dateOnly);
  return Temporal.ZonedDateTime.from(`${dateOnly}T${time}:00[UTC]`);
}

function buildPreviewDescription(event: EventRow): string | undefined {
  const parts: string[] = [];
  const description = event.description?.trim();
  if (description) parts.push(description);
  if (event.invites && event.invites.length > 0) {
    parts.push(`Invites: ${event.invites.join(', ')}`);
  }
  if (parts.length === 0) return undefined;
  return parts.join('\n\n');
}

export default function CalendarPreview({ events, colorId }: Props) {
  const calendarEvents = useMemo(
    () =>
      events.reduce<Array<{ id: string; title: string; start: unknown; end: unknown; calendarId: string; description?: string }>>(
        (acc, event, index) => {
          const dateOnly = normalizeDateOnly(event.date);
          if (!dateOnly) return acc;

          const isAllDay = event.allDay !== false;
          const endTime = event.endTime ?? event.startTime;
          const eventColorId = event.colorId ?? colorId;
          acc.push({
            id: String(index),
            title: event.summary,
            start: toTemporalStart(dateOnly, isAllDay, event.startTime),
            end: toTemporalEnd(dateOnly, isAllDay, endTime),
            calendarId: `preview-${eventColorId}`,
            description: buildPreviewDescription(event),
          });
          return acc;
        },
        []
      ),
    [events, colorId]
  );

  const calendars = useMemo(() => {
    const ids = new Set(events.map((event) => event.colorId ?? colorId));
    const entries = Array.from(ids).map((id) => {
      const hex = COLOR_MAP[id] ?? '#8e24aa';
      return [
        `preview-${id}`,
        {
          colorName: `preview-${id}`,
          lightColors: { main: hex, container: `${hex}22`, onContainer: hex },
        },
      ] as const;
    });
    return Object.fromEntries(entries);
  }, [events, colorId]);

  const calendarApp = useNextCalendarApp({
    views: [createViewMonthGrid()],
    defaultView: 'month-grid',
    plugins: [createEventModalPlugin()],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    events: calendarEvents as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calendars: calendars as any,
  });

  return (
    <div className="calendar-preview-shell">
      <ScheduleXCalendar calendarApp={calendarApp} />
    </div>
  );
}
