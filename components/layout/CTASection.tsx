'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Mail, MessageCircle, X } from 'lucide-react';

const EMAIL_ADDRESS = 'swapneel793@gmail.com';
const EMAIL_LINK = `mailto:${EMAIL_ADDRESS}`;

export function CTASection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDialogOpen]);

  return (
    <section className="relative isolate overflow-hidden border-y border-sky-200/80 bg-white px-4 py-24 text-center shadow-glass dark:border-sky-400/15 dark:bg-slate-950 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(2,132,199,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,132,199,0.08)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-rail-blue/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-rail-cyan/50 to-transparent" />

      <div className="mx-auto flex min-h-[360px] max-w-7xl flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-rail-blue shadow-glass dark:border-white/10 dark:bg-white/[0.04] dark:text-sky-200">
          <MessageCircle className="h-3.5 w-3.5" />
          Let&apos;s connect
        </div>

        <h2 className="mt-8 max-w-5xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
          Let&apos;s connect{' '}
          <span className="text-rail-blue">together.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
          Available anytime to catch up with you. I&apos;m just one click away.
        </p>

        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="mt-10 inline-flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-8 py-4 text-xs font-extrabold uppercase tracking-[0.32em] text-slate-950 shadow-glass transition-all hover:border-rail-blue/60 hover:bg-sky-50 hover:text-rail-blue focus:outline-none focus:ring-2 focus:ring-rail-blue focus:ring-offset-2 focus:ring-offset-white dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-rail-blue/15 dark:hover:text-sky-100 dark:focus:ring-offset-slate-950"
        >
          Start a conversation
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-md dark:bg-slate-950/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setIsDialogOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cta-dialog-title"
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-glass-hover dark:border-white/10 dark:bg-slate-950 sm:p-8"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                aria-label="Close dialog"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rail-blue/15 text-sky-300">
                <Mail className="h-5 w-5" />
              </div>

              <h3 id="cta-dialog-title" className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Let&apos;s connect together
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Send a message directly to my inbox and I&apos;ll get back to you.
              </p>

              <div className="mt-7">
                <a
                  href={EMAIL_LINK}
                  onClick={() => setIsDialogOpen(false)}
                  className="group flex items-center justify-between rounded-2xl border border-rail-blue/40 bg-rail-blue px-5 py-4 text-sm font-extrabold text-white shadow-glow transition-colors hover:bg-sky-600"
                >
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{EMAIL_ADDRESS}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
