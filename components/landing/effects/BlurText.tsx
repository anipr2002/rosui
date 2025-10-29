//@ts-nocheck
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

interface BlurScrollEffectProps{
  children: React.ReactNode;
  className?: string;
  tag?: keyof React.JSX.IntrinsicElements;
  stagger?: number;
  duration?: number;
  ease?: string;
  skewAmount?: number;
  blurAmount?: number;
  delay?: number;
}

export function BlurText({
  children,
  className = "",
  tag: Tag = "p",
  stagger = 0.04,
  duration = 1.2,
  ease = "power2.out",
  skewAmount = 0,
  blurAmount = 10,
  delay = 0,
}: BlurScrollEffectProps) {
  const textRef = useRef<HTMLElement>(null);
  const splitInstanceRef = useRef<SplitType | null>(null);

  useEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    // Split text into words
    const splitText = new SplitType(textElement, {
      types: "words",
    });
    splitInstanceRef.current = splitText;

    // Set initial styles for all words
    gsap.set(splitText.words, {
      opacity: 0,
      skewX: skewAmount,
      filter: `blur(${blurAmount}px)`,
    });

    // Create the scroll trigger that plays the full animation when the first word hits center
    ScrollTrigger.create({
      trigger: textElement,
      start: "top center+=50%", // Triggers when the top of the element hits center + 50% (slightly below center)
      end: "bottom center-=50%", // Ends when bottom hits center - 50% (slightly above center)
      onEnter: () => {
        // Set will-change before animation
        gsap.set(splitText.words, { willChange: "filter, transform, opacity" });
        // Play full animation with delay, not tied to scroll position
        gsap.to(splitText.words, {
          opacity: 1,
          skewX: 0,
          filter: "blur(0px)",
          duration: duration,
          ease: ease,
          stagger: stagger,
          delay: delay,
          overwrite: "auto",
          onComplete: () => {
            // Remove will-change after animation completes
            gsap.set(splitText.words, { clearProps: "willChange" });
          },
        });
      },
      onLeaveBack: () => {
        // Reset animation when scrolling back up past the trigger
        gsap.set(splitText.words, {
          opacity: 0,
          skewX: skewAmount,
          filter: `blur(${blurAmount}px)`,
          overwrite: "auto",
        });
      },
    });

    // Handle window resize to re-split text
    const handleResize = () => {
      if (splitInstanceRef.current) {
        splitInstanceRef.current.split({});
      }
    };

    const debouncedResize = debounce(handleResize, 200); // Increased debounce for better performance
    window.addEventListener("resize", debouncedResize, { passive: true }); // Added passive flag

    // Cleanup function
    return () => {
      window.removeEventListener("resize", debouncedResize);
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === textElement) {
          trigger.kill();
        }
      });
      if (splitInstanceRef.current) {
        splitInstanceRef.current.revert();
      }
    };
  }, [stagger, duration, ease, skewAmount, blurAmount, delay]);

  const Component = Tag as React.ElementType;

  return (
    <Component ref={textRef} className={className}>
      {children}
    </Component>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
