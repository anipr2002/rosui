"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useState } from "react";

const ScrollContext = createContext({
  lenis: null as Lenis | null,
});

export const useSmoothScroller = () => useContext(ScrollContext);

export function SmoothScrollProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [lenisRef, setLenisRef] = useState<Lenis | null>(null);
  const [rafState, setRaf] = useState<number | null>(null);

  useEffect(() => {
    const scroller = new Lenis();
    let rf;

    function raf(time: number) {
      scroller.raf(time);
      requestAnimationFrame(raf);
    }

    rf = requestAnimationFrame(raf);
    setRaf(rf);
    setLenisRef(scroller);

    return () => {
      if (lenisRef && rafState) {
        cancelAnimationFrame(rafState);
        lenisRef.destroy();
      }
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis: lenisRef }}>
      {children}
    </ScrollContext.Provider>
  );
}
