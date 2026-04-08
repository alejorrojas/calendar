"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Phase = "upload" | "file-ready" | "sending" | "processing" | "calendar";

// April 2026 starts on Wednesday → Mon=0 offset = 2
const MONTH_OFFSET = 2;
const MONTH_DAYS = 30;
const MONTH_NAME = "April 2026";
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const EVENTS: Record<number, string> = {
  7: "Standup",
  10: "Design review",
  14: "Sprint plan",
  17: "Client call",
  21: "Team lunch",
  28: "Q2 kickoff",
};

const EVENT_DAYS = Object.keys(EVENTS).map(Number);

function buildCalendarGrid(): (number | null)[][] {
  const cells: (number | null)[] = Array(MONTH_OFFSET).fill(null);
  for (let d = 1; d <= MONTH_DAYS; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const WEEKS = buildCalendarGrid();

export function CalendarPDFDemoAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("upload");
  const [visibleEvents, setVisibleEvents] = useState<number[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        const check = setInterval(() => {
          if (cancelledRef.current) {
            clearTimeout(t);
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => clearInterval(check), ms + 100);
      });

    const run = async () => {
      while (!cancelledRef.current) {
        setPhase("upload");
        setVisibleEvents([]);

        await sleep(1400);
        if (cancelledRef.current) return;

        setPhase("file-ready");
        await sleep(shouldReduceMotion ? 0 : 1800);
        if (cancelledRef.current) return;

        setPhase("sending");
        await sleep(shouldReduceMotion ? 0 : 800);
        if (cancelledRef.current) return;

        setPhase("processing");
        await sleep(shouldReduceMotion ? 0 : 1600);
        if (cancelledRef.current) return;

        setPhase("calendar");
        for (const day of EVENT_DAYS) {
          if (cancelledRef.current) return;
          setVisibleEvents((prev) => [...prev, day]);
          await sleep(shouldReduceMotion ? 0 : 550);
        }

        await sleep(5000);
      }
    };

    run();
    return () => {
      cancelledRef.current = true;
    };
  }, [shouldReduceMotion]);

  const isUploadPhase = phase !== "calendar";

  return (
    <div className="w-full max-w-[820px] mx-auto rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] overflow-hidden border border-black/[0.06]">
      <AnimatePresence mode="wait">
        {isUploadPhase ? (
          // ── Upload panel ──────────────────────────────────────────────
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.22 } }}
            className="p-4"
          >
            <AnimatePresence mode="wait">
              {phase === "upload" ? (
                // Empty drop zone
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E8E8E8] py-9"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="#BBBBBB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-[#BBBBBB]">Drop a PDF, image or text</p>
                </motion.div>
              ) : (
                // File card
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* PDF icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                          stroke="#EF4444"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2v6h6M9 13h6M9 17h4"
                          stroke="#EF4444"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0A0A0A]">
                        Planning_Q2_2026.pdf
                      </p>
                      <p className="text-xs text-[#AAAAAA]">2.4 MB · Ready to send</p>
                    </div>

                    {/* Send button */}
                    <motion.button
                      aria-label="Send"
                      animate={
                        phase === "sending"
                          ? {
                              scale: [1, 0.82, 1.05, 1],
                              backgroundColor: [
                                "#E8E815",
                                "#d4d410",
                                "#E8E815",
                                "#E8E815",
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E815]"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
                          stroke="#0A0A0A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Processing dots */}
                  <AnimatePresence>
                    {phase === "processing" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                        className="flex items-center gap-1.5 px-1"
                      >
                        <p className="text-xs text-[#AAAAAA]">Extracting events</p>
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.8,
                              delay: i * 0.18,
                            }}
                            className="inline-block h-1 w-1 rounded-full bg-[#AAAAAA]"
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hints */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 px-1">
              {[
                "Math exam next tuesday",
                "Lunch w/ Ana tomorrow",
                "Upload a file",
              ].map((hint) => (
                <span
                  key={hint}
                  className="rounded-full bg-[#F5F5F5] px-2.5 py-1 text-[11px] text-[#AAAAAA]"
                >
                  {hint}
                </span>
              ))}
            </div>
          </motion.div>
        ) : (
          // ── Monthly calendar ──────────────────────────────────────────
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="p-4"
          >
            {/* Month header */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#0A0A0A]">{MONTH_NAME}</p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: EVENT_DAYS.length * 0.32 + 0.4,
                  type: "spring",
                  stiffness: 500,
                  damping: 22,
                }}
                className="flex items-center gap-1.5 rounded-full bg-[#E8E815]/25 px-2.5 py-1"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#9A9A00]" />
                <p className="text-[10px] font-semibold text-[#777]">
                  {EVENT_DAYS.length} events added
                </p>
              </motion.div>
            </div>

            {/* Day labels */}
            <div className="mb-1 grid grid-cols-7">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-semibold text-[#BBBBBB]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="space-y-[2px]">
              {WEEKS.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-x-[2px]">
                  {week.map((day, di) => {
                    const hasEvent =
                      day !== null && visibleEvents.includes(day);
                    return (
                      <div
                        key={di}
                        className="flex min-h-[36px] flex-col items-center pt-1"
                      >
                        {day !== null && (
                          <>
                            <span
                              className={`text-[11px] leading-none ${
                                hasEvent
                                  ? "font-bold text-[#0A0A0A]"
                                  : "text-[#CCCCCC]"
                              }`}
                            >
                              {day}
                            </span>
                            <AnimatePresence>
                              {hasEvent && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6, y: 3 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 22,
                                  }}
                                  className="mt-[3px] w-full px-[1px]"
                                >
                                  <div className="rounded-[4px] bg-[#E8E815] px-1 py-[2px]">
                                    <p className="truncate text-[8px] font-bold leading-tight text-[#0A0A0A]">
                                      {EVENTS[day]}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
