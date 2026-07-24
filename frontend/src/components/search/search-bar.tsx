'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { searchApi as semanticSearchApi } from '@/lib/api/search';

interface SearchBarProps {
  onResults: (results: unknown[]) => void;
  onLoading: (isLoading: boolean) => void;
  onClear: () => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onResults, 
  onLoading, 
  onClear,
  className = '',
  placeholder = "Cari hasil panen... (misal: 'sayur segar')"
}) => {
  const [query, setQuery] = useState('');
  const [loadingInternal, setLoadingInternal] = useState(false);
  const isFirstRender = useRef(true);
  const prevQuery = useRef('');

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onClear();
      return;
    }

    setLoadingInternal(true);
    onLoading(true);
    try {
      const results = await semanticSearchApi.semanticSearch(searchQuery);
      onResults(results);
    } catch (error) {
      console.error('Semantic search failed:', error);
      onResults([]);
    } finally {
      setLoadingInternal(false);
      onLoading(false);
    }
  }, [onResults, onLoading, onClear]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (query === prevQuery.current) {
      return;
    }

    prevQuery.current = query;

    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      } else {
        onClear();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, handleSearch, onClear]);

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative group flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Search className="h-4 w-4 text-gr-ink-soft group-focus-within:text-gr-board transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full bg-white/90 hover:bg-white focus:bg-white border border-gr-line hover:border-gr-ink-soft/40 focus:border-gr-board rounded-full py-2.5 pl-10 pr-9 font-sans text-xs text-gr-ink placeholder:text-gr-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-gr-board/20 transition-all shadow-2xs"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
          {loadingInternal ? (
            <Loader2 className="h-3.5 w-3.5 text-gr-board animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onClear();
              }}
              className="p-0.5 rounded-full hover:bg-gr-paper text-gr-ink-soft hover:text-gr-ink transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
