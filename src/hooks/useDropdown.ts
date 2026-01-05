// hooks/useDropdown.ts
import { useCallback, useEffect, useRef, useState } from 'react';

type DropdownItem = HTMLAnchorElement | HTMLButtonElement | null;

interface UseDropdownReturn {
  open: boolean;
  toggle: () => void;
  close: () => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  registerItem: (index: number) => (el: DropdownItem) => void;
}

/**
 * Custom hook for managing accessible dropdown menus
 * Handles keyboard navigation, focus management, and click-outside closing
 */
export function useDropdown(): UseDropdownReturn {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemsRef = useRef<DropdownItem[]>([]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const registerItem = useCallback(
    (index: number) => (el: DropdownItem) => {
      itemsRef.current[index] = el;
    },
    []
  );

  useEffect(() => {
    if (!open) {
      itemsRef.current = [];
      setActiveIndex(0);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const container = containerRef.current;
      const trigger = triggerRef.current;
      if (!container || !trigger) return;
      if (!container.contains(target) && !trigger.contains(target)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
        return;
      }

      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        return;
      }

      event.preventDefault();

      const totalItems = itemsRef.current.length;
      if (!totalItems) return;

      if (event.key === 'Home') {
        setActiveIndex(0);
      } else if (event.key === 'End') {
        setActiveIndex(totalItems - 1);
      } else if (event.key === 'ArrowDown') {
        setActiveIndex((idx) => Math.min(idx + 1, totalItems - 1));
      } else if (event.key === 'ArrowUp') {
        setActiveIndex((idx) => Math.max(idx - 1, 0));
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const item = itemsRef.current[activeIndex];
    item?.focus();
  }, [activeIndex, open]);

  return {
    open,
    toggle,
    close,
    setOpen,
    setActiveIndex,
    containerRef,
    triggerRef,
    registerItem,
  };
}

