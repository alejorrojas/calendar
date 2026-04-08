"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Phase = "upload" | "image-ready" | "sending" | "processing" | "calendar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

type CalEvent = { day: string; hour: string; label: string };

const EVENTS: CalEvent[] = [
  { day: "Mon", hour: "9 AM",  label: "Math exam"    },
  { day: "Tue", hour: "11 AM", label: "Physics"      },
  { day: "Wed", hour: "2 PM",  label: "History"      },
  { day: "Thu", hour: "10 AM", label: "Chemistry"    },
  { day: "Fri", hour: "3 PM",  label: "Literature"   },
];

function ChatImagePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div
        className="overflow-hidden rounded-2xl border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        style={{ transform: "rotate(-1deg)" }}
      >
        {/* WhatsApp-style header */}
        <div className="flex items-center gap-2.5 bg-[#075E54] px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25A075] text-[11px] font-bold text-white">
            S
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[10px] font-bold leading-tight text-white">Santi</p>
            <p className="text-[8px] text-white/60">online</p>
          </div>
          <span className="text-[9px] text-white/50">9:41</span>
        </div>

        {/* Chat background */}
        <div className="bg-[#ECE5DD] px-3 py-2.5 space-y-1.5">
          {/* Received bubble */}
          <div className="max-w-[85%]">
            <div className="rounded-[10px] rounded-tl-none bg-white px-3 py-2 shadow-sm">
              <p className="text-left text-[10px] leading-snug text-[#0A0A0A]">
                Exam dates are confirmed! 📅
              </p>
              <div className="mt-1.5 space-y-[3px]">
                {[
                  { day: "Mon",  label: "Math"      },
                  { day: "Tue",  label: "Physics"   },
                  { day: "Wed",  label: "History"   },
                  { day: "Thu",  label: "Chemistry" },
                  { day: "Fri",  label: "Literature"},
                ].map(({ day, label }) => (
                  <div key={day} className="flex items-center gap-1.5 text-left">
                    <span className="w-6 shrink-0 text-[9px] font-semibold text-[#333]">{day}</span>
                    <span className="text-[9px] text-[#444]">→ {label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-right text-[8px] text-[#999]">9:38</p>
            </div>
          </div>

          {/* Sent bubble */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-[10px] rounded-tr-none bg-[#DCF8C6] px-3 py-2 shadow-sm">
              <p className="text-left text-[10px] leading-snug text-[#0A0A0A]">
                got it, Calendarito already scheduled it for me 😎
              </p>
              <p className="mt-1 text-right text-[8px] text-[#999]">✓✓ 9:41</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarImageDemoAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("upload");
  const [visibleEvents, setVisibleEvents] = useState<CalEvent[]>([]);
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

        await sleep(1100);
        if (cancelledRef.current) return;

        setPhase("image-ready");
        await sleep(shouldReduceMotion ? 0 : 2200);
        if (cancelledRef.current) return;

        setPhase("sending");
        await sleep(shouldReduceMotion ? 0 : 700);
        if (cancelledRef.current) return;

        setPhase("processing");
        await sleep(shouldReduceMotion ? 0 : 1500);
        if (cancelledRef.current) return;

        setPhase("calendar");
        for (const event of EVENTS) {
          if (cancelledRef.current) return;
          setVisibleEvents((prev) => [...prev, event]);
          await sleep(shouldReduceMotion ? 0 : 500);
        }

        await sleep(4500);
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
            className="p-5"
          >
            <AnimatePresence mode="wait">
              {phase === "upload" ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E8E8E8] py-10"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F5]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#BBBBBB" strokeWidth="1.8"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="#BBBBBB" strokeWidth="1.5"/>
                      <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-[#BBBBBB]">Drop a screenshot of your chat</p>
                </motion.div>
              ) : (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  className="rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-3"
                >
                  {/* File row */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#3B82F6" strokeWidth="1.8"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="#3B82F6" strokeWidth="1.5"/>
                        <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0A0A0A]">
                        chat_exams.jpg
                      </p>
                      <p className="text-xs text-[#AAAAAA]">1.2 MB · Ready to send</p>
                    </div>

                    <motion.button
                      aria-label="Send"
                      animate={
                        phase === "sending"
                          ? {
                              scale: [1, 0.82, 1.05, 1],
                              backgroundColor: ["#E8E815", "#d4d410", "#E8E815", "#E8E815"],
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

                  {/* Chat preview */}
                  <ChatImagePreview />

                  {/* Processing dots */}
                  <AnimatePresence>
                    {phase === "processing" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                        className="flex items-center gap-1.5 px-1"
                      >
                        <p className="text-xs text-[#AAAAAA]">Reading image</p>
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
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
              {["Math exam next tuesday", "Lunch w/ Ana tomorrow", "Upload a file"].map((hint) => (
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
          // ── Weekly calendar ───────────────────────────────────────────
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <div className="flex items-center border-b border-[#F0F0F0] px-4 pt-4 pb-2">
              <div className="w-12" />
              {DAYS.map((day) => (
                <div key={day} className="flex-1 text-center">
                  <span className={`text-[11px] font-bold ${day === "Mon" ? "text-[#0A0A0A]" : "text-[#BBBBBB]"}`}>
                    {day}
                  </span>
                </div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: EVENTS.length * 0.5 + 0.4, type: "spring", stiffness: 500, damping: 22 }}
                className="ml-3 flex items-center gap-1.5 rounded-full bg-[#E8E815]/25 px-2.5 py-1"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#9A9A00]" />
                <p className="text-[10px] font-semibold text-[#777]">
                  {EVENTS.length} exams added
                </p>
              </motion.div>
            </div>

            <div className="pb-3">
              {HOURS.map((hour) => (
                <div key={hour} className="flex" style={{ height: 72 }}>
                  <div className="w-12 shrink-0 pr-3 pt-1 text-right text-[10px] leading-none text-[#CCCCCC]">
                    {hour}
                  </div>
                  {DAYS.map((day) => {
                    const event = visibleEvents.find(
                      (e) => e.day === day && e.hour === hour,
                    );
                    return (
                      <div
                        key={day}
                        className="relative flex-1 border-t border-l border-[#F5F5F5] first:border-l-0"
                      >
                        <AnimatePresence>
                          {event && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.75, y: 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 380, damping: 22 }}
                              className="absolute inset-[3px] rounded-lg bg-[#E8E815] px-2 py-1.5 shadow-sm"
                            >
                              <p className="text-[10px] font-black leading-tight text-[#0A0A0A]">
                                {event.label}
                              </p>
                              <p className="text-[9px] text-[#666]">{hour}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
