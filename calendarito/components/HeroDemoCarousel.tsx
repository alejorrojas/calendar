"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDemoAnimation } from "@/components/CalendarDemoAnimation";
import { CalendarPDFDemoAnimation } from "@/components/CalendarPDFDemoAnimation";
import { CalendarImageDemoAnimation } from "@/components/CalendarImageDemoAnimation";

// How long each slide stays before auto-advancing
const SLIDE_DURATIONS = [9500, 17000, 14000];

const slides = [
  { key: "text",  label: "Type it in natural language",     Component: CalendarDemoAnimation      },
  { key: "pdf",   label: "Upload a PDF or document",        Component: CalendarPDFDemoAnimation   },
  { key: "image", label: "Share a photo or screenshot",     Component: CalendarImageDemoAnimation },
];

export function HeroDemoCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setActive((i) => (i + 1) % slides.length);
    }, SLIDE_DURATIONS[active]);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="relative w-full max-w-[820px] min-h-[520px]">
      {/* Slide label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={slides[active].key + "-label"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-[#AAAAAA]"
        >
          {slides[active].label}
        </motion.p>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {slides.map(
          ({ key, Component }, i) =>
            i === active && (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <Component />
              </motion.div>
            ),
        )}
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show demo ${i + 1}`}
            className={`h-[5px] rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-[#0A0A0A]" : "w-[5px] bg-[#CCCCCC]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
