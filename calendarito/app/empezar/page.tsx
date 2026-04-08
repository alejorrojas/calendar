import Link from 'next/link';

const STEPS = [
  {
    title: 'Conectar tu Google Calendar',
    description: 'Te pedimos permiso para crear eventos en tu calendario.',
  },
  {
    title: 'Compartir tus eventos',
    description: 'Podés subir un archivo o escribirlos en texto libre.',
  },
  {
    title: 'IA los estructura y vos confirmás',
    description: 'Transformamos el contenido en eventos claros para revisar antes de crear.',
  },
];

export default function EmpezarPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-home)] px-6 py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-[#E6E6E6] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] md:p-10">
        <p className="font-heading mb-3 text-xs font-semibold tracking-[0.08em] text-[#777] uppercase">
          Antes de empezar
        </p>
        <h1 className="font-heading mb-3 text-3xl font-bold tracking-[-0.03em] text-[#0A0A0A] md:text-4xl">
          Esto es lo que vamos a hacer
        </h1>
        <p className="mb-8 max-w-xl text-sm leading-6 text-[#555] md:text-base">
          Calendarito usa IA para transformar archivos o texto libre en eventos de Google Calendar.
          No publicamos nada automaticamente: primero revisas todo y despues confirmas.
        </p>

        <div className="mb-8 space-y-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-[#EEE] bg-[#FCFCFC] px-4 py-3"
            >
              <div className="font-heading mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E815] text-xs font-bold text-[#0A0A0A]">
                {index + 1}
              </div>
              <div>
                <p className="font-heading text-sm font-semibold text-[#0A0A0A]">{step.title}</p>
                <p className="text-sm text-[#666]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/auth/login"
            className="font-heading inline-flex items-center gap-2 rounded-full bg-[#E8E815] px-6 py-3 text-sm font-bold text-[#0A0A0A] no-underline transition-colors hover:bg-[#d4d512] [view-transition-name:cta-empezar]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
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
            Conectar con Google
          </a>
          <Link
            href="/"
            className="font-heading rounded-full border-[1.5px] border-[#DDD] px-6 py-3 text-sm font-semibold text-[#555] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
          >
            Volver
          </Link>
        </div>
      </section>
    </main>
  );
}
