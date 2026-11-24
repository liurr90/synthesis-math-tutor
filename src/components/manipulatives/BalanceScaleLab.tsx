import React, { useEffect, useRef, useState } from 'react';
import { ManipulativeProps } from '../../types';
import { playExplodeSound, playPopSound, playSnapSound } from '../../engine/audio';

const WEIGHT_OPTIONS = [1, 2, 5, 10];

function decomposeAmount(amount: number): number[] {
  const result: number[] = [];
  let remaining = Math.max(0, Math.floor(amount));
  for (const unit of [10, 5, 2, 1]) {
    while (remaining >= unit) {
      result.push(unit);
      remaining -= unit;
    }
  }
  return result;
}

function subtractWeightAmount(weights: number[], amount: number): number[] {
  const exactIdx = weights.indexOf(amount);
  if (exactIdx !== -1) {
    return weights.filter((_, i) => i !== exactIdx);
  }
  const total = weights.reduce((s, w) => s + w, 0);
  if (total < amount) return weights;

  // Find smallest block larger than amount and break it down
  const largerIndices = weights
    .map((w, idx) => ({ w, idx }))
    .filter((item) => item.w > amount)
    .sort((a, b) => a.w - b.w);

  if (largerIndices.length > 0) {
    const target = largerIndices[0];
    const remainingBlocks = weights.filter((_, i) => i !== target.idx);
    return [...remainingBlocks, ...decomposeAmount(target.w - amount)];
  }

  // Otherwise re-decompose total - amount
  return decomposeAmount(total - amount);
}

export const BalanceScaleLab: React.FC<ManipulativeProps> = ({
  config,
  onStateChange,
  highlightHint,
}) => {
  const mysteryValue = config.mysteryValue ?? 5;
  const initLeftBoxes = config.leftBoxes ?? 1;
  const initLeftConstant = config.leftConstant ?? 3;
  const initRightBoxes = config.rightBoxes ?? 0;
  const initRightConstant = config.rightConstant ?? 8;

  const [leftBoxes, setLeftBoxes] = useState<number>(initLeftBoxes);
  const [leftWeights, setLeftWeights] = useState<number[]>(() =>
    decomposeAmount(initLeftConstant)
  );
  const [rightBoxes, setRightBoxes] = useState<number>(initRightBoxes);
  const [rightWeights, setRightWeights] = useState<number[]>(() =>
    decomposeAmount(initRightConstant)
  );

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    setLeftBoxes(config.leftBoxes ?? 1);
    setLeftWeights(decomposeAmount(config.leftConstant ?? 3));
    setRightBoxes(config.rightBoxes ?? 0);
    setRightWeights(decomposeAmount(config.rightConstant ?? 8));
  }, [config]);

  const leftWeightSum = leftWeights.reduce((sum, w) => sum + w, 0);
  const rightWeightSum = rightWeights.reduce((sum, w) => sum + w, 0);
  const leftTotal = leftBoxes * mysteryValue + leftWeightSum;
  const rightTotal = rightBoxes * mysteryValue + rightWeightSum;
  const isBalanced = leftTotal === rightTotal;
  const tiltAngle = Math.max(-16, Math.min(16, (rightTotal - leftTotal) * 2));

  useEffect(() => {
    onStateChangeRef.current({
      track: 'balance',
      currentValue:
        isBalanced && leftBoxes === 1 && leftWeightSum === 0 && rightBoxes === 0
          ? rightWeightSum
          : rightWeightSum,
      leftTotalWeight: leftTotal,
      rightTotalWeight: rightTotal,
      isBalanced,
      leftBoxCount: leftBoxes,
      leftWeightSum,
      rightBoxCount: rightBoxes,
      rightWeightSum,
    });
  }, [
    leftTotal,
    rightTotal,
    isBalanced,
    leftBoxes,
    leftWeightSum,
    rightBoxes,
    rightWeightSum,
  ]);

  const handleSubtractBoth = (amount: number) => {
    if (leftWeightSum < amount || rightWeightSum < amount) return;
    setLeftWeights((prev) => subtractWeightAmount(prev, amount));
    setRightWeights((prev) => subtractWeightAmount(prev, amount));
    playExplodeSound();
  };

  const handleReset = () => {
    setLeftBoxes(initLeftBoxes);
    setLeftWeights(decomposeAmount(initLeftConstant));
    setRightBoxes(initRightBoxes);
    setRightWeights(decomposeAmount(initRightConstant));
    playSnapSound();
  };

  const formatSide = (boxes: number, weightSum: number) => {
    const parts: string[] = [];
    if (boxes > 0) {
      parts.push(boxes === 1 ? '?' : `${boxes} × ?`);
    }
    if (weightSum > 0 || parts.length === 0) {
      parts.push(`${weightSum}`);
    }
    return parts.join(' + ');
  };

  // Beam trigonometry for SVG pan hangers
  const pivotX = 320;
  const pivotY = 85;
  const armLen = 195;
  const rad = (tiltAngle * Math.PI) / 180;
  const leftEndX = pivotX - armLen * Math.cos(rad);
  const leftEndY = pivotY - armLen * Math.sin(rad);
  const rightEndX = pivotX + armLen * Math.cos(rad);
  const rightEndY = pivotY + armLen * Math.sin(rad);

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-violet-300 border border-violet-400/30">
              MYSTERY BALANCE
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Algebraic Balance Scale
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Keep both pans balanced! Whatever you take off one side, take off the other to uncover ?.
          </p>
        </div>

        {/* Live Algebraic Equation */}
        <div className="rounded-xl border border-violet-400/40 bg-[#1E293B] px-4 py-2 text-base sm:text-lg font-black text-white">
          <span className="text-cyan-300">{formatSide(leftBoxes, leftWeightSum)}</span>
          <span
            className={`mx-2.5 ${
              isBalanced ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isBalanced ? '=' : leftTotal > rightTotal ? '>' : '<'}
          </span>
          <span className="text-amber-300">{formatSide(rightBoxes, rightWeightSum)}</span>
        </div>
      </div>

      {highlightHint && (
        <div className="mb-3 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-200 animate-pulse">
          💡 Hint active — subtract the same number from BOTH pans to isolate [ ? ]!
        </div>
      )}

      {/* Fulcrum Status Badge */}
      <div className="mb-3 flex justify-center">
        <div
          className={`rounded-full border px-4 py-1.5 text-xs sm:text-sm font-black transition-all ${
            isBalanced
              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
              : 'border-amber-400 bg-amber-500/20 text-amber-200'
          }`}
        >
          {isBalanced
            ? '⚖️ BALANCED! (Left = Right)'
            : `⚠️ Tilted (${leftTotal < rightTotal ? 'Right is heavier' : 'Left is heavier'})`}
        </div>
      </div>

      {/* Animated SVG Balance Beam + Interactive Pan Contents */}
      <div className="rounded-2xl border border-slate-700 bg-[#1E293B] p-3 sm:p-4">
        <svg
          viewBox="0 0 640 210"
          className="mx-auto w-full max-w-[640px] h-auto select-none"
          role="img"
          aria-label={`Balance scale tilted ${tiltAngle} degrees`}
        >
          {/* Base Stand */}
          <polygon
            points="270,198 370,198 332,92 308,92"
            fill="#334155"
            stroke="#64748B"
            strokeWidth={2}
          />
          <rect x="235" y="195" width="170" height="10" rx="5" fill="#475569" />

          {/* Tilting Beam */}
          <line
            x1={leftEndX}
            y1={leftEndY}
            x2={rightEndX}
            y2={rightEndY}
            stroke={isBalanced ? '#34D399' : '#FBBF24'}
            strokeWidth={8}
            strokeLinecap="round"
            style={{ transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
          <circle
            cx={pivotX}
            cy={pivotY}
            r={10}
            fill="#0F172A"
            stroke={isBalanced ? '#34D399' : '#FBBF24'}
            strokeWidth={4}
          />

          {/* Left Pan Hanger & Tray */}
          <g style={{ transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line
              x1={leftEndX}
              y1={leftEndY}
              x2={leftEndX - 42}
              y2={leftEndY + 62}
              stroke="#94A3B8"
              strokeWidth={2}
            />
            <line
              x1={leftEndX}
              y1={leftEndY}
              x2={leftEndX + 42}
              y2={leftEndY + 62}
              stroke="#94A3B8"
              strokeWidth={2}
            />
            <rect
              x={leftEndX - 58}
              y={leftEndY + 62}
              width={116}
              height={12}
              rx={6}
              fill="#38BDF8"
            />
            <text
              x={leftEndX}
              y={leftEndY + 90}
              textAnchor="middle"
              fill="#7DD3FC"
              fontSize="12"
              fontWeight="800"
            >
              Left Pan
            </text>
          </g>

          {/* Right Pan Hanger & Tray */}
          <g style={{ transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line
              x1={rightEndX}
              y1={rightEndY}
              x2={rightEndX - 42}
              y2={rightEndY + 62}
              stroke="#94A3B8"
              strokeWidth={2}
            />
            <line
              x1={rightEndX}
              y1={rightEndY}
              x2={rightEndX + 42}
              y2={rightEndY + 62}
              stroke="#94A3B8"
              strokeWidth={2}
            />
            <rect
              x={rightEndX - 58}
              y={rightEndY + 62}
              width={116}
              height={12}
              rx={6}
              fill="#FBBF24"
            />
            <text
              x={rightEndX}
              y={rightEndY + 90}
              textAnchor="middle"
              fill="#FDE68A"
              fontSize="12"
              fontWeight="800"
            >
              Right Pan
            </text>
          </g>
        </svg>

        {/* Interactive Pan Trays (Click any block/box to remove) */}
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Left Pan Contents */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-cyan-300">
              <span>LEFT PAN (tap item to remove)</span>
              <span>
                {leftBoxes > 0 ? `${leftBoxes}×? + ` : ''}
                {leftWeightSum}
              </span>
            </div>

            <div className="flex min-h-[3.25rem] flex-wrap items-center gap-2">
              {leftBoxes === 0 && leftWeights.length === 0 && (
                <span className="text-xs text-slate-500">Pan is empty</span>
              )}
              {Array.from({ length: leftBoxes }).map((_, idx) => (
                <button
                  key={`lbox-${idx}`}
                  type="button"
                  onClick={() => {
                    setLeftBoxes((b) => Math.max(0, b - 1));
                    playSnapSound();
                  }}
                  title="Tap to remove ? Mystery Box"
                  className="h-10 min-w-[2.75rem] rounded-xl border border-violet-300 bg-gradient-to-br from-violet-500 to-purple-700 px-2.5 text-sm font-black text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] transition hover:brightness-110 active:scale-90 cursor-pointer"
                >
                  [ ? ]
                </button>
              ))}
              {leftWeights.map((w, idx) => (
                <button
                  key={`lw-${idx}`}
                  type="button"
                  onClick={() => {
                    setLeftWeights((prev) => prev.filter((_, i) => i !== idx));
                    playSnapSound();
                  }}
                  title={`Tap to remove +${w}`}
                  className="h-10 min-w-[2.5rem] rounded-xl border border-cyan-300/70 bg-gradient-to-br from-cyan-500 to-sky-600 px-2.5 text-sm font-black text-white shadow-sm transition hover:brightness-110 active:scale-90 cursor-pointer"
                >
                  +{w}
                </button>
              ))}
            </div>
          </div>

          {/* Right Pan Contents */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-amber-300">
              <span>RIGHT PAN (tap item to remove)</span>
              <span>
                {rightBoxes > 0 ? `${rightBoxes}×? + ` : ''}
                {rightWeightSum}
              </span>
            </div>

            <div className="flex min-h-[3.25rem] flex-wrap items-center gap-2">
              {rightBoxes === 0 && rightWeights.length === 0 && (
                <span className="text-xs text-slate-500">Pan is empty</span>
              )}
              {Array.from({ length: rightBoxes }).map((_, idx) => (
                <button
                  key={`rbox-${idx}`}
                  type="button"
                  onClick={() => {
                    setRightBoxes((b) => Math.max(0, b - 1));
                    playSnapSound();
                  }}
                  title="Tap to remove ? Mystery Box"
                  className="h-10 min-w-[2.75rem] rounded-xl border border-violet-300 bg-gradient-to-br from-violet-500 to-purple-700 px-2.5 text-sm font-black text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] transition hover:brightness-110 active:scale-90 cursor-pointer"
                >
                  [ ? ]
                </button>
              ))}
              {rightWeights.map((w, idx) => (
                <button
                  key={`rw-${idx}`}
                  type="button"
                  onClick={() => {
                    setRightWeights((prev) => prev.filter((_, i) => i !== idx));
                    playSnapSound();
                  }}
                  title={`Tap to remove +${w}`}
                  className="h-10 min-w-[2.5rem] rounded-xl border border-amber-300/70 bg-gradient-to-br from-amber-500 to-orange-600 px-2.5 text-sm font-black text-white shadow-sm transition hover:brightness-110 active:scale-90 cursor-pointer"
                >
                  +{w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Controls & Algebra Helper Buttons */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-3">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
            Add to Left Pan
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WEIGHT_OPTIONS.map((w) => (
              <button
                key={`add-l-${w}`}
                type="button"
                onClick={() => {
                  setLeftWeights((prev) => [...prev, w]);
                  playPopSound();
                }}
                className="rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-sm font-black text-cyan-200 hover:bg-cyan-500/30 active:scale-95 cursor-pointer"
              >
                +{w}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setLeftBoxes((b) => b + 1);
                playPopSound();
              }}
              className="rounded-xl border border-violet-400/60 bg-violet-600/30 px-3 py-2 text-sm font-black text-violet-200 hover:bg-violet-600/50 active:scale-95 cursor-pointer"
            >
              +? Box
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-3">
          <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            Add to Right Pan
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WEIGHT_OPTIONS.map((w) => (
              <button
                key={`add-r-${w}`}
                type="button"
                onClick={() => {
                  setRightWeights((prev) => [...prev, w]);
                  playPopSound();
                }}
                className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-sm font-black text-amber-200 hover:bg-amber-500/30 active:scale-95 cursor-pointer"
              >
                +{w}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRightBoxes((b) => b + 1);
                playPopSound();
              }}
              className="rounded-xl border border-violet-400/60 bg-violet-600/30 px-3 py-2 text-sm font-black text-violet-200 hover:bg-violet-600/50 active:scale-95 cursor-pointer"
            >
              +? Box
            </button>
          </div>
        </div>
      </div>

      {/* Symmetrical Subtraction Algebra Helpers */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-[#1E293B] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={leftWeightSum < 1 || rightWeightSum < 1}
            onClick={() => handleSubtractBoth(1)}
            className="rounded-xl border border-emerald-400/60 bg-emerald-600/25 px-3.5 py-2 text-xs sm:text-sm font-black text-emerald-200 transition hover:bg-emerald-600/40 disabled:opacity-35 active:scale-95 cursor-pointer"
          >
            🪄 Subtract 1 from BOTH Pans
          </button>
          <button
            type="button"
            disabled={leftWeightSum < 5 || rightWeightSum < 5}
            onClick={() => handleSubtractBoth(5)}
            className="rounded-xl border border-emerald-400/60 bg-emerald-600/25 px-3.5 py-2 text-xs sm:text-sm font-black text-emerald-200 transition hover:bg-emerald-600/40 disabled:opacity-35 active:scale-95 cursor-pointer"
          >
            🪄 Subtract 5 from BOTH Pans
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-200 transition hover:bg-rose-500/25 active:scale-95 cursor-pointer"
        >
          🔄 Reset Scale
        </button>
      </div>
    </div>
  );
};

export default BalanceScaleLab;
