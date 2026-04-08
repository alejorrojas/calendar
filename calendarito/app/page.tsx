'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

function WavySVG() {
  return (
    <svg
      viewBox="0 0 100 20"
      fill="none"
      className="block h-3 w-full"
      preserveAspectRatio="none"
    >
      <path d="M2 14 C14 4, 26 24, 38 14 S62 4, 74 14 S86 24, 98 14" stroke="#E8E815" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const ctaHref = '/empezar';
  const ctaLabel = 'Start free';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">

      {/* ── Nav floating pill ── */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em]">Calendarito</span>
          </div>
          <div className="flex items-center">
            {authenticated ? (
              <Link
                href="/empezar"
                className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
              >
                Go to app
              </Link>
            ) : (
              <Link
                href="/login?next=/empezar"
                className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section className="flex flex-1 flex-col items-center px-6 pt-[60px] text-center">
        <h1 className="mx-auto mb-7 max-w-[820px] font-heading text-[clamp(44px,7vw,72px)] leading-[1.05] font-black tracking-[-0.04em] text-[#0A0A0A]">
          Drop in anything,<br />
          get{' '}
          <span className="relative inline-block pb-2">
            calendar
            <span className="pointer-events-none absolute right-0 bottom-0 left-0">
              <WavySVG />
            </span>
          </span>
          <br />
          events
        </h1>

        <p className="mx-auto mb-10 max-w-[460px] text-lg leading-[1.6] text-[#555]">
          Use natural language, files, PDFs, or images. Share anything you want, and we handle the rest to create events in your Google Calendar.
        </p>

        <div className="mb-16 flex flex-wrap justify-center gap-3">
          <Link
            href={ctaHref}
            className="font-heading inline-flex h-[56px] w-[220px] items-center justify-center rounded-full bg-[#E8E815] px-9 py-4 text-base font-bold text-[#0A0A0A] no-underline transition-colors hover:bg-[#d4d512] [view-transition-name:cta-empezar]"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/como-funciona"
            className="font-heading inline-flex h-[56px] w-[220px] items-center justify-center rounded-full bg-[#0A0A0A] px-9 py-4 text-base font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            See how it works
          </Link>
        </div>

        <div className="mb-16 w-full max-w-[500px] overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <Image
            src="/hero-2.png"
            alt="Character organizing a calendar"
            width={500}
            height={375}
            className="block h-auto w-full"
            priority
          />
        </div>
      </section>

    </div>
  );
}
