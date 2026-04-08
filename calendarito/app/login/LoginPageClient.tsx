'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { GOOGLE_CALENDAR_SCOPES } from '@/lib/google-oauth';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) {
    return '/empezar';
  }

  return next;
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [loggingIn, setLoggingIn] = useState(false);
  const nextPath = useMemo(() => getSafeNextPath(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(nextPath);
      }
    });
  }, [nextPath, router]);

  async function handleGoogleLogin() {
    try {
      setLoggingIn(true);
      const supabase = createSupabaseBrowserClient();

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${nextPath}`,
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
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em] text-[#0A0A0A]">Calendarito</span>
          </Link>
        </nav>
      </div>

      <section className="flex flex-1 items-center justify-center px-6 pb-16 pt-8">
        <motion.article
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26 }}
          className="w-full max-w-[460px] rounded-2xl border border-[#ECECEC] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >
          <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] text-[#0A0A0A]">Login</h1>
          <p className="mt-2 text-sm leading-6 text-[#555]">
            Continue with Google to connect your calendar and finish creating events.
          </p>
          <p className="mt-4 text-[13px] text-[#999]">
            By continuing, you agree to our{' '}
            <Link href="/privacy" className="text-[#0A0A0A] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <motion.button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={loggingIn}
            whileHover={shouldReduceMotion || loggingIn ? undefined : { y: -1, scale: 1.01 }}
            whileTap={shouldReduceMotion || loggingIn ? undefined : { scale: 0.98 }}
            className="font-heading mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-[#DDD] bg-white px-4 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-60"
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
            {loggingIn ? 'Connecting...' : 'Continue with Google'}
          </motion.button>
        </motion.article>
      </section>
    </main>
  );
}
