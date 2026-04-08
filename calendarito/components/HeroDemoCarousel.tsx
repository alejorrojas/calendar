"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDemoAnimation } from "@/components/CalendarDemoAnimation";
import { CalendarPDFDemoAnimation } from "@/components/CalendarPDFDemoAnimation";

// How long each slide stays before auto-advancing
const SLIDE_DURATIONS = [9500, 17000];

const slides = [
  { key: "text", Component: CalendarDemoAnimation },
  { key: "pdf", Component: CalendarPDFDemoAnimation },
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
    <div className="relative w-full max-w-[820px]">
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
