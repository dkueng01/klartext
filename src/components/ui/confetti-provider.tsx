"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import { TASK_COMPLETED_EVENT } from "@/lib/events";

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [burst, setBurst] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const celebrate = () => {
      if (reducedMotion.matches) return;

      setBurst((current) => current + 1);
      setIsCelebrating(true);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    document.addEventListener(TASK_COMPLETED_EVENT, celebrate);

    return () => {
      window.removeEventListener("resize", updateViewport);
      document.removeEventListener(TASK_COMPLETED_EVENT, celebrate);
    };
  }, []);

  return (
    <>
      {children}
      {isCelebrating && (
        <div
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
          aria-hidden="true"
        >
          <ReactConfetti
            key={burst}
            width={viewport.width}
            height={viewport.height}
            recycle={false}
            numberOfPieces={220}
            gravity={0.18}
            initialVelocityX={6}
            initialVelocityY={18}
            tweenDuration={2400}
            onConfettiComplete={() => setIsCelebrating(false)}
          />
        </div>
      )}
    </>
  );
}
