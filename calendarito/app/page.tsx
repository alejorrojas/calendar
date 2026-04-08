'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GOOGLE_CALENDAR_SCOPES } from '@/lib/google-oauth';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

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
  const [loggingIn, setLoggingIn] = useState(false);

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
  const ctaLabel = 'Empezar gratis';

  async function handleLogin() {
    try {
      setLoggingIn(true);
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/empezar`,
          scopes: GOOGLE_CALENDAR_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } finally {
      setLoggingIn(false);
    }
  }

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
                Ir a la app
              </Link>
            ) : (
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="font-heading inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[#DDD] bg-white px-4 py-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2087 1.125-.8427 2.0782-1.7964 2.715v2.2582h2.9086c1.7018-1.5668 2.6842-3.8732 2.6842-6.6141z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3441 0-4.3282-1.5827-5.0368-3.7091H1.9568v2.3318C3.4377 15.9832 6.0164 18 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.9632 10.7101C3.7832 10.1701 3.6818 9.5932 3.6818 9s.1014-1.1701.2814-1.7101V4.9582H1.9568C1.3473 6.1732 1 7.5482 1 9s.3473 2.8268.9568 4.0418l2.0064-2.3317z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.5809c1.3214 0 2.5082.4541 3.4423 1.3459l2.5814-2.5814C13.4632.8909 11.4259 0 9 0 6.0164 0 3.4377 2.0168 1.9568 4.9582l2.0064 2.3317C4.6718 5.1636 6.6559 3.5809 9 3.5809z"
                  />
                </svg>
                {loggingIn ? 'Conectando...' : 'Login'}
              </button>
            )}
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
            className="font-heading rounded-full bg-[#E8E815] px-9 py-4 text-base font-bold text-[#0A0A0A] no-underline transition-colors hover:bg-[#d4d512] [view-transition-name:cta-empezar]"
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
