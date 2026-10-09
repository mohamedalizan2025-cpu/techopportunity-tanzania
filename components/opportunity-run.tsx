"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LANES = 3;
const TICKS_PER_SPAWN = 14;

interface FallingItem {
  id: number;
  lane: number;
  row: number;
  kind: "card" | "expired";
}

/**
 * Opportunity Run — tiny optional offline game. 100% offline: no network,
 * no analytics, no dependencies. Collect opportunity cards, avoid
 * expired-deadline obstacles. Keyboard (←/→, A/D, Space pause) + touch.
 * Secondary to core offline functionality.
 */
export function OpportunityRun() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [over, setOver] = useState(false);
  const idRef = useRef(1);
  const tickRef = useRef(0);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    try {
      reduceMotionRef.current =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduceMotionRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setScore(0);
    setMissed(0);
    setOver(false);
    setPaused(false);
    setLane(1);
    tickRef.current = 0;
  }, []);

  const start = useCallback(() => {
    reset();
    setRunning(true);
  }, [reset]);

  const move = useCallback(
    (delta: -1 | 1) => {
      if (!running || paused || over) return;
      setLane((l) => Math.min(LANES - 1, Math.max(0, l + delta)));
    },
    [running, paused, over]
  );

  useEffect(() => {
    if (!running || paused || over) return;
    const interval = reduceMotionRef.current ? 320 : 220;
    const timer = setTimeout(() => {
      tickRef.current += 1;
      setItems((prev) => {
        let next = prev
          .map((item) => ({ ...item, row: item.row + 1 }))
          .filter((item) => item.row < 6);
        // Resolve arrivals at the player row (row 5).
        const arrivals = next.filter((item) => item.row === 5);
        let gained = 0;
        let hitExpired = false;
        for (const item of arrivals) {
          if (item.lane !== lane) continue;
          if (item.kind === "card") gained += 1;
          else hitExpired = true;
        }
        if (gained > 0) setScore((s) => s + gained);
        if (hitExpired) {
          setMissed((m) => {
            const nextMissed = m + 1;
            if (nextMissed >= 3) setOver(true);
            return nextMissed;
          });
        }
        next = next.filter(
          (item) => !(item.row === 5 && item.lane === lane)
        );
        if (tickRef.current % TICKS_PER_SPAWN === 0) {
          const kind: FallingItem["kind"] =
            Math.random() < 0.62 ? "card" : "expired";
          next = [
            ...next,
            {
              id: idRef.current++,
              lane: Math.floor(Math.random() * LANES),
              row: 0,
              kind,
            },
          ];
        }
        return next;
      });
    }, interval);
    return () => clearTimeout(timer);
  }, [running, paused, over, lane, items.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        event.preventDefault();
        move(-1);
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        event.preventDefault();
        move(1);
      } else if (event.key === " " || event.key === "p" || event.key === "P") {
        if (running && !over) {
          event.preventDefault();
          setPaused((p) => !p);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, running, over]);

  return (
    <section
      aria-labelledby="opportunity-run-heading"
      className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
        Waiting for your connection?
      </p>
      <h2 id="opportunity-run-heading" className="mt-2 text-xl font-semibold">
        Play Opportunity Run
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Collect opportunity cards, dodge expired deadlines. Three expired
        hits end the run. Optional bonus — offline browsing stays the
        priority.
      </p>

      <div
        role="application"
        aria-label={`Opportunity Run. Score ${score}, misses ${missed} of 3.`}
        className="mt-4 overflow-hidden rounded-md border border-[var(--line)]"
      >
        <div className="grid grid-cols-3 gap-1 bg-[var(--muted-surface)] p-2" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const item = items.find((i) => i.row === row && i.lane === col);
            const isPlayer = row === 5 && col === lane;
            return (
              <div
                key={index}
                className={`flex h-9 items-center justify-center rounded text-sm font-bold sm:h-10 ${
                  isPlayer
                    ? "bg-[var(--brand)] text-white"
                    : item?.kind === "card"
                      ? "bg-[var(--verified-soft)] text-[var(--verified)]"
                      : item?.kind === "expired"
                        ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                        : "bg-[var(--surface)] text-transparent"
                }`}
              >
                {isPlayer ? "◆" : item?.kind === "card" ? "▣" : item ? "✕" : "·"}
              </div>
            );
          })}
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold">
        {over
          ? `Run over — score ${score}.`
          : running
            ? `Score ${score} · misses ${missed}/3${paused ? " · paused" : ""}`
            : "Press Start to play."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!running || over ? (
          <button
            type="button"
            onClick={start}
            className="button-primary min-h-11 px-5 text-sm"
          >
            {over ? "Restart run" : "Start run"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Move left"
              className="button-secondary min-h-11 min-w-11 px-4 text-sm"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Move right"
              className="button-secondary min-h-11 min-w-11 px-4 text-sm"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="button-secondary min-h-11 px-5 text-sm"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setRunning(false);
              }}
              className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[var(--muted)] underline-offset-4 hover:underline"
            >
              Quit
            </button>
          </>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
        Keyboard: ←/→ or A/D to move, Space to pause. Touch: use the arrow
        buttons. No network calls, no tracking.
      </p>
    </section>
  );
}
