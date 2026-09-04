"use client";

import {
  useCallback,
  useState,
  type KeyboardEvent,
  type RefCallback,
} from "react";

interface RovingFocusProps<T extends HTMLElement> {
  ref: RefCallback<T>;
  tabIndex: number;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<T>) => void;
}

export function useRovingFocus<T extends HTMLElement>(
  itemCount: number,
  onEscape?: () => void,
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [items] = useState<Array<T | null>>(() => []);

  const focusIndex = useCallback(
    (nextIndex: number) => {
      if (itemCount === 0) return;
      const normalizedIndex = (nextIndex + itemCount) % itemCount;
      setActiveIndex(normalizedIndex);
      items[normalizedIndex]?.focus();
    },
    [itemCount, items],
  );

  const getRovingProps = useCallback(
    (index: number): RovingFocusProps<T> => ({
      ref: (node) => {
        items[index] = node;
      },
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
      onKeyDown: (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusIndex(index + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusIndex(index - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          focusIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          focusIndex(itemCount - 1);
        } else if (event.key === "Escape" && onEscape) {
          event.preventDefault();
          onEscape();
        } else if (event.key === " " && event.currentTarget instanceof HTMLAnchorElement) {
          event.preventDefault();
          event.currentTarget.click();
        }
      },
    }),
    [activeIndex, focusIndex, itemCount, items, onEscape],
  );

  return { activeIndex, getRovingProps };
}
