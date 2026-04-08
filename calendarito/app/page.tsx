"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { HeroDemoCarousel } from "@/components/HeroDemoCarousel";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <circle cx="28" cy="28" r="28" fill="#E8E815"/>
  <path d="M28 44V12M28 12L14 26M28 12L42 26" stroke="#0A0A0A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="56" viewBox="0 0 320 56">
  <circle cx="28" cy="28" r="28" fill="#E8E815"/>
  <path d="M28 44V12M28 12L14 26M28 12L42 26" stroke="#0A0A0A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="72" y="39" font-family="Poppins, system-ui, sans-serif" font-size="30" font-weight="700" letter-spacing="-1" fill="#0A0A0A">Calendarito</text>
</svg>`;

function downloadSvg(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LogoDropdown() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(LOGO_MARK_SVG);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1400);
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2"
        aria-label="Calendarito logo menu"
      >
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
        <span className="font-heading text-[15px] font-bold tracking-[-0.03em]">
          Calendarito
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 min-w-[175px] overflow-hidden rounded-xl border border-[#EBEBEB] bg-white py-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <button
            onClick={handleCopy}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[#0A0A0A] transition-colors hover:bg-[#F5F5F5]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F0F0F0]">
              {copied ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="#0A0A0A" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </span>
            <span>{copied ? "Copied!" : "Copy logo as SVG"}</span>
          </button>

          <button
            onClick={() => { downloadSvg(LOGO_MARK_SVG, "calendarito-mark.svg"); setOpen(false); }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[#0A0A0A] transition-colors hover:bg-[#F5F5F5]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F0F0F0]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3M12 15l-4-4M12 15l4-4" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            Download mark
          </button>

          <button
            onClick={() => { downloadSvg(WORDMARK_SVG, "calendarito-wordmark.svg"); setOpen(false); }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[#0A0A0A] transition-colors hover:bg-[#F5F5F5]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#F0F0F0]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3M12 15l-4-4M12 15l4-4" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            Download wordmark
          </button>
        </div>
      )}
    </div>
  );
}

function WavySVG() {
  return (
    <svg
      viewBox="0 0 100 20"
      fill="none"
      className="block h-3 w-full"
      preserveAspectRatio="none"
    >
      <path
        d="M2 14 C14 4, 26 24, 38 14 S62 4, 74 14 S86 24, 98 14"
        stroke="#E8E815"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthenticated(Boolean(session));
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const ctaHref = "/get-started";
  const ctaLabel = "Start free";
  const heroContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.08 },
    },
  };
  const heroItem = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">
      {/* ── Nav floating pill ── */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <LogoDropdown />
          <div className="flex items-center">
            {authenticated ? (
              <Link
                href="/get-started"
                className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
              >
                Go to app
              </Link>
            ) : (
              <Link
                href="/login?next=/get-started"
                className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <motion.section
        className="flex flex-1 flex-col items-center px-6 pt-[60px] text-center"
        variants={heroContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={heroItem}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.35, ease: "easeOut" }
          }
          className="mx-auto mb-7 max-w-[820px] font-heading text-[clamp(44px,7vw,72px)] leading-[1.05] font-black tracking-[-0.04em] text-[#0A0A0A]"
        >
          Drop or type anything,
          <br />
          get events in your{" "}
          <span className="relative inline-block pb-2">
            Calendar
            <span className="pointer-events-none absolute right-0 bottom-0 left-0">
              <WavySVG />
            </span>
          </span>
        </motion.h1>

        <motion.p
          variants={heroItem}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.32, ease: "easeOut" }
          }
          className="mx-auto mb-10 max-w-[460px] text-lg leading-[1.6] text-[#555]"
        >
          Create events in your Google Calendar, using natural language, files,
          or images. Share anything you want, and we handle the rest.
        </motion.p>

        <motion.div
          variants={heroItem}
          className="mb-16 flex flex-wrap justify-center gap-3"
        >
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <Link
              href={ctaHref}
              className="font-heading inline-flex h-[56px] w-[220px] items-center justify-center rounded-full bg-[#E8E815] px-9 py-4 text-base font-bold text-[#0A0A0A] no-underline transition-colors hover:bg-[#d4d512] [view-transition-name:cta-get-started]"
            >
              {ctaLabel}
            </Link>
          </motion.div>
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <Link
              href="/how-it-works"
              className="font-heading inline-flex h-[56px] w-[220px] items-center justify-center rounded-full bg-[#0A0A0A] px-9 py-4 text-base font-semibold text-white no-underline transition-colors hover:bg-[#333]"
            >
              See how it works
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={heroItem}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.38, ease: "easeOut" }
          }
          className="mb-16 w-full max-w-[820px]"
        >
          <HeroDemoCarousel />
        </motion.div>

        <p className="mx-auto max-w-[420px] text-xs text-[#999] pb-12">
          We never store or view your events. They are created directly in your
          Google Calendar.{" "}
          <Link href="/privacy" className="underline hover:text-[#0A0A0A]">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline hover:text-[#0A0A0A]">
            Terms of Service
          </Link>
          .
        </p>
      </motion.section>
    </div>
  );
}
