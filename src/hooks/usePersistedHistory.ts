// Hook to persist analysis history in local storage
import { useState, useEffect, useCallback } from 'react';
import { MAX_HISTORY_ITEMS } from '../constants/analysis';

interface AnalysisItem {
  id: string;
  [key: string]: any;
}

/**
 * Persists history to localStorage with automatic cleanup
 * @param key - localStorage key to use
 * @param maxItems - maximum number of items to keep
 */
export function usePersistedHistory<T extends AnalysisItem>(
  key: string,
  maxItems: number = MAX_HISTORY_ITEMS
) {
  const [history, setHistoryState] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, maxItems) : [];
    } catch (err) {
      console.error(`Failed to load history from localStorage (${key}):`, err);
      return [];
    }
  });

  // Persist to localStorage whenever history changes
  useEffect(() => {
    try {
      const limited = history.slice(0, maxItems);
      localStorage.setItem(key, JSON.stringify(limited));
    } catch (err) {
      console.error(`Failed to persist history to localStorage (${key}):`, err);
      // If quota exceeded, try clearing old data
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(key);
          const limited = history.slice(0, Math.floor(maxItems / 2));
          localStorage.setItem(key, JSON.stringify(limited));
        } catch {
          console.error('Failed to recover from quota exceeded error');
        }
      }
    }
  }, [history, key, maxItems]);

  const setHistory = useCallback((value: T[] | ((prev: T[]) => T[])) => {
    setHistoryState((prev) => {
      const newHistory = typeof value === 'function' ? value(prev) : value;
      return newHistory.slice(0, maxItems);
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setHistoryState([]);
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`Failed to clear history from localStorage (${key}):`, err);
    }
  }, [key]);

  return [history, setHistory, clearHistory] as const;
}

