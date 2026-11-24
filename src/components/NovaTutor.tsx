import React from 'react';
import { Volume2, Lightbulb, Sparkles, CheckCircle2, Compass } from 'lucide-react';
import { PracticeStep } from '../types';
import { speakText } from '../engine/audio';

interface NovaTutorProps {
  step: PracticeStep;
  stepIndex: number;
  totalSteps: number;
  voiceEnabled: boolean;
  hintIndex: number;
  onRevealHint: () => void;
  feedback: {
    type: 'success' | 'nudge' | 'workspace-ready';
    message: string;
  } | null;
  isCelebrating?: boolean;
}

const STAGE_BADGES: Record<
  PracticeStep['stage'],
  { label: string; classes: string }
> = {
  discover: {
    label: '1. 🔭 Discover',
    classes: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
  },
  guided: {
    label: '2. 🧭 Guided Build',
    classes: 'border-purple-400/40 bg-purple-500/15 text-purple-200',
  },
  practice: {
    label: '3. ⚡ Power Practice',
    classes: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  },
};

export const NovaTutor: React.FC<NovaTutorProps> = ({
  step,
  stepIndex,
  totalSteps,
  voiceEnabled,
  hintIndex,
  onRevealHint,
  feedback,
  isCelebrating = false,
}) => {
  const stageMeta = isCelebrating
    ? {
        label: '4. 🌟 Mastery',
        classes: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200',
      }
    : STAGE_BADGES[step.stage];

  const activeHint =
    hintIndex >= 0 && step.hints.length > 0
      ? step.hints[Math.min(hintIndex, step.hints.length - 1)]
      : null;

  const handleReadAloud = () => {
    speakText(step.voiceText || step.prompt, true);
  };

  const handleHintClick = () => {
    const nextIdx = Math.min(hintIndex + 1, Math.max(0, step.hints.length - 1));
    const hintText = step.hints[nextIdx];
    onRevealHint();
    if (hintText && voiceEnabled) {
      speakText(hintText, true);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-xl backdrop-blur-xl glow-cyan">
      {/* Top Bar: Nova Avatar + Stage + Step Progress */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Glowing Cosmic Orb Avatar */}
          <div className="relative flex-shrink-0">
            {(feedback?.type === 'success' || isCelebrating) && (
              <span className="animate-nova-ring absolute inset-0 rounded-full bg-emerald-400/40" />
            )}
            <div
              className={`animate-nova-float relative flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
                feedback?.type === 'success' || isCelebrating
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/40'
                  : 'border-cyan-300/70 bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 shadow-cyan-500/35'
              }`}
            >
              <span className="text-2xl" role="img" aria-label="Nova">
                🤖✨
              </span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-wider text-cyan-300">
                Nova • Socratic Guide
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${stageMeta.classes}`}
              >
                {stageMeta.label}
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-bold leading-snug text-white sm:text-xl">
              {step.prompt}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-300 sm:text-sm">
              <Compass className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
              <span>Goal: {step.goalDescription}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReadAloud}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/25 active:scale-95"
          >
            <Volume2 className="h-4 w-4 text-cyan-300" />
            <span>🔊 Read Aloud</span>
          </button>

          {step.hints.length > 0 && (
            <button
              type="button"
              onClick={handleHintClick}
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-200 transition-all hover:bg-amber-500/25 active:scale-95"
            >
              <Lightbulb className="h-4 w-4 text-amber-300" />
              <span>💡 Ask Nova for a Hint</span>
            </button>
          )}
        </div>
      </div>

      {/* Progressive Socratic Hint Box */}
      {activeHint && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <div>
            <span className="font-bold text-amber-300">
              Nova&apos;s Clue ({Math.min(hintIndex + 1, step.hints.length)}/{step.hints.length}):{' '}
            </span>
            <span>{activeHint}</span>
          </div>
        </div>
      )}

      {/* Dynamic Feedback Banner (Emerald for Discovery/Success, Amber/Cyan for Socratic Nudge) */}
      {feedback && (
        <div
          className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-100 glow-emerald'
              : feedback.type === 'workspace-ready'
                ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
                : 'border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-cyan-500/10 text-amber-100'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
          ) : (
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-300" />
          )}
          <p className="leading-relaxed">{feedback.message}</p>
        </div>
      )}
    </div>
  );
};
