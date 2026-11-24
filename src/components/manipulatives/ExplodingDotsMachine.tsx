import React, { useEffect, useRef, useState } from 'react';
import { ManipulativeProps } from '../../types';
import { playExplodeSound, playPopSound, playSnapSound } from '../../engine/audio';

type FlashType =
  | 'ones-to-tens'
  | 'tens-to-hundreds'
  | 'unexplode-ten'
  | 'unexplode-hundred'
  | null;

export const ExplodingDotsMachine: React.FC<ManipulativeProps> = ({
  config,
  onStateChange,
  highlightHint,
}) => {
  const [hundreds, setHundreds] = useState<number>(config.initialHundreds ?? 0);
  const [tens, setTens] = useState<number>(config.initialTens ?? 0);
  const [ones, setOnes] = useState<number>(config.initialOnes ?? 0);
  const [explosionsCount, setExplosionsCount] = useState<number>(0);
  const [unexplosionsCount, setUnexplosionsCount] = useState<number>(0);
  const [flash, setFlash] = useState<FlashType>(null);
  const [flashLabel, setFlashLabel] = useState<string>('');

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    setHundreds(config.initialHundreds ?? 0);
    setTens(config.initialTens ?? 0);
    setOnes(config.initialOnes ?? 0);
    setExplosionsCount(0);
    setUnexplosionsCount(0);
    setFlash(null);
    setFlashLabel('');
  }, [config]);

  useEffect(() => {
    onStateChangeRef.current({
      track: 'place-value',
      currentValue: hundreds * 100 + tens * 10 + ones,
      hundreds,
      tens,
      ones,
      explosionsCount,
      unexplosionsCount,
    });
  }, [hundreds, tens, ones, explosionsCount, unexplosionsCount]);

  const triggerFlash = (type: FlashType, label: string) => {
    setFlash(type);
    setFlashLabel(label);
    window.setTimeout(() => {
      setFlash((prev) => (prev === type ? null : prev));
    }, 900);
  };

  const handleLoadBoth = () => {
    if (config.addendA === undefined || config.addendB === undefined) return;
    const a = Math.max(0, Math.floor(config.addendA));
    const b = Math.max(0, Math.floor(config.addendB));
    const h = Math.floor(a / 100) + Math.floor(b / 100);
    const t = Math.floor((a % 100) / 10) + Math.floor((b % 100) / 10);
    const o = (a % 10) + (b % 10);
    setHundreds(h);
    setTens(t);
    setOnes(o);
    playPopSound();
  };

  const handleExplodeOnes = () => {
    if (ones < 10) return;
    setOnes((prev) => prev - 10);
    setTens((prev) => prev + 1);
    setExplosionsCount((prev) => prev + 1);
    playExplodeSound();
    triggerFlash('ones-to-tens', 'KABOOM! 10 → 1 ⚡');
  };

  const handleExplodeTens = () => {
    if (tens < 10) return;
    setTens((prev) => prev - 10);
    setHundreds((prev) => prev + 1);
    setExplosionsCount((prev) => prev + 1);
    playExplodeSound();
    triggerFlash('tens-to-hundreds', 'KABOOM! 10 → 1 ⚡');
  };

  const handleAutoExplodeAll = () => {
    if (ones < 10 && tens < 10) return;
    let nextOnes = ones;
    let nextTens = tens;
    let nextHundreds = hundreds;
    let count = 0;

    while (nextOnes >= 10) {
      nextOnes -= 10;
      nextTens += 1;
      count += 1;
    }
    while (nextTens >= 10) {
      nextTens -= 10;
      nextHundreds += 1;
      count += 1;
    }

    setOnes(nextOnes);
    setTens(nextTens);
    setHundreds(nextHundreds);
    setExplosionsCount((prev) => prev + count);
    playExplodeSound();
    triggerFlash('ones-to-tens', `KABOOM! ${count}× (10 → 1) ⚡`);
  };

  const handleUnexplodeTen = () => {
    if (tens < 1) return;
    setTens((prev) => prev - 1);
    setOnes((prev) => prev + 10);
    setUnexplosionsCount((prev) => prev + 1);
    playExplodeSound();
    triggerFlash('unexplode-ten', 'UN-EXPLODED! 1 Ten → 10 Ones ⚡');
  };

  const handleUnexplodeHundred = () => {
    if (hundreds < 1) return;
    setHundreds((prev) => prev - 1);
    setTens((prev) => prev + 10);
    setUnexplosionsCount((prev) => prev + 1);
    playExplodeSound();
    triggerFlash('unexplode-hundred', 'UN-EXPLODED! 1 Hundred → 10 Tens ⚡');
  };

  const total = hundreds * 100 + tens * 10 + ones;
  const isOverloaded = ones >= 10 || tens >= 10;

  // Group ones into 10-frames (each frame holds up to 10 dots in 2 rows of 5)
  const renderOnesFrames = () => {
    if (ones === 0) {
      return (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-slate-900/50 text-sm text-slate-400">
          Empty chamber — tap +1 to add dots!
        </div>
      );
    }

    const frameCount = Math.ceil(ones / 10);
    return (
      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
        {Array.from({ length: frameCount }).map((_, frameIdx) => {
          const dotsInFrame = Math.min(10, Math.max(0, ones - frameIdx * 10));
          const isOverflowFrame = frameIdx > 0 || ones >= 10;
          return (
            <div
              key={frameIdx}
              className={`rounded-xl border p-2.5 transition-all ${
                isOverflowFrame
                  ? 'border-amber-400/70 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border-amber-500/30 bg-slate-900/70'
              }`}
            >
              <div className="grid grid-cols-5 gap-2 place-items-center">
                {Array.from({ length: 10 }).map((__, slotIdx) => {
                  const filled = slotIdx < dotsInFrame;
                  return (
                    <div
                      key={slotIdx}
                      className={`h-6 w-6 rounded-full transition-all duration-200 ${
                        filled
                          ? 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.75)] ring-2 ring-amber-200/70 scale-100'
                          : 'border border-slate-700/80 bg-slate-800/40 scale-90'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-cyan-300 border border-cyan-400/30">
              1 ← 10 MACHINE
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Exploding Dots &amp; Base-10 Regrouping
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            10 dots in any chamber explode into 1 glowing piece in the chamber to the left!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {config.addendA !== undefined && config.addendB !== undefined && (
            <button
              type="button"
              onClick={handleLoadBoth}
              className="rounded-xl border border-violet-400/50 bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.45)] transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              ⚡ Load Both Numbers ({config.addendA} + {config.addendB})
            </button>
          )}
          {isOverloaded && (
            <button
              type="button"
              onClick={handleAutoExplodeAll}
              className="animate-pulse rounded-xl border border-amber-300/70 bg-gradient-to-r from-orange-500 to-rose-600 px-3.5 py-2 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              💥 Auto-Explode All!
            </button>
          )}
        </div>
      </div>

      {highlightHint && (
        <div className="mb-4 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-200 animate-pulse">
          💡 Hint active — try tapping +1 or 💥 KABOOM to regroup!
        </div>
      )}

      {/* Explosion Flash Banner */}
      {flash && (
        <div className="mb-4 flex items-center justify-center rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 py-2 px-4 text-center text-base font-black tracking-wide text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.5)] animate-bounce">
          {flashLabel}
        </div>
      )}

      {/* Three Side-by-Side Cosmic Chambers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* HUNDREDS CHAMBER */}
        <div
          className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
            flash === 'tens-to-hundreds'
              ? 'border-emerald-300 bg-emerald-500/20 shadow-[0_0_28px_rgba(16,185,129,0.5)]'
              : 'border-emerald-500/40 bg-[#1E293B]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Hundreds (100)
                </span>
                <div className="text-3xl font-black text-emerald-300">{hundreds}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={hundreds === 0}
                  onClick={() => {
                    setHundreds((h) => Math.max(0, h - 1));
                    playSnapSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-slate-600 bg-slate-800 text-lg font-black text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 active:scale-95 cursor-pointer"
                  aria-label="Remove 1 Hundred"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHundreds((h) => h + 1);
                    playPopSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-emerald-400/60 bg-emerald-600 text-lg font-black text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] transition hover:bg-emerald-500 active:scale-95 cursor-pointer"
                  aria-label="Add 1 Hundred"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Emerald 10x10 Flats */}
            <div className="min-h-[9rem] max-h-60 overflow-y-auto rounded-xl border border-emerald-500/20 bg-slate-900/60 p-2.5">
              {hundreds === 0 ? (
                <div className="flex h-28 items-center justify-center text-sm text-slate-400">
                  No 100-flats yet
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(hundreds, 18) }).map((_, idx) => (
                    <div
                      key={idx}
                      title="100 Flat (10×10)"
                      className="grid grid-cols-10 gap-[1px] rounded-md border border-emerald-300/70 bg-emerald-950/80 p-1 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                    >
                      {Array.from({ length: 100 }).map((__, cell) => (
                        <span key={cell} className="h-1 w-1 rounded-[1px] bg-emerald-400" />
                      ))}
                    </div>
                  ))}
                  {hundreds > 18 && (
                    <div className="flex items-center px-2 text-xs font-bold text-emerald-300">
                      +{hundreds - 18} more flats
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {hundreds >= 1 && (
              <button
                type="button"
                onClick={handleUnexplodeHundred}
                className="w-full rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-xs sm:text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/25 active:scale-95 cursor-pointer"
              >
                ⚡ Un-Explode 1 Hundred → 10 Tens
              </button>
            )}
          </div>
        </div>

        {/* TENS CHAMBER */}
        <div
          className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
            tens >= 10
              ? 'border-amber-400 bg-cyan-950/60 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
              : flash === 'ones-to-tens'
              ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_28px_rgba(34,211,238,0.5)]'
              : 'border-cyan-500/40 bg-[#1E293B]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Tens (10)
                </span>
                <div className="text-3xl font-black text-cyan-300">{tens}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={tens === 0}
                  onClick={() => {
                    setTens((t) => Math.max(0, t - 1));
                    playSnapSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-slate-600 bg-slate-800 text-lg font-black text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 active:scale-95 cursor-pointer"
                  aria-label="Remove 1 Ten"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTens((t) => t + 1);
                    playPopSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-cyan-400/60 bg-cyan-600 text-lg font-black text-white shadow-[0_0_12px_rgba(34,211,238,0.4)] transition hover:bg-cyan-500 active:scale-95 cursor-pointer"
                  aria-label="Add 1 Ten"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Cyan 10-Segment Vertical Energy Rods */}
            <div className="min-h-[9rem] max-h-60 overflow-y-auto rounded-xl border border-cyan-500/20 bg-slate-900/60 p-2.5">
              {tens === 0 ? (
                <div className="flex h-28 items-center justify-center text-sm text-slate-400">
                  No 10-rods yet
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(tens, 24) }).map((_, idx) => (
                    <div
                      key={idx}
                      title="10 Energy Rod"
                      className="flex flex-col gap-[2px] rounded-md border border-cyan-300/70 bg-cyan-950/90 p-1 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                    >
                      {Array.from({ length: 10 }).map((__, seg) => (
                        <span
                          key={seg}
                          className="h-2 w-3.5 rounded-[2px] bg-gradient-to-r from-cyan-300 to-sky-400"
                        />
                      ))}
                    </div>
                  ))}
                  {tens > 24 && (
                    <div className="flex items-center px-2 text-xs font-bold text-cyan-300">
                      +{tens - 24} more rods
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {tens >= 10 && (
              <button
                type="button"
                onClick={handleExplodeTens}
                className="w-full animate-pulse rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2.5 text-xs sm:text-sm font-black text-white shadow-[0_0_20px_rgba(245,158,11,0.65)] transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                💥 KABOOM! Explode 10 Tens → 1 Hundred!
              </button>
            )}
            {tens >= 1 && (
              <button
                type="button"
                onClick={handleUnexplodeTen}
                className="w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs sm:text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/25 active:scale-95 cursor-pointer"
              >
                ⚡ Un-Explode 1 Ten → 10 Ones
              </button>
            )}
          </div>
        </div>

        {/* ONES CHAMBER */}
        <div
          className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
            ones >= 10
              ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_24px_rgba(245,158,11,0.4)]'
              : 'border-amber-500/40 bg-[#1E293B]'
          }`}
        >
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Ones (1)
                </span>
                <div className="text-3xl font-black text-amber-300">{ones}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={ones === 0}
                  onClick={() => {
                    setOnes((o) => Math.max(0, o - 1));
                    playSnapSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-slate-600 bg-slate-800 text-lg font-black text-slate-200 transition hover:bg-slate-700 disabled:opacity-35 active:scale-95 cursor-pointer"
                  aria-label="Remove 1 One"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOnes((o) => o + 1);
                    playPopSound();
                  }}
                  className="h-11 w-11 rounded-xl border border-amber-400/60 bg-amber-600 text-lg font-black text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] transition hover:bg-amber-500 active:scale-95 cursor-pointer"
                  aria-label="Add 1 One"
                >
                  +1
                </button>
              </div>
            </div>

            {renderOnesFrames()}
          </div>

          <div className="mt-3 space-y-2">
            {ones >= 10 && (
              <button
                type="button"
                onClick={handleExplodeOnes}
                className="w-full animate-pulse rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500 to-rose-600 px-3 py-2.5 text-xs sm:text-sm font-black text-white shadow-[0_0_20px_rgba(245,158,11,0.65)] transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                💥 KABOOM! Explode 10 Ones → 1 Ten!
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Live Telemetry Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#1E293B] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-base sm:text-xl font-black">
          <span className="text-emerald-300">{hundreds * 100}</span>
          <span className="text-slate-400">+</span>
          <span className="text-cyan-300">{tens * 10}</span>
          <span className="text-slate-400">+</span>
          <span className="text-amber-300">{ones}</span>
          <span className="text-slate-400">=</span>
          <span className="rounded-lg bg-slate-900 px-3 py-1 text-white border border-slate-600 shadow-inner">
            {total}
          </span>
        </div>

        {isOverloaded ? (
          <div className="rounded-lg border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs sm:text-sm font-bold text-amber-200 animate-pulse">
            ⚠️ Chamber Overload! Hit 💥 KABOOM to regroup 10 into 1!
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span>Explosions: {explosionsCount}</span>
            <span>•</span>
            <span>Un-explosions: {unexplosionsCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplodingDotsMachine;
