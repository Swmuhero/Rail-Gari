'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Radar, Search } from 'lucide-react';

export function CTASection() {
  return (
    <section className="px-4 pb-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-glass dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:p-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
              <Radar className="h-3.5 w-3.5" />
              Live railway intelligence
            </div>
            <div className="space-y-3">
              <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Track your next train with live status, weather, and route insights.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Search by train number or name, save important trains, and jump back into live journey details whenever you need them.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-100"
            >
              <Search className="h-4 w-4" />
              Search trains
            </Link>
            <Link
              href="/favorites"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <Heart className="h-4 w-4" />
              Favorites
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
