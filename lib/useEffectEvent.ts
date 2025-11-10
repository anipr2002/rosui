// Polyfill for useEffectEvent which is experimental and not available in Next.js SSR
import { useCallback, useRef, useLayoutEffect } from "react";

// This is a polyfill for the experimental useEffectEvent hook
// It's used by fumadocs-ui but not available in Next.js's SSR React bundle
export function useEffectEvent<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = useRef<T>(callback);

  useLayoutEffect(() => {
    ref.current = callback;
  });

  return useCallback((...args: any[]) => {
    const fn = ref.current;
    return fn(...args);
  }, []) as T;
}
