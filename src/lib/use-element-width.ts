"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An element's content width, kept current as it resizes. null until the
 * browser has measured it, so the server and the first paint draw a
 * placeholder rather than a chart at a guessed width.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
