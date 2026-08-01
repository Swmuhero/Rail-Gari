'use client';

import { useQuery } from '@tanstack/react-query';
import { SearchResult } from '@/types/train';

async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  const url = `/api/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || !json?.success || !Array.isArray(json?.data)) {
    throw new Error('Failed to load train search results');
  }

  return json.data as SearchResult[];
}

export function useTrainSearch(query: string) {
  const trimmedQuery = query.trim();
  const { data = [], error, isError, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['trainSearch', trimmedQuery],
    queryFn: () => fetchSearchResults(trimmedQuery),
    staleTime: 5000,
    keepPreviousData: true,
  });

  return {
    data,
    isLoading,
    isError,
    error,
  };
}
