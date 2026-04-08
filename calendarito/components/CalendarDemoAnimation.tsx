"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const PROMPT = "Team sync next mon 10 am";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];

type Phase = "typing" | "sending" | "calendar";

export function CalendarDemoAnimation() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedText, setTypedText] = useState("");
  const [showEvent, setShowEvent] = useState(false);
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

    const runSequence = async () => {
      while (!cancelledRef.current) {
        // ── Phase 1: typing ──────────────────────────────────────────
        setPhase("typing");
        setTypedText("");
        setShowEvent(false);

        await sleep(700);

        if (shouldReduceMotion) {
          setTypedText(PROMPT);
        } else {
          for (let i = 1; i <= PROMPT.length; i++) {
            if (cancelledRef.current) return;
            setTypedText(PROMPT.slice(0, i));
            await sleep(75);
          }
        }

        await sleep(500);
        if (cancelledRef.current) return;

        // ── Phase 2: send ─────────────────────────────────────────────
        setPhase("sending");
        await sleep(shouldReduceMotion ? 0 : 650);
        if (cancelledRef.current) return;

        // ── Phase 3: calendar ─────────────────────────────────────────
        setPhase("calendar");
        await sleep(shouldReduceMotion ? 0 : 350);
        if (cancelledRef.current) return;

        setShowEvent(true);
        await sleep(4200);
      }
    };

    runSequence();
    return () => {
      cancelledRef.current = true;
    };
  }, [shouldReduceMotion]);

  return (
    <div className="w-full max-w-[820px] mx-auto rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] overflow-hidden border border-black/[0.06]">
      <AnimatePresence mode="wait">
        {phase !== "calendar" ? (
          // ── Input panel ───────────────────────────────────────────────
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.22 } }}
            className="p-4"
          >
            {/* Input row */}
            <div className="flex items-end gap-3 rounded-2xl border border-[#E8E8E8] bg-white px-4 py-3 shadow-sm">
              <div className="relative flex-1 min-h-[22px]">
                {/* Placeholder */}
                {typedText === "" && (
                  <span className="pointer-events-none absolute inset-0 text-sm text-[#C0C0C0]">
                    What&apos;s on your schedule?
                  </span>
                )}
                <span className="text-sm text-[#0A0A0A]">
                  {typedText}
                </span>
                {/* blinking cursor */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="inline-block w-[2px] h-[14px] bg-[#0A0A0A] ml-px align-middle"
                />
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
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E8E815]"
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

            {/* Example hints */}
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
          // ── Calendar panel ────────────────────────────────────────────
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            {/* Calendar header row */}
            <div className="flex items-center border-b border-[#F0F0F0] px-3 pt-3 pb-2">
              <div className="w-10" />
              {DAYS.map((day) => (
                <div key={day} className="flex-1 text-center">
                  <span
                    className={`text-[11px] font-bold ${
                      day === "Mon" ? "text-[#0A0A0A]" : "text-[#BBBBBB]"
                    }`}
                  >
                    {day}
                  </span>
                  {day === "Mon" && (
                    <div className="mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E8E815] text-[10px] font-black text-[#0A0A0A]">
                      {/* next monday's date – keep it visual */}
                      14
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="pb-2">
              {HOURS.map((hour) => (
                <div key={hour} className="flex" style={{ height: 72 }}>
                  <div className="w-10 shrink-0 pr-2 pt-1 text-right text-[10px] leading-none text-[#CCCCCC]">
                    {hour}
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="relative flex-1 border-t border-l border-[#F5F5F5] first:border-l-0"
                    >
                      {day === "Mon" && hour === "10 AM" && showEvent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.75, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 22,
                            delay: 0.08,
                          }}
                          className="absolute inset-[3px] rounded-lg bg-[#E8E815] px-2 py-1 shadow-sm"
                        >
                          <p className="text-[10px] font-black leading-tight text-[#0A0A0A]">
                            Team sync
                          </p>
                          <p className="text-[9px] text-[#555555]">10:00 AM</p>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Success toast */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              className="px-4 pb-4"
            >
              <div className="flex items-center gap-2 rounded-xl bg-[#F5F5F5] px-3 py-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.7,
                    type: "spring",
                    stiffness: 500,
                    damping: 22,
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8E815]"
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="#0A0A0A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
                <p className="text-[11px] text-[#666]">
                  <span className="font-semibold text-[#0A0A0A]">
                    Team sync
                  </span>{" "}
                  added to your calendar — Monday, 10 AM
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
