import React, { useEffect, useRef, useState } from 'react';
import { ManipulativeProps } from '../../types';
import { playExplodeSound, playPopSound, playSnapSound } from '../../engine/audio';

const QUICK_DENOMINATORS = [1, 2, 3, 4, 6, 8, 10, 12];

export const FractionSplitterLab: React.FC<ManipulativeProps> = ({
  config,
  onStateChange,
  highlightHint,
}) => {
  const [denominator, setDenominator] = useState<number>(
    Math.max(1, config.initialDenominator ?? 2)
  );
  const [numerator, setNumerator] = useState<number>(
    Math.min(Math.max(0, config.initialNumerator ?? 1), Math.max(1, config.initialDenominator ?? 2))
  );

  const refDen = config.referenceDenominator;
  const refNum = config.referenceNumerator ?? 1;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    const den = Math.max(1, config.initialDenominator ?? 2);
    const num = Math.min(Math.max(0, config.initialNumerator ?? 1), den);
    setDenominator(den);
    setNumerator(num);
  }, [config]);

  const isEquivalentToTarget = Boolean(
    refDen && refDen > 0 && numerator * refDen === refNum * denominator
  );

  useEffect(() => {
    onStateChangeRef.current({
      track: 'fractions',
      currentValue: numerator,
      numerator,
      denominator,
      isEquivalentToTarget,
    });
  }, [numerator, denominator, isEquivalentToTarget]);

  const handleSliceClick = (sliceIdx: number) => {
    const nextNum = sliceIdx + 1 === numerator ? sliceIdx : sliceIdx + 1;
    setNumerator(nextNum);
    playPopSound();
  };

  const handleSetDenominator = (newDen: number) => {
    setDenominator(newDen);
    setNumerator((prev) => Math.min(prev, newDen));
    playSnapSound();
  };

  const handleSplitInTwo = () => {
    if (denominator * 2 > 24) return;
    setDenominator((d) => d * 2);
    setNumerator((n) => n * 2);
    playExplodeSound();
  };

  const handleMergePairs = () => {
    if (denominator % 2 !== 0 || numerator % 2 !== 0 || denominator < 2) return;
    setDenominator((d) => d / 2);
    setNumerator((n) => n / 2);
    playSnapSound();
  };

  const refPercent = refDen && refDen > 0 ? Math.min(100, Math.max(0, (refNum / refDen) * 100)) : null;

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-violet-300 border border-violet-400/30">
              EQUIVALENCE LAB
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Fraction Splitter &amp; Combiner
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Tap slices to shade them, slice bars into smaller pieces, and line up equal fractions!
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-[#1E293B] px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Your Fraction:
          </span>
          <span className="text-2xl font-black text-cyan-300">
            {numerator}/{denominator}
          </span>
        </div>
      </div>

      {highlightHint && (
        <div className="mb-3 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-200 animate-pulse">
          💡 Hint active — line up your shaded bar with the violet laser guide!
        </div>
      )}

      {/* Equivalence Detector Banner */}
      {refDen && refDen > 0 && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-2.5 transition-all ${
            isEquivalentToTarget
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'border-slate-700 bg-[#1E293B] text-slate-300'
          }`}
        >
          {isEquivalentToTarget ? (
            <span className="text-sm sm:text-base font-black">
              ✨ EQUIVALENT MATCH! {numerator}/{denominator} = {refNum}/{refDen}
            </span>
          ) : (
            <span className="text-xs sm:text-sm font-semibold">
              Compare your bar ({numerator}/{denominator}) to the target bar ({refNum}/{refDen}) using the laser guide!
            </span>
          )}
        </div>
      )}

      {/* Stacked Fraction Bars */}
      <div className="relative rounded-2xl border border-slate-700 bg-[#1E293B] p-4 sm:p-5 space-y-5">
        {/* Top Reference Bar */}
        {refDen && refDen > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
              <span className="uppercase tracking-wider text-violet-300">
                Reference Bar (Target)
              </span>
              <span className="text-sm font-black text-violet-200">
                {refNum}/{refDen}
              </span>
            </div>

            <div className="relative flex h-14 w-full overflow-hidden rounded-xl border-2 border-violet-400/60 bg-slate-900">
              {Array.from({ length: refDen }).map((_, idx) => {
                const isShaded = idx < refNum;
                return (
                  <div
                    key={idx}
                    className={`flex-1 border-r border-slate-800 last:border-r-0 flex items-center justify-center text-xs font-black transition-all ${
                      isShaded
                        ? 'bg-gradient-to-b from-violet-500 to-purple-600 text-white shadow-inner'
                        : 'bg-slate-900/70 text-slate-500'
                    }`}
                  >
                    1/{refDen}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Equivalence Laser Line dropping from Reference Bar into Workspace Bar */}
        {refPercent !== null && (
          <div className="relative h-0">
            <div
              aria-hidden="true"
              style={{ left: `${refPercent}%` }}
              className="pointer-events-none absolute -top-5 z-20 h-28 w-[3px] -translate-x-1/2 rounded-full bg-fuchsia-400 shadow-[0_0_14px_#e879f9]"
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                ▼
              </span>
            </div>
          </div>
        )}

        {/* Student Workspace Bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
            <span className="uppercase tracking-wider text-cyan-300">
              Your Workspace Bar (Tap Slices to Shade)
            </span>
            <span className="text-sm font-black text-cyan-200">
              {numerator}/{denominator}
            </span>
          </div>

          <div className="relative flex h-16 w-full overflow-hidden rounded-xl border-2 border-cyan-400/60 bg-slate-900 shadow-inner">
            {Array.from({ length: denominator }).map((_, idx) => {
              const isShaded = idx < numerator;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSliceClick(idx)}
                  className={`flex-1 border-r border-slate-800 last:border-r-0 flex items-center justify-center text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer ${
                    isShaded
                      ? isEquivalentToTarget
                        ? 'bg-gradient-to-b from-emerald-400 to-teal-600 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.3)]'
                        : 'bg-gradient-to-b from-cyan-400 to-sky-600 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.25)]'
                      : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {denominator <= 12 ? `1/${denominator}` : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hammer / Laser Split Controls */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-3.5">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Quick-Slice Denominator
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_DENOMINATORS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSetDenominator(d)}
                className={`h-10 min-w-[2.6rem] rounded-xl border px-2.5 text-sm font-black transition active:scale-95 cursor-pointer ${
                  denominator === d
                    ? 'border-cyan-300 bg-cyan-600 text-white shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                    : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {d === 1 ? '1 Whole' : `/${d}`}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-3.5 flex flex-col justify-center gap-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Laser Split &amp; Merge Tools
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={denominator * 2 > 24}
              onClick={handleSplitInTwo}
              className="flex-1 rounded-xl border border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3.5 py-2.5 text-xs sm:text-sm font-black text-white shadow-[0_0_14px_rgba(217,70,239,0.4)] transition hover:brightness-110 disabled:opacity-40 active:scale-95 cursor-pointer"
            >
              ✂️ Split Every Slice in 2 (×2)
            </button>
            <button
              type="button"
              disabled={denominator % 2 !== 0 || numerator % 2 !== 0 || denominator < 2}
              onClick={handleMergePairs}
              className="flex-1 rounded-xl border border-amber-400/50 bg-amber-500/20 px-3.5 py-2.5 text-xs sm:text-sm font-black text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-35 active:scale-95 cursor-pointer"
            >
              🔗 Merge Pairs (÷2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractionSplitterLab;
