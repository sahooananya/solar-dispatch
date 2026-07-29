import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside `containerRef` while mounted, moves focus into
 * the first focusable child on mount, restores focus to the previously
 * focused element on unmount, and calls `onEscape` (if provided) when Escape
 * is pressed.
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  active: boolean,
  onEscape?: () => void,
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('data-focus-trap-ignore') && el.offsetParent !== null,
      );

    const first = focusables()[0];
    (first ?? container).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = els[0];
      const lastEl = els[els.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (activeEl === firstEl || !container.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (activeEl === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    container.addEventListener('keydown', onKey);
    return () => {
      container.removeEventListener('keydown', onKey);
      const prev = previouslyFocused.current;
      if (prev && document.body.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, onEscape]);
}
