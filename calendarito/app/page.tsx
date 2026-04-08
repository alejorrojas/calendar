'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function WavySVG() {
  return (
    <svg
      width="160"
      height="20"
      viewBox="0 0 160 20"
      fill="none"
      className="ml-1.5 inline-block align-middle"
    >
      <path d="M2 14 C22 4, 42 24, 62 14 S102 4, 122 14 S142 24, 158 14" stroke="#E8E815" strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(d => setAuthenticated(d.authenticated));
  }, []);

  const ctaHref  = authenticated ? '/app' : '/empezar';
  const ctaLabel = authenticated ? 'Ir a la app' : 'Empezar gratis';

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
            <Link
              href={ctaHref}
              className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
            >
              {ctaLabel}
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ── */}
      <section className="flex flex-1 flex-col items-center px-6 pt-[60px] text-center">
        <h1 className="mx-auto mb-7 max-w-[820px] font-heading text-[clamp(44px,7vw,72px)] leading-[1.05] font-black tracking-[-0.04em] text-[#0A0A0A]">
          Traé tus ideas<br />
          y creá eventos en<br />
          segundos<WavySVG />
        </h1>

        <p className="mx-auto mb-10 max-w-[460px] text-lg leading-[1.6] text-[#555]">
          Subí un archivo o pegá texto libre. Calendarito usa IA para estructurar todo y crear tus eventos en Google Calendar.
        </p>

        <div className="mb-16 flex flex-wrap justify-center gap-3">
          <Link
            href={ctaHref}
            className={`font-heading rounded-full bg-[#E8E815] px-9 py-4 text-base font-bold text-[#0A0A0A] no-underline transition-colors hover:bg-[#d4d512] ${
              !authenticated ? '[view-transition-name:cta-empezar]' : ''
            }`}
          >
            {ctaLabel}
          </Link>
          <Link
            href="/como-funciona"
            className="font-heading rounded-full bg-[#0A0A0A] px-9 py-4 text-base font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            Ver cómo funciona
          </Link>
        </div>

        <div className="mb-16 w-full max-w-[500px] overflow-hidden rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          <Image
            src="/hero-2.png"
            alt="Personaje organizando un calendario"
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
