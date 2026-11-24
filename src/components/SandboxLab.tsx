import React, { useState } from 'react';
import { FlaskConical, Sparkles, RotateCcw } from 'lucide-react';
import { ManipulativeConfig, TrackId, WorkspaceState } from '../types';
import { playPopSound } from '../engine/audio';
import { ExplodingDotsMachine } from './manipulatives/ExplodingDotsMachine';
import { RocketNumberLine } from './manipulatives/RocketNumberLine';
import { EnergyArrayGrid } from './manipulatives/EnergyArrayGrid';
import { FractionSplitterLab } from './manipulatives/FractionSplitterLab';
import { BalanceScaleLab } from './manipulatives/BalanceScaleLab';

interface SandboxPreset {
  id: string;
  label: string;
  description: string;
  config: ManipulativeConfig;
}

const SANDBOX_TOOLS: Array<{
  track: TrackId;
  label: string;
  icon: string;
  badgeColor: string;
  presets: SandboxPreset[];
}> = [
  {
    track: 'place-value',
    label: '⚡ Exploding Dots Machine',
    icon: '⚡',
    badgeColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/40 text-cyan-200',
    presets: [
      {
        id: 'pv-empty',
        label: 'Blank Base-10 Lab',
        description: 'Add dots freely and watch 10 explode into 1!',
        config: {
          track: 'place-value',
          mode: 'build',
          initialHundreds: 0,
          initialTens: 0,
          initialOnes: 0,
        },
      },
      {
        id: 'pv-67-48',
        label: 'Try 67 + 48',
        description: 'Start with 67, then add 4 tens & 8 ones to trigger double explosions!',
        config: {
          track: 'place-value',
          mode: 'add',
          addendA: 67,
          addendB: 48,
          initialHundreds: 0,
          initialTens: 6,
          initialOnes: 7,
          targetValue: 115,
        },
      },
      {
        id: 'pv-104',
        label: 'Unexplode 104',
        description: 'Try breaking a 100-dot into 10 tens!',
        config: {
          track: 'place-value',
          mode: 'subtract',
          initialHundreds: 1,
          initialTens: 0,
          initialOnes: 4,
        },
      },
    ],
  },
  {
    track: 'number-line',
    label: '🚀 Rocket Number Line',
    icon: '🚀',
    badgeColor: 'from-indigo-500/20 to-purple-500/20 border-indigo-400/40 text-indigo-200',
    presets: [
      {
        id: 'nl-28-64',
        label: 'Launch 28 → 64',
        description: 'Use friendly +10 and +1 hops to fly from 28 to 64.',
        config: {
          track: 'number-line',
          mode: 'jump',
          startNumber: 28,
          targetNumber: 64,
          minLine: 0,
          maxLine: 100,
        },
      },
      {
        id: 'nl-37-52',
        label: 'Difference 37 → 52',
        description: 'Bridge through 40 and 50 to discover the gap!',
        config: {
          track: 'number-line',
          mode: 'difference',
          startNumber: 37,
          targetNumber: 52,
          minLine: 20,
          maxLine: 70,
        },
      },
    ],
  },
  {
    track: 'arrays',
    label: '🟦 Energy Array Splitter',
    icon: '🟦',
    badgeColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/40 text-emerald-200',
    presets: [
      {
        id: 'arr-7x8',
        label: 'Try 7 × 8 Laser Split',
        description: 'Slice 7 × 8 into 7 × 5 + 7 × 3 with the distributive laser!',
        config: {
          track: 'arrays',
          mode: 'split',
          initialRows: 7,
          initialCols: 8,
          targetRows: 7,
          targetCols: 8,
          allowSplit: true,
        },
      },
      {
        id: 'arr-6x4',
        label: 'Rotate 6 × 4',
        description: 'Flip 6 × 4 into 4 × 6 to see why multiplication commutes!',
        config: {
          track: 'arrays',
          mode: 'multiply',
          initialRows: 6,
          initialCols: 4,
          allowSplit: true,
        },
      },
    ],
  },
  {
    track: 'fractions',
    label: '🧪 Fraction Bar Lab',
    icon: '🧪',
    badgeColor: 'from-pink-500/20 to-purple-500/20 border-pink-400/40 text-pink-200',
    presets: [
      {
        id: 'frac-half-sixth',
        label: 'Compare 1/2 and 3/6',
        description: 'See why 1/2 and 3/6 hold the exact same cosmic energy!',
        config: {
          track: 'fractions',
          mode: 'equivalent',
          referenceNumerator: 1,
          referenceDenominator: 2,
          initialNumerator: 3,
          initialDenominator: 6,
          targetNumerator: 3,
          targetDenominator: 6,
        },
      },
      {
        id: 'frac-2-3',
        label: 'Explore 2/3 Equivalents',
        description: 'Split the bar into 6, 9, or 12 parts to match 2/3.',
        config: {
          track: 'fractions',
          mode: 'equivalent',
          referenceNumerator: 2,
          referenceDenominator: 3,
          initialNumerator: 1,
          initialDenominator: 6,
          targetNumerator: 4,
          targetDenominator: 6,
        },
      },
    ],
  },
  {
    track: 'balance',
    label: '⚖️ Mystery Balance Scale',
    icon: '⚖️',
    badgeColor: 'from-amber-500/20 to-orange-500/20 border-amber-400/40 text-amber-200',
    presets: [
      {
        id: 'bal-2x-3-13',
        label: 'Mystery Box 2 × ? + 3 = 13',
        description: 'Remove 3 from both pans, then split evenly to reveal ? = 5!',
        config: {
          track: 'balance',
          mode: 'solve',
          mysteryValue: 5,
          leftBoxes: 2,
          leftConstant: 3,
          rightBoxes: 0,
          rightConstant: 13,
        },
      },
      {
        id: 'bal-2x-1x-7',
        label: 'Boxes on Both Sides: 2×? + 2 = ? + 9',
        description: 'Remove one Mystery Box from both pans at the same time!',
        config: {
          track: 'balance',
          mode: 'solve',
          mysteryValue: 7,
          leftBoxes: 2,
          leftConstant: 2,
          rightBoxes: 1,
          rightConstant: 9,
        },
      },
    ],
  },
];

export const SandboxLab: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('place-value');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pv-67-48');
  const [resetCounter, setResetCounter] = useState(0);
  const [liveState, setLiveState] = useState<WorkspaceState | null>(null);

  const activeTool =
    SANDBOX_TOOLS.find((t) => t.track === selectedTrack) ?? SANDBOX_TOOLS[0];
  const activePreset =
    activeTool.presets.find((p) => p.id === selectedPresetId) ??
    activeTool.presets[0];

  const handleSelectTrack = (track: TrackId) => {
    playPopSound();
    const tool = SANDBOX_TOOLS.find((t) => t.track === track) ?? SANDBOX_TOOLS[0];
    setSelectedTrack(track);
    setSelectedPresetId(tool.presets[0].id);
    setLiveState(null);
    setResetCounter((c) => c + 1);
  };

  const handleSelectPreset = (presetId: string) => {
    playPopSound();
    setSelectedPresetId(presetId);
    setLiveState(null);
    setResetCounter((c) => c + 1);
  };

  const renderManipulative = () => {
    const key = `${activePreset.id}-${resetCounter}`;
    switch (activeTool.track) {
      case 'place-value':
        return (
          <ExplodingDotsMachine
            key={key}
            config={activePreset.config}
            onStateChange={setLiveState}
          />
        );
      case 'number-line':
        return (
          <RocketNumberLine
            key={key}
            config={activePreset.config}
            onStateChange={setLiveState}
          />
        );
      case 'arrays':
        return (
          <EnergyArrayGrid
            key={key}
            config={activePreset.config}
            onStateChange={setLiveState}
          />
        );
      case 'fractions':
        return (
          <FractionSplitterLab
            key={key}
            config={activePreset.config}
            onStateChange={setLiveState}
          />
        );
      case 'balance':
        return (
          <BalanceScaleLab
            key={key}
            config={activePreset.config}
            onStateChange={setLiveState}
          />
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Intro Banner */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900/90 via-indigo-950/60 to-purple-950/50 p-6 shadow-xl glow-purple">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                🧪 Free Play Math Discovery Sandbox
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                No grades, no timers — experiment with all 5 cosmic math machines and test your own ideas!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playPopSound();
              setResetCounter((c) => c + 1);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4 text-cyan-400" />
            <span>Reset Machine</span>
          </button>
        </div>

        {/* Tool Switcher */}
        <div className="mt-5 flex flex-wrap gap-2">
          {SANDBOX_TOOLS.map((tool) => {
            const isSelected = tool.track === activeTool.track;
            return (
              <button
                key={tool.track}
                type="button"
                onClick={() => handleSelectTrack(tool.track)}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all sm:text-sm ${
                  isSelected
                    ? `bg-gradient-to-r ${tool.badgeColor} shadow-md`
                    : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Preset Experiments */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Try an Experiment:
          </span>
          {activeTool.presets.map((preset) => {
            const isActive = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                    : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-amber-400/35 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-cyan-200/90">{activePreset.description}</p>
      </div>

      {/* Active Manipulative */}
      <div>{renderManipulative()}</div>

      {/* Live Observation Bar */}
      {liveState && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-cyan-300">🔭 Live Lab Readout:</span>
          <span className="font-mono text-slate-200">
            {liveState.track === 'place-value' &&
              `Total = ${liveState.currentValue ?? 0} (${liveState.hundreds ?? 0}H, ${liveState.tens ?? 0}T, ${liveState.ones ?? 0}O)`}
            {liveState.track === 'number-line' &&
              `Rocket Position = ${liveState.currentPos ?? 0} | Hops = ${(liveState.jumps ?? []).join(', ') || 'None yet'}`}
            {liveState.track === 'arrays' &&
              `Grid = ${liveState.rows ?? 0} × ${liveState.cols ?? 0} = ${(liveState.rows ?? 0) * (liveState.cols ?? 0)} cells`}
            {liveState.track === 'fractions' &&
              `Shaded = ${liveState.numerator ?? 0}/${liveState.denominator ?? 1} ${liveState.isEquivalentToTarget ? '✨ Equivalent Match!' : ''}`}
            {liveState.track === 'balance' &&
              `Left: ${liveState.leftTotalWeight ?? 0} | Right: ${liveState.rightTotalWeight ?? 0} (${liveState.isBalanced ? '⚖️ Balanced!' : 'Tilted'})`}
          </span>
        </div>
      )}
    </div>
  );
};
