'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Train, Search, Heart, Map, Moon, Sun, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useFavoritesStore } from '@/store/favorites';

const THEME_STORAGE_KEY = 'railgaadi-theme';

export function Navbar() {
  const pathname = usePathname();
  const { favorites } = useFavoritesStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';

    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const links = [
    { href: '/', label: 'Search', icon: Search, exact: true },
    { href: '/#features', label: 'Features', icon: Sparkles, exact: false },
    { href: '/route-finder', label: 'Routes', icon: Map, exact: false },
    { href: '/favorites', label: 'Favorites', icon: Heart, exact: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-6 py-3 shadow-glass">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-blue text-white shadow-glow transition-transform group-hover:scale-105">
            <Train className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Rail<span className="text-rail-blue">Gaadi</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-rail-blue/10 px-2 py-0.5 font-mono text-[10px] font-bold text-rail-blue">
              LIVE
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            const isFav = href === '/favorites';

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {isFav && favorites.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {favorites.length > 9 ? '9+' : favorites.length}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color mode"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
