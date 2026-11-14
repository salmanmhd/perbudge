"use client";

import { useEffect, useRef, useState } from "react";
import { useIsClient } from "@/hooks/use-media-query";

/**
 * Scroll-reveal wrapper. Content is visible by default (no JS / headless /
 * reduced-motion) and only animates in once mounted + in view, so a section
 * never ships blank.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const mounted = useIsClient();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = !mounted
    ? className
    : `${className} kh-reveal ${shown ? "kh-reveal-in" : ""}`;

  return (
    <Tag ref={ref} className={cls} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
