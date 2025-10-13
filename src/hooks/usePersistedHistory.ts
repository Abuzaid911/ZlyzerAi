// hooks/usePersistedHistory.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { MAX_HISTORY_ITEMS } from "../constants/analysis";

export interface AnalysisItem {
  id: string;
  createdAt?: string; // Optional timestamp for sorting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type SetStateAction<T> = T | ((prev: T) => T);

function isQuotaError(err: unknown) {
  if (!(err instanceof Error)) return false;
  return err.name === "QuotaExceededError" ||
         /quota|storage|space/i.test(err.message);
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  // eslint-disable-next-line no-useless-catch
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch (err) {
    // Re-throw to let caller handle quota errors
    throw err;
  }
}

function safeRemoveItem(key: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Persist a bounded history list in localStorage with cross-tab sync,
 * deduping by `id`, and helper methods.
 *
 * @param key base localStorage key (we’ll namespace if provided)
 * @param maxItems max items to keep (default MAX_HISTORY_ITEMS)
 * @param namespace optional namespace, e.g. current user id/email
 */
export function usePersistedHistory<T extends AnalysisItem>(
  key: string,
  maxItems: number = MAX_HISTORY_ITEMS,
  namespace?: string
) {
  const storageKey = namespace ? `${key}:${namespace}` : key;
  const keyRef = useRef(storageKey);

  // Lazy init
  const [history, setHistoryState] = useState<T[]>(() => {
    try {
      const raw = safeGetItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]).slice(0, maxItems) : [];
    } catch (err) {
      console.error(`Failed to load history (${storageKey}):`, err);
      return [];
    }
  });

  // If storage key changes at runtime, reload from new key
  useEffect(() => {
    if (keyRef.current === storageKey) return;
    keyRef.current = storageKey;
    try {
      const raw = safeGetItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistoryState(Array.isArray(parsed) ? parsed.slice(0, maxItems) : []);
    } catch (err) {
      console.error(`Failed to switch history key to (${storageKey}):`, err);
      setHistoryState([]);
    }
  }, [storageKey, maxItems]);

  // Persist on change
  useEffect(() => {
    try {
      const limited = history.slice(0, maxItems);
      safeSetItem(storageKey, JSON.stringify(limited));
    } catch (err) {
      console.error(`Failed to persist history (${storageKey}):`, err);
      if (isQuotaError(err)) {
        try {
          // keep half to recover
          const limited = history.slice(0, Math.max(1, Math.floor(maxItems / 2)));
          safeSetItem(storageKey, JSON.stringify(limited));
          setHistoryState(limited);
        } catch (e) {
          console.error("Failed to recover from quota error", e);
        }
      }
    }
  }, [history, storageKey, maxItems]);

  // Cross-tab sync via 'storage' event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== storageKey) return;
      try {
        const raw = e.newValue;
        if (!raw) {
          setHistoryState([]);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistoryState(parsed.slice(0, maxItems));
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, maxItems]);

  // Core setter with bounding
  const setHistory = useCallback((value: SetStateAction<T[]>) => {
    setHistoryState((prev) => {
      const next = typeof value === "function" ? (value as (p: T[]) => T[])(prev) : value;
      return next.slice(0, maxItems);
    });
  }, [maxItems]);

  // Helpers
  const addItem = useCallback((item: T) => {
    setHistory((prev) => {
      // dedupe by id, move to front
      const filtered = prev.filter((x) => x.id && x.id !== item.id);
      return [item, ...filtered].slice(0, maxItems);
    });
  }, [setHistory, maxItems]);

  const upsertItem = useCallback((item: T) => {
    setHistory((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx === -1) return [item, ...prev].slice(0, maxItems);
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...item };
      // Optional: move updated to front
      return [copy[idx], ...copy.filter((_, i) => i !== idx)].slice(0, maxItems);
    });
  }, [setHistory, maxItems]);

  const removeById = useCallback((id: string) => {
    setHistory((prev) => prev.filter((x) => x.id !== id));
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistoryState([]);
    safeRemoveItem(storageKey);
  }, [storageKey]);

  // Optional: Get item by ID
  const getById = useCallback((id: string): T | undefined => {
    return history.find((x) => x.id === id);
  }, [history]);

  // Optional: Check if ID exists
  const hasId = useCallback((id: string): boolean => {
    return history.some((x) => x.id === id);
  }, [history]);

  return {
    history,
    setHistory,   // full replace (bounded)
    addItem,      // prepend + dedupe
    upsertItem,   // merge by id, move to front
    removeById,   // remove single
    clearHistory, // wipe all
    getById,      // find by id
    hasId,        // check existence
    storageKey,   // exposed for debugging
  } as const;
}
