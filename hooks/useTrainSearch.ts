'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
  const queryResult = useQuery<SearchResult[], Error>({
    queryKey: ['trainSearch', trimmedQuery],
    queryFn: () => fetchSearchResults(trimmedQuery),
    staleTime: 5000,
    placeholderData: keepPreviousData,
  });

  return {
    data: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
  };
}