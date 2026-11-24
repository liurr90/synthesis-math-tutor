import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ManipulativeProps } from '../../types';
import { playRocketJumpSound, playSnapSound } from '../../engine/audio';

const FORWARD_THRUSTERS = [1, 2, 5, 10, 20, 100];
const BACKWARD_THRUSTERS = [-1, -2, -5, -10, -20, -100];

export const RocketNumberLine: React.FC<ManipulativeProps> = ({
  config,
  onStateChange,
  highlightHint,
}) => {
  const startPos = config.startNumber ?? 0;
  const targetNumber = config.targetNumber;

  const [currentPos, setCurrentPos] = useState<number>(startPos);
  const [jumps, setJumps] = useState<number[]>([]);

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    setCurrentPos(config.startNumber ?? 0);
    setJumps([]);
  }, [config]);

  useEffect(() => {
    onStateChangeRef.current({
      track: 'number-line',
      currentValue: currentPos,
      currentPos,
      jumps,
    });
  }, [currentPos, jumps]);

  const { minVal, maxVal } = useMemo(() => {
    const points = [startPos, currentPos];
    if (targetNumber !== undefined) points.push(targetNumber);

    // Track intermediate landing positions as well
    let pos = startPos;
    for (const j of jumps) {
      pos += j;
      points.push(pos);
    }

    const rawMin = Math.min(...points);
    const rawMax = Math.max(...points);

    let lo = Math.floor(rawMin / 10) * 10;
    let hi = Math.ceil(rawMax / 10) * 10;

    if (hi - lo < 20) {
      hi = lo + 20;
    } else {
      lo -= 5;
      hi += 5;
      lo = Math.floor(lo / 10) * 10;
      hi = Math.ceil(hi / 10) * 10;
    }

    return { minVal: lo, maxVal: hi };
  }, [startPos, currentPos, targetNumber, jumps]);

  const applyJump = (delta: number) => {
    setCurrentPos((prev) => prev + delta);
    setJumps((prev) => [...prev, delta]);
    playRocketJumpSound();
  };

  const handleUndo = () => {
    if (jumps.length === 0) return;
    const last = jumps[jumps.length - 1];
    setJumps((prev) => prev.slice(0, -1));
    setCurrentPos((prev) => prev - last);
    playSnapSound();
  };

  const handleReset = () => {
    setCurrentPos(startPos);
    setJumps([]);
    playSnapSound();
  };

  const remainderMod10 = ((currentPos % 10) + 10) % 10;
  const nextFriendlyDelta = remainderMod10 === 0 ? 0 : 10 - remainderMod10;
  const totalJumpDistance = jumps.reduce((sum, j) => sum + j, 0);

  // SVG Layout Constants
  const svgWidth = 860;
  const svgHeight = 230;
  const padX = 48;
  const lineY = 165;
  const usableWidth = svgWidth - padX * 2;
  const span = Math.max(1, maxVal - minVal);

  const valToX = (val: number) => padX + ((val - minVal) / span) * usableWidth;

  // Determine tick label density so labels never collide on wide ranges
  const majorStep = span <= 30 ? 5 : span <= 80 ? 10 : span <= 160 ? 20 : 50;
  const showAllSingleTicks = span <= 60;

  // Build jump arcs
  const arcData = useMemo(() => {
    const items: Array<{
      from: number;
      to: number;
      delta: number;
      idx: number;
    }> = [];
    let cursor = startPos;
    jumps.forEach((delta, idx) => {
      items.push({
        from: cursor,
        to: cursor + delta,
        delta,
        idx,
      });
      cursor += delta;
    });
    return items;
  }, [startPos, jumps]);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    const step = showAllSingleTicks ? 1 : 5;
    const firstTick = Math.ceil(minVal / step) * step;
    for (let v = firstTick; v <= maxVal; v += step) {
      arr.push(v);
    }
    return arr;
  }, [minVal, maxVal, showAllSingleTicks]);

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 text-slate-100 shadow-2xl">
      {/* Header & Equation Banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-violet-300 border border-violet-400/30">
              FRIENDLY-10 LAB
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Rocket Number Line
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Launch friendly jumps along the cosmic number track to reach your target!
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-[#1E293B] px-3.5 py-2 text-sm sm:text-base font-black">
          <span className="text-slate-300">Start: {startPos}</span>
          <span className="text-slate-500">|</span>
          <span className={totalJumpDistance >= 0 ? 'text-cyan-300' : 'text-amber-300'}>
            Jump: {totalJumpDistance >= 0 ? `+${totalJumpDistance}` : totalJumpDistance}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300">Landing: {currentPos}</span>
        </div>
      </div>

      {highlightHint && (
        <div className="mb-3 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-200 animate-pulse">
          💡 Hint active — use the Friendly-10 or +10/+1 thrusters below!
        </div>
      )}

      {/* Interactive SVG Number Line */}
      <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-700/80 bg-[#1E293B]/90 p-2 shadow-inner">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[620px] h-auto select-none"
          role="img"
          aria-label={`Rocket number line from ${minVal} to ${maxVal}, rocket at ${currentPos}`}
        >
          <defs>
            <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle friendly-10 vertical pillars */}
          {ticks
            .filter((v) => v % 10 === 0)
            .map((v) => {
              const x = valToX(v);
              return (
                <line
                  key={`pillar-${v}`}
                  x1={x}
                  y1={28}
                  x2={x}
                  y2={lineY}
                  stroke="rgba(34,211,238,0.16)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              );
            })}

          {/* Parabolic Jump Arcs */}
          {arcData.map((arc) => {
            const x1 = valToX(arc.from);
            const x2 = valToX(arc.to);
            const xMid = (x1 + x2) / 2;
            const distPx = Math.abs(x2 - x1);
            const arcHeight = Math.min(110, Math.max(36, distPx * 0.45 + (arc.idx % 2) * 14));
            const yCtrl = lineY - arcHeight;
            const labelY = lineY - arcHeight * 0.55 - 8;
            const isForward = arc.delta >= 0;
            const color = isForward ? '#22D3EE' : '#F59E0B';

            return (
              <g key={`arc-${arc.idx}`}>
                <path
                  d={`M ${x1} ${lineY} Q ${xMid} ${yCtrl} ${x2} ${lineY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  filter="url(#neonBlur)"
                />
                <circle cx={x2} cy={lineY} r={4} fill={color} />
                <rect
                  x={xMid - 20}
                  y={labelY - 12}
                  width={40}
                  height={18}
                  rx={6}
                  fill="#0F172A"
                  stroke={color}
                  strokeWidth={1.2}
                />
                <text
                  x={xMid}
                  y={labelY + 1}
                  textAnchor="middle"
                  fill={color}
                  fontSize="11"
                  fontWeight="800"
                >
                  {isForward ? `+${arc.delta}` : arc.delta}
                </text>
              </g>
            );
          })}

          {/* Main Cosmic Number Line Track */}
          <line
            x1={padX - 16}
            y1={lineY}
            x2={svgWidth - padX + 16}
            y2={lineY}
            stroke="url(#lineGlow)"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Tick Marks & Labels */}
          {ticks.map((v) => {
            const x = valToX(v);
            const isFriendlyTen = v % 10 === 0;
            const isFive = v % 5 === 0 && !isFriendlyTen;
            const showLabel = isFriendlyTen || v % majorStep === 0 || v === startPos || v === targetNumber;

            return (
              <g key={`tick-${v}`}>
                <line
                  x1={x}
                  y1={isFriendlyTen ? lineY - 14 : isFive ? lineY - 9 : lineY - 5}
                  x2={x}
                  y2={isFriendlyTen ? lineY + 14 : isFive ? lineY + 9 : lineY + 5}
                  stroke={isFriendlyTen ? '#22D3EE' : isFive ? '#A78BFA' : '#64748B'}
                  strokeWidth={isFriendlyTen ? 3 : isFive ? 2 : 1.2}
                />
                {showLabel && (
                  <text
                    x={x}
                    y={lineY + 32}
                    textAnchor="middle"
                    fill={isFriendlyTen ? '#67E8F9' : '#CBD5E1'}
                    fontSize={isFriendlyTen ? '14' : '11'}
                    fontWeight={isFriendlyTen ? '900' : '600'}
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          })}

          {/* Target Flag */}
          {targetNumber !== undefined && (
            <g transform={`translate(${valToX(targetNumber)}, ${lineY})`}>
              <circle
                cx={0}
                cy={0}
                r={9}
                fill="rgba(16,185,129,0.25)"
                stroke="#10B981"
                strokeWidth={2}
              />
              <text x={0} y={-22} textAnchor="middle" fontSize="22">
                🏁
              </text>
              <text
                x={0}
                y={-46}
                textAnchor="middle"
                fill="#34D399"
                fontSize="11"
                fontWeight="800"
              >
                Goal {targetNumber}
              </text>
            </g>
          )}

          {/* Rocket Icon at Current Position */}
          <g
            transform={`translate(${valToX(currentPos)}, ${lineY})`}
            style={{ transition: 'transform 260ms ease-out' }}
          >
            <circle
              cx={0}
              cy={0}
              r={10}
              fill="rgba(251,191,36,0.3)"
              stroke="#FBBF24"
              strokeWidth={2.5}
            />
            <text x={0} y={-16} textAnchor="middle" fontSize="26">
              🚀
            </text>
            <rect
              x={-20}
              y={-64}
              width={40}
              height={20}
              rx={7}
              fill="#0284C7"
              stroke="#7DD3FC"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={-50}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="900"
            >
              {currentPos}
            </text>
          </g>
        </svg>
      </div>

      {/* Jump Thruster Console */}
      <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-[#1E293B] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
            Forward Thrusters
          </span>

          {nextFriendlyDelta > 0 && (
            <button
              type="button"
              onClick={() => applyJump(nextFriendlyDelta)}
              className="rounded-xl border border-emerald-400/60 bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs sm:text-sm font-black text-white shadow-[0_0_15px_rgba(16,185,129,0.45)] transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              ✨ Jump to Next Friendly 10 (+{nextFriendlyDelta} → {currentPos + nextFriendlyDelta})
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FORWARD_THRUSTERS.map((step) => (
            <button
              key={`fwd-${step}`}
              type="button"
              onClick={() => applyJump(step)}
              className="rounded-xl border border-cyan-400/50 bg-cyan-500/15 py-2.5 text-base font-black text-cyan-200 shadow-sm transition hover:bg-cyan-500/30 active:scale-95 cursor-pointer"
            >
              +{step}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-amber-300">
            Backward Thrusters
          </span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BACKWARD_THRUSTERS.map((step) => (
              <button
                key={`bwd-${step}`}
                type="button"
                onClick={() => applyJump(step)}
                className="rounded-xl border border-amber-400/50 bg-amber-500/15 py-2.5 text-base font-black text-amber-200 shadow-sm transition hover:bg-amber-500/30 active:scale-95 cursor-pointer"
              >
                {step}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/80 pt-3">
          <div className="text-xs text-slate-400">
            {jumps.length === 0
              ? 'No jumps yet — fire a thruster!'
              : `Jumps (${jumps.length}): ${jumps
                  .map((j) => (j >= 0 ? `+${j}` : `${j}`))
                  .join(' , ')}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={jumps.length === 0}
              onClick={handleUndo}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40 active:scale-95 cursor-pointer"
            >
              ↩️ Undo Jump
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-200 transition hover:bg-rose-500/25 active:scale-95 cursor-pointer"
            >
              🔄 Reset Rocket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RocketNumberLine;
