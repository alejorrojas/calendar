"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const steps = [
  {
    title: "Connect your Google Calendar",
    description: "Grant access so we can create events in your account.",
  },
  {
    title: "Share your source",
    description:
      "Upload a file, PDF, image, or paste natural language with dates and details.",
  },
  {
    title: "We structure, you confirm",
    description:
      "We turn everything into clear events so you can review before creating them.",
  },
];

export default function HowItWorksPage() {
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.12 },
    },
  };
  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
    visible: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-home)] pt-[68px]">
      <div className="fixed top-0 right-0 left-0 z-50 bg-[var(--bg-home)] px-6 pt-4 pb-0">
        <nav className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-full bg-white px-4 py-2.5 pl-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
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
          </Link>
          <Link
            href="/login?next=/get-started"
            className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            Login
          </Link>
        </nav>
      </div>

      <section className="px-6 pb-8 pt-[56px] text-center">
        <h1 className="font-heading mx-auto mb-3 max-w-[900px] text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-4xl">
          From source to calendar in 3 steps
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-sm leading-6 text-[#555] md:text-base">
          This is the complete flow. First connect your account, then share your
          content, and finally review the events we prepared for your Google
          Calendar.
        </p>

        <div className="mx-auto w-full max-w-[500px] overflow-hidden rounded-[28px] border border-[#E4E4E4] bg-[#F7F7F7] shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
          <Image
            src="/bloom-mapa-2.png"
            alt="Calendarito flow map"
            width={500}
            height={375}
            quality={100}
            priority
            className="block h-auto w-full"
          />
        </div>
      </section>

      <section className="px-6 pb-14">
        <motion.div
          className="mx-auto grid w-full max-w-[900px] gap-3 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              variants={itemVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 320, damping: 24 }
              }
              className="rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
            >
              <div className="font-heading mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
                {index + 1}
              </div>
              <h2 className="font-heading mb-1.5 text-sm font-semibold text-[#0A0A0A]">
                {step.title}
              </h2>
              <p className="text-sm leading-5 text-[#666]">
                {step.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
