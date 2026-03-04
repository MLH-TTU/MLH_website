"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

const TEXT = "Coming Soon";

// splits into spans so we don't need GSAP SplitText plugin
function splitToSpans(text: string) {
  return text.split("").map((ch, i) => (
    <span
      key={i}
      className="cs-char inline-block will-change-transform"
      aria-hidden="true"
    >
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

export default function ComingSoonPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spans = useMemo(() => splitToSpans(TEXT), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // reveal container (your original had visibility hidden)
    gsap.set(container, { autoAlpha: 1 });

    const lines = Array.from(container.querySelectorAll<HTMLElement>(".cs-line"));

    // collect chars per line
    const charsByLine = lines.map((line) =>
      Array.from(line.querySelectorAll<HTMLElement>(".cs-char"))
    );

    const calcTransformOrigin = () => {
      const width = window.innerWidth;
      const depth = -width / 8;
      return `50% 50% ${depth}px`;
    };

    // 3D setup
    gsap.set(lines, { perspective: 700, transformStyle: "preserve-3d" });

    const animTime = 0.9;
    const tl = gsap.timeline({ repeat: -1 });

    const applyTimeline = () => {
      const transformOrigin = calcTransformOrigin();
      tl.clear();

      charsByLine.forEach((chars, index) => {
        tl.fromTo(
          chars,
          { rotationX: -90 },
          {
            rotationX: 90,
            stagger: 0.08,
            duration: animTime,
            ease: "none",
            transformOrigin,
          },
          index * 0.45
        );
      });
    };

    applyTimeline();

    const onResize = () => {
      // update origin depth when viewport changes
      applyTimeline();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      tl.kill();
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-black relative">
      {/* Back to Home Button */}
      <a
        href="/"
        className="absolute top-8 left-8 z-50 group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ring-1 ring-white/20 hover:ring-white/40"
      >
        <svg 
          className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </a>

      {/* hidden until GSAP sets autoAlpha=1 */}
      <div
        ref={containerRef}
        className="flex min-h-screen w-full items-center justify-center opacity-0"
      >
        {/* tube */}
        <div className="relative w-full h-[24vw] max-h-[40vh] min-h-[180px]">
          {/* 4 lines, like your HTML */}
          {[0, 1, 2, 3].map((i) => (
            <h1
              key={i}
              className={[
                "cs-line",
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "m-0 whitespace-nowrap text-center leading-none",
                // tight tracking similar to your -0.6vw
                "tracking-[-0.06em]",
                // fits all screens: clamp(min, preferred, max)
                // tweak numbers if you want even bigger/smaller
                "text-[clamp(2.5rem,12vw,12rem)]",
                "font-extrabold text-white",
              ].join(" ")}
            >
              {/* aria text once, spans are aria-hidden */}
              <span className="sr-only">{TEXT}</span>
              {spans}
            </h1>
          ))}
        </div>
      </div>
    </main>
  );
}
