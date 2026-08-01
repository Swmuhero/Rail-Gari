'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Clock, MapPin, Train } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SearchResult } from '@/types/train';

const LOCATIONS = [
  'New Delhi',
  'Mumbai Central',
  'Howrah',
  'Chennai Central',
  'Kolkata',
  'Bangalore City',
  'Lucknow',
  'Patna Junction',
  'Varanasi Junction',
  'Thiruvananthapuram',
  'Ahmedabad',
  'Hyderabad',
  'Pune',
  'Gorakhpur',
  'Amritsar',
  'Ranchi',
];

function estimateJourneyStatus(train: SearchResult) {
  const now = new Date();
  const epoch = now.getHours() * 60 + now.getMinutes();
  const seed = Number(train.number.slice(-2)) || 12;
  const departure = 360 + (seed % 240);
  const arrival = departure + 420;
  const hasDeparted = epoch >= departure;
  const hasArrived = epoch >= arrival;

  return {
    departedAt: `${Math.floor(departure / 60)
      .toString()
      .padStart(2, '0')}:${(departure % 60).toString().padStart(2, '0')}`,
    arrivesAt: `${Math.floor(arrival / 60)
      .toString()
      .padStart(2, '0')}:${(arrival % 60).toString().padStart(2, '0')}`,
    statusLabel: hasArrived ? 'Arrived' : hasDeparted ? 'In Transit' : 'Upcoming',
    statusColor: hasArrived ? 'bg-slate-100 text-slate-700' : hasDeparted ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700',
  };
}

function getTrainTypeLabel(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('memu') || normalized.includes('emu') || normalized.includes('passenger') || normalized.includes('local')) {
    return 'Local train';
  }
  if (normalized.includes('express') || normalized.includes('rajdhani') || normalized.includes('shatabdi') || normalized.includes('duronto') || normalized.includes('vande')) {
    return 'Express train';
  }
  return 'Train';
}

export default function RouteFinderPage() {
  const [origin, setOrigin] = useState('New Delhi');
  const [destination, setDestination] = useState('Mumbai Central');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({ origin, destination });
      const response = await fetch(`/api/route-finder?${query}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to fetch route suggestions');
      }

      const json = (await response.json()) as {
        success: boolean;
        data?: SearchResult[];
        error?: string;
      };

      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || 'Failed to load suggested trains');
      }

      setResults(json.data);
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch route suggestions');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      <div className="glass-panel rounded-3xl p-8 shadow-glass">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-rail-blue/10 px-3 py-1 text-xs font-semibold text-rail-blue">
              <MapPin className="h-4 w-4" />
              Route Finder
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Find trains between two stations.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Enter origin and destination to discover trains that have departed, are currently in transit, or are arriving soon.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 shadow-sm dark:bg-slate-900">
            <div className="text-xs uppercase tracking-widest text-slate-400">Quick tips</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Use full station names or common codes like NDLS, MMCT, HWH.</li>
              <li>Results are estimated for suggestion and updated live on the train detail page.</li>
              <li>If no trains appear, try a nearby major station or search by code.</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 shadow-glass grid gap-6 md:grid-cols-[1.5fr_1fr_0.85fr]">
        <div className="space-y-2">
          <label htmlFor="origin" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Origin station</label>
          <input
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            list="location-options"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-rail-blue focus:ring-2 focus:ring-rail-blue/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            placeholder="New Delhi or NDLS"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="destination" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Destination station</label>
          <input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            list="location-options"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-rail-blue focus:ring-2 focus:ring-rail-blue/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            placeholder="Mumbai Central or MMCT"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rail-blue px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:bg-sky-600"
          >
            <Search className="h-4 w-4" />
            Find trains
          </button>
        </div>
        <datalist id="location-options">
          {LOCATIONS.map((location) => (
            <option key={location} value={location} />
          ))}
        </datalist>
      </form>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Suggested trains</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoading
                ? 'Looking for trains...'
                : error
                  ? 'Something went wrong while loading route suggestions.'
                  : results.length > 0
                    ? `${results.length} train${results.length === 1 ? '' : 's'} matching ${origin} → ${destination}`
                    : hasSubmitted
                      ? `No trains found for ${origin} → ${destination}. Try a nearby major station or station code.`
                      : 'Submit origin and destination to see route suggestions.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Clock className="h-3.5 w-3.5" />
                Loading trains...
              </span>
            )}
            {error && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                {error}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {results.length === 0 && !isLoading && hasSubmitted && !error && (
            <div className="glass-panel rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No route matches were found for <strong>{origin}</strong> to <strong>{destination}</strong>.
              <div className="mt-2">Please try exact station codes like <strong>NDLS</strong>, <strong>MMCT</strong>, or a major nearby station.</div>
            </div>
          )}
          {results.map((train, index) => {
            const status = estimateJourneyStatus(train);
            return (
              <Link
                key={train.id}
                href={`/train/${train.number}`}
                className="glass-panel rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glass-hover"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rail-blue/10 text-rail-blue">
                      <Train className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Train #{train.number}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getTrainTypeLabel(train.name)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{train.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {train.origin.name} ({train.origin.code}) → {train.destination.name} ({train.destination.code})
                      </p>
                    </div>
                  </div>

                  <div className={cn('rounded-2xl px-3 py-2 text-sm font-semibold', status.statusColor)}>
                    {status.statusLabel}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Departed</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{status.departedAt}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Arrival</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{status.arrivesAt}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Route suggestion</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{Math.max(1, index + 1)} of {results.length}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
