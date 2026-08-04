import Link from 'next/link';
import { CloudSun, Heart, Map, Mountain, Radar, Search, ShieldCheck, Train, TrendingUp } from 'lucide-react';

const productLinks = [
  { href: '/', label: 'Train Search', icon: Search },
  { href: '/#features', label: 'Features', icon: ShieldCheck },
  { href: '/route-finder', label: 'Route Finder', icon: Map },
  { href: '/favorites', label: 'Favorites', icon: Heart },
];

const highlights = [
  { label: 'Live status', icon: Radar },
  { label: 'Delay analytics', icon: TrendingUp },
  { label: 'Weather checks', icon: CloudSun },
  { label: 'Terrain profile', icon: Mountain },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/70 px-4 pb-24 pt-10 dark:border-slate-800/70 dark:bg-slate-950/70 md:pb-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-blue text-white shadow-glow">
              <Train className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Rail<span className="text-rail-blue">Gaadi</span>
            </span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            Live train tracking for Indian Railways with route maps, delay context, favorites, weather, and terrain details in one place.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Explore</h3>
          <div className="mt-4 grid gap-3">
            {productLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-rail-blue dark:text-slate-400 dark:hover:text-sky-300"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Highlights</h3>
          <div className="mt-4 grid gap-3">
            {highlights.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400"
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} RailGaadi. Built for fast railway lookups.</p>
        <p>Data freshness depends on connected rail, weather, map, and terrain APIs.</p>
      </div>
    </footer>
  );
}
