import React, { useState } from 'react';
import { Delete, RotateCcw, Rocket, CheckCircle2, Sparkles } from 'lucide-react';
import { PracticeStep } from '../types';
import { playPopSound } from '../engine/audio';

interface NumberPadProps {
  step: PracticeStep;
  value: string;
  onChange: (next: string) => void;
  onSubmitAnswer: (numericValue: number | null) => void;
  onCheckBuild?: () => void;
  workspaceMatchesGoal: boolean;
  isStepCompleted: boolean;
  onNextStep?: () => void;
  nextLabel?: string;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  step,
  value,
  onChange,
  onSubmitAnswer,
  onCheckBuild,
  workspaceMatchesGoal,
  isStepCompleted,
  onNextStep,
  nextLabel = '🚀 Next Step →',
}) => {
  const hasChoices = Array.isArray(step.choices) && step.choices.length > 0;
  const [inputMode, setInputMode] = useState<'choices' | 'keypad'>(
    hasChoices ? 'choices' : 'keypad',
  );

  // Sync mode when step changes if choices aren't available
  const effectiveMode = hasChoices ? inputMode : 'keypad';

  const handleDigit = (digit: string) => {
    if (isStepCompleted) return;
    playPopSound();
    if (value.length >= 6) return;
    onChange(value === '0' ? digit : `${value}${digit}`);
  };

  const handleBackspace = () => {
    if (isStepCompleted) return;
    playPopSound();
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (isStepCompleted) return;
    playPopSound();
    onChange('');
  };

  const handleSubmit = () => {
    const parsed = value.trim() === '' ? null : Number(value);
    onSubmitAnswer(parsed !== null && !Number.isNaN(parsed) ? parsed : null);
  };

  const showBuildButton =
    step.stage === 'discover' || Boolean(step.requireManipulativeBuild);

  if (isStepCompleted && onNextStep) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center glow-emerald">
        <div className="flex items-center gap-2 text-lg font-extrabold text-emerald-200">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <span>Discovery Locked In!</span>
        </div>
        <button
          type="button"
          onClick={onNextStep}
          className="mt-1 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
        >
          <span>{nextLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
          Your Cosmic Answer
        </span>

        {hasChoices && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setInputMode('choices')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                effectiveMode === 'choices'
                  ? 'bg-cyan-500/25 text-cyan-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quick Choices
            </button>
            <button
              type="button"
              onClick={() => setInputMode('keypad')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                effectiveMode === 'keypad'
                  ? 'bg-cyan-500/25 text-cyan-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Number Pad
            </button>
          </div>
        )}
      </div>

      {/* Big Look-What-I-Built button for discover/build steps */}
      {showBuildButton && onCheckBuild && (
        <button
          type="button"
          onClick={onCheckBuild}
          className={`mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-extrabold transition-all active:scale-[0.99] sm:text-base ${
            workspaceMatchesGoal
              ? 'border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse'
              : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span>✅ Look What I Built, Nova!</span>
        </button>
      )}

      {effectiveMode === 'choices' && step.choices ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {step.choices.map((choice) => {
            const isSelected = value === String(choice);
            return (
              <button
                key={choice}
                type="button"
                onClick={() => {
                  playPopSound();
                  onChange(String(choice));
                  onSubmitAnswer(choice);
                }}
                className={`rounded-2xl border py-4 text-xl font-extrabold transition-all active:scale-95 ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-500/25 text-white ring-2 ring-cyan-400/50'
                    : 'border-slate-700 bg-slate-800/80 text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Readout Display */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Answer:
            </span>
            <span className="min-h-[2rem] font-mono text-2xl font-extrabold tracking-wider text-cyan-300">
              {value || '—'}
            </span>
          </div>

          {/* 0-9 Tactile Number Pad */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="rounded-xl border border-slate-700 bg-slate-800/85 py-3 text-lg font-extrabold text-white transition-all hover:border-cyan-400/50 hover:bg-slate-700 active:scale-95"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleBackspace}
              aria-label="Backspace"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/70 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-slate-700 active:scale-95"
            >
              <Delete className="h-4 w-4" />
              <span>⌫</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/70 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 py-3.5 text-base font-extrabold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.99]"
          >
            <Rocket className="h-5 w-5" />
            <span>🚀 Check with Nova</span>
          </button>
        </div>
      )}
    </div>
  );
};
