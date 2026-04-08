'use client';

import Image from 'next/image';
import Link from 'next/link';

const steps = [
  {
    title: 'Conectás tu Google Calendar',
    description: 'Autorizás el acceso para que podamos crear eventos en tu cuenta.',
  },
  {
    title: 'Compartís tu información',
    description: 'Subís un archivo o pegás texto libre con fechas, temas y detalles.',
  },
  {
    title: 'La IA estructura y vos confirmás',
    description: 'Transformamos todo en eventos claros para revisar antes de crearlos.',
  },
];

export default function ComoFuncionaPage() {
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
            <span className="font-heading text-[15px] font-bold tracking-[-0.03em]">Calendarito</span>
          </Link>
          <Link
            href="/empezar"
            className="font-heading rounded-full bg-[#0A0A0A] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#333]"
          >
            Empezar gratis
          </Link>
        </nav>
      </div>

      <section className="px-6 pb-8 pt-[56px] text-center">
        <h1 className="font-heading mx-auto mb-3 max-w-[900px] text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-4xl">
          Del contenido al calendario en 3 pasos
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-sm leading-6 text-[#555] md:text-base">
          Este es el mapa general del flujo. Primero conectás tu cuenta, después compartís tu contenido
          y finalmente la IA te propone eventos para confirmar.
        </p>

        <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[28px] border border-[#E4E4E4] bg-[#F7F7F7] shadow-[0_12px_36px_rgba(0,0,0,0.1)]">
          <Image
            src="/api/flow-map"
            alt="Mapa visual del flujo de Calendarito"
            width={1024}
            height={576}
            className="block h-auto w-full"
            unoptimized
          />
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto grid w-full max-w-[900px] gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
              <div className="font-heading mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
                {index + 1}
              </div>
              <h2 className="font-heading mb-1.5 text-sm font-semibold text-[#0A0A0A]">{step.title}</h2>
              <p className="text-sm leading-5 text-[#666]">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
