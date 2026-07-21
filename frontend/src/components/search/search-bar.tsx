'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { searchApi as semanticSearchApi } from '@/lib/api/search';

interface SearchBarProps {
  onResults: (results: any[]) => void;
  onLoading: (isLoading: boolean) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResults, onLoading, onClear }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isFirstRender = useRef(true);
  const prevQuery = useRef('');

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onClear();
      return;
    }

    onLoading(true);
    try {
      const results = await semanticSearchApi.semanticSearch(searchQuery);
      onResults(results);
    } catch (error) {
      console.error('Semantic search failed:', error);
      onResults([]);
    } finally {
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
    <div className="relative w-full max-w-2xl">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gr-ink-soft group-focus-within:text-gr-board transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full bg-gr-paper border border-gr-line rounded-full py-3.5 pl-12 pr-12 font-sans text-gr-ink placeholder:text-gr-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-gr-board/30 focus:border-gr-board transition-all shadow-sm"
          placeholder="Cari hasil panen... (misal: 'sayur segar yang murah')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gr-ink-soft hover:text-gr-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Decorative focus glow */}
      <div className="absolute -inset-1 bg-gr-green/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10" />
    </div>
  );
};
