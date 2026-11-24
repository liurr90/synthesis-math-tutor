import React, { useEffect, useRef, useState } from 'react';
import { ManipulativeProps } from '../../types';
import { playExplodeSound, playPopSound, playSnapSound } from '../../engine/audio';

const MAX_DIM = 12;

export const EnergyArrayGrid: React.FC<ManipulativeProps> = ({
  config,
  onStateChange,
  highlightHint,
}) => {
  const initialRows = Math.min(MAX_DIM, Math.max(1, config.initialRows ?? config.targetRows ?? 3));
  const initialCols = Math.min(MAX_DIM, Math.max(1, config.initialCols ?? config.targetCols ?? 4));

  const [rows, setRows] = useState<number>(initialRows);
  const [cols, setCols] = useState<number>(initialCols);
  const [splitCol, setSplitCol] = useState<number>(0);
  const [rotated, setRotated] = useState<boolean>(false);

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    const r = Math.min(MAX_DIM, Math.max(1, config.initialRows ?? config.targetRows ?? 3));
    const c = Math.min(MAX_DIM, Math.max(1, config.initialCols ?? config.targetCols ?? 4));
    setRows(r);
    setCols(c);
    setSplitCol(0);
    setRotated(false);
  }, [config]);

  useEffect(() => {
    onStateChangeRef.current({
      track: 'arrays',
      currentValue: rows * cols,
      rows,
      cols,
      splitCol,
      rotated,
    });
  }, [rows, cols, splitCol, rotated]);

  const updateDimensions = (nextRows: number, nextCols: number) => {
    const r = Math.min(MAX_DIM, Math.max(1, nextRows));
    const c = Math.min(MAX_DIM, Math.max(1, nextCols));
    setRows(r);
    setCols(c);
    if (splitCol >= c) {
      setSplitCol(0);
    }
    playPopSound();
  };

  const handleRotate = () => {
    const nextRows = cols;
    const nextCols = rows;
    setRows(nextRows);
    setCols(nextCols);
    setRotated((prev) => !prev);
    if (splitCol >= nextCols) {
      setSplitCol(0);
    }
    playSnapSound();
  };

  const handleSplitChange = (colIdx: number) => {
    const clamped = colIdx >= cols || colIdx < 0 ? 0 : colIdx;
    setSplitCol(clamped);
    if (clamped > 0) {
      playExplodeSound();
    } else {
      playSnapSound();
    }
  };

  const totalCells = rows * cols;
  const hasSplit = splitCol > 0 && splitCol < cols;
  const leftProduct = rows * splitCol;
  const rightProduct = rows * (cols - splitCol);

  // Show at least 10x10 grid or expand to 12x12 if rows/cols > 10
  const gridDisplaySize = rows > 10 || cols > 10 ? 12 : 10;

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-[#0F172A] p-4 sm:p-5 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-emerald-300 border border-emerald-400/30">
              ARRAY &amp; LASER LAB
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Energy Array Grid
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Click any cell to build an array, rotate 90°, or slice it with the Distributive Laser!
          </p>
        </div>

        <button
          type="button"
          onClick={handleRotate}
          className="rounded-xl border border-violet-400/60 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-black text-white shadow-[0_0_15px_rgba(168,85,247,0.45)] transition hover:brightness-110 active:scale-95 cursor-pointer"
        >
          🔄 Rotate 90° ({rows}×{cols} → {cols}×{rows})
        </button>
      </div>

      {highlightHint && (
        <div className="mb-3 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-200 animate-pulse">
          💡 Hint active — tap cells in the grid or slice with the Distributive Laser!
        </div>
      )}

      {/* Controls & Grid Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Interactive Array Grid */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#1E293B] p-4">
          <div className="relative inline-block">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${gridDisplaySize}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: gridDisplaySize }).map((_, rIdx) => {
                const r = rIdx + 1;
                return Array.from({ length: gridDisplaySize }).map((__, cIdx) => {
                  const c = cIdx + 1;
                  const isActive = r <= rows && c <= cols;
                  const isLeftSplit = hasSplit && isActive && c <= splitCol;
                  const isRightSplit = hasSplit && isActive && c > splitCol;

                  let cellClass =
                    'border-slate-700/70 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-800';
                  if (isLeftSplit) {
                    cellClass =
                      'border-cyan-300 bg-gradient-to-br from-cyan-400 to-sky-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]';
                  } else if (isRightSplit) {
                    cellClass =
                      'border-amber-300 bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
                  } else if (isActive) {
                    cellClass =
                      'border-emerald-300 bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.55)]';
                  }

                  // Add neon magenta laser gap border on split edge
                  const isLaserEdge = hasSplit && r <= rows && c === splitCol;

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => updateDimensions(r, c)}
                      title={`Resize to ${r} rows × ${c} columns`}
                      className={`relative h-6 w-6 sm:h-7 sm:w-7 rounded-md border transition-all duration-150 active:scale-90 cursor-pointer ${cellClass}`}
                    >
                      {isLaserEdge && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-[5px] -top-1 -bottom-1 z-10 w-[3px] rounded-full bg-fuchsia-400 shadow-[0_0_12px_#e879f9]"
                        />
                      )}
                    </button>
                  );
                });
              })}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Showing {gridDisplaySize}×{gridDisplaySize} grid — active array:{' '}
            <span className="font-bold text-cyan-300">
              {rows} rows × {cols} columns
            </span>
          </div>
        </div>

        {/* Stepper & Laser Splitter Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 rounded-2xl border border-slate-700 bg-[#1E293B] p-4">
          {/* Row & Col Steppers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Rows
              </div>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  disabled={rows <= 1}
                  onClick={() => updateDimensions(rows - 1, cols)}
                  className="h-10 w-10 rounded-lg border border-slate-600 bg-slate-800 text-lg font-black text-white hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
                >
                  -
                </button>
                <span className="text-2xl font-black text-white">{rows}</span>
                <button
                  type="button"
                  disabled={rows >= MAX_DIM}
                  onClick={() => updateDimensions(rows + 1, cols)}
                  className="h-10 w-10 rounded-lg border border-cyan-400/50 bg-cyan-600 text-lg font-black text-white hover:bg-cyan-500 disabled:opacity-35 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Columns
              </div>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  disabled={cols <= 1}
                  onClick={() => updateDimensions(rows, cols - 1)}
                  className="h-10 w-10 rounded-lg border border-slate-600 bg-slate-800 text-lg font-black text-white hover:bg-slate-700 disabled:opacity-35 cursor-pointer"
                >
                  -
                </button>
                <span className="text-2xl font-black text-white">{cols}</span>
                <button
                  type="button"
                  disabled={cols >= MAX_DIM}
                  onClick={() => updateDimensions(rows, cols + 1)}
                  className="h-10 w-10 rounded-lg border border-emerald-400/50 bg-emerald-600 text-lg font-black text-white hover:bg-emerald-500 disabled:opacity-35 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Laser Splitter Controls */}
          <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-fuchsia-300">
                ✂️ Distributive Laser Splitter
              </span>
              <span className="text-xs font-bold text-fuchsia-200">
                {hasSplit ? `Split at col ${splitCol}` : 'No Split'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSplitChange(0)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition cursor-pointer ${
                  splitCol === 0
                    ? 'border-fuchsia-300 bg-fuchsia-600 text-white'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                None
              </button>
              {Array.from({ length: Math.max(0, cols - 1) }).map((_, i) => {
                const c = i + 1;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSplitChange(c)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition cursor-pointer ${
                      splitCol === c
                        ? 'border-fuchsia-300 bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(232,121,249,0.5)]'
                        : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Equations Readout */}
          <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/90 p-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Commutative Property
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              <span className="text-emerald-300">{rows} × {cols}</span>
              <span className="mx-2 text-slate-400">=</span>
              <span className="text-violet-300">{cols} × {rows}</span>
              <span className="mx-2 text-slate-400">=</span>
              <span className="rounded-lg bg-slate-800 px-2.5 py-0.5 text-cyan-300 border border-slate-600">
                {totalCells}
              </span>
            </div>

            {hasSplit && (
              <div className="border-t border-slate-700/80 pt-2 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  Distributive Split Equation
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-md bg-cyan-500/20 px-2 py-1 text-cyan-300 border border-cyan-400/40">
                    Left: {rows} × {splitCol} = {leftProduct}
                  </span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-1 text-amber-300 border border-amber-400/40">
                    Right: {rows} × {cols - splitCol} = {rightProduct}
                  </span>
                </div>
                <div className="text-sm font-black text-fuchsia-200 pt-1">
                  ({rows} × {splitCol}) + ({rows} × {cols - splitCol}) = {leftProduct} + {rightProduct} = {totalCells}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyArrayGrid;
