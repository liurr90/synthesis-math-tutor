import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Star,
  Sparkles,
  Zap,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  Lesson,
  PracticeStep,
  StudentProfile,
  TrackId,
  WorkspaceState,
} from '../types';
import {
  evaluateStepAttempt,
  generateInfiniteChallenge,
} from '../engine/mathEngine';
import { TRACK_METADATA } from '../engine/curriculum';
import {
  playCelebrationFanfare,
  playCorrectChime,
  playGentleTryAgain,
  playPopSound,
  speakText,
  stopSpeech,
} from '../engine/audio';
import { NovaTutor } from './NovaTutor';
import { NumberPad } from './NumberPad';
import { ExplodingDotsMachine } from './manipulatives/ExplodingDotsMachine';
import { RocketNumberLine } from './manipulatives/RocketNumberLine';
import { EnergyArrayGrid } from './manipulatives/EnergyArrayGrid';
import { FractionSplitterLab } from './manipulatives/FractionSplitterLab';
import { BalanceScaleLab } from './manipulatives/BalanceScaleLab';

interface LessonWorkspaceProps {
  mode: 'lesson' | 'infinite';
  lesson?: Lesson;
  infiniteTrack?: TrackId;
  onChangeInfiniteTrack?: (track: TrackId) => void;
  profile: StudentProfile;
  onLessonComplete: (lessonId: string, stars: number, score: number) => void;
  onExitToMap: () => void;
}

const TRACK_OPTIONS: TrackId[] = [
  'place-value',
  'number-line',
  'arrays',
  'fractions',
  'balance',
];

export const LessonWorkspace: React.FC<LessonWorkspaceProps> = ({
  mode,
  lesson,
  infiniteTrack = 'place-value',
  onChangeInfiniteTrack,
  profile,
  onLessonComplete,
  onExitToMap,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [infiniteStep, setInfiniteStep] = useState<PracticeStep>(() =>
    generateInfiniteChallenge(infiniteTrack, 2),
  );
  const [infiniteSolvedCount, setInfiniteSolvedCount] = useState(0);

  const [answerInput, setAnswerInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [hintIndex, setHintIndex] = useState(-1);
  const [highlightHint, setHighlightHint] = useState(false);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState | null>(
    null,
  );
  const [isStepCompleted, setIsStepCompleted] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'nudge' | 'workspace-ready';
    message: string;
  } | null>(null);

  // Reset state when switching lessons or infinite track
  useEffect(() => {
    setStepIndex(0);
    setAnswerInput('');
    setAttempts(0);
    setTotalMistakes(0);
    setHintIndex(-1);
    setHighlightHint(false);
    setWorkspaceState(null);
    setIsStepCompleted(false);
    setIsLessonFinished(false);
    setFeedback(null);
    if (mode === 'infinite') {
      setInfiniteStep(generateInfiniteChallenge(infiniteTrack, difficulty));
    }
  }, [lesson?.id, mode, infiniteTrack]);

  const currentStep: PracticeStep | undefined =
    mode === 'lesson' ? lesson?.steps[stepIndex] : infiniteStep;

  const totalSteps = mode === 'lesson' ? lesson?.steps.length ?? 1 : 1;

  // Speak Nova's prompt automatically when entering a new step
  useEffect(() => {
    if (!currentStep || isLessonFinished) return;
    if (profile.voiceEnabled) {
      speakText(currentStep.voiceText || currentStep.prompt, true);
    }
    return () => {
      stopSpeech();
    };
  }, [currentStep?.id, profile.voiceEnabled, isLessonFinished]);

  // Live workspace goal check for discover/build steps
  const workspaceMatchesGoal = useMemo(() => {
    if (!currentStep || !workspaceState) return false;
    return evaluateStepAttempt(currentStep, null, workspaceState, 1)
      .workspaceMatchesGoal;
  }, [currentStep, workspaceState]);

  if (!currentStep) {
    return null;
  }

  const handleStateChange = (nextState: WorkspaceState) => {
    setWorkspaceState(nextState);
    if (
      !isStepCompleted &&
      currentStep.stage === 'discover' &&
      evaluateStepAttempt(currentStep, null, nextState, 1).workspaceMatchesGoal
    ) {
      setFeedback((prev) =>
        prev?.type === 'success'
          ? prev
          : {
              type: 'workspace-ready',
              message:
                '✨ Workspace Target Reached! Click "✅ Look What I Built, Nova!" or "Check with Nova"!',
            },
      );
    }
  };

  const evaluateSubmission = (numericAnswer: number | null) => {
    if (isStepCompleted) return;
    const nextAttempts = attempts + 1;
    const result = evaluateStepAttempt(
      currentStep,
      numericAnswer,
      workspaceState,
      nextAttempts,
    );

    if (result.isCorrect) {
      playCorrectChime();
      setIsStepCompleted(true);
      setHighlightHint(false);
      setFeedback({
        type: 'success',
        message: result.feedback,
      });
      if (profile.voiceEnabled) {
        speakText(result.feedback, true);
      }
      if (mode === 'infinite') {
        setInfiniteSolvedCount((c) => c + 1);
      }
    } else {
      playGentleTryAgain();
      setAttempts(nextAttempts);
      setTotalMistakes((m) => m + 1);
      setHighlightHint(true);
      setFeedback({
        type: 'nudge',
        message: result.feedback,
      });
      if (profile.voiceEnabled) {
        speakText(result.feedback, true);
      }
    }
  };

  const handleNextStep = () => {
    playPopSound();
    if (mode === 'infinite') {
      setInfiniteStep(generateInfiniteChallenge(infiniteTrack, difficulty));
      setAnswerInput('');
      setAttempts(0);
      setHintIndex(-1);
      setHighlightHint(false);
      setWorkspaceState(null);
      setIsStepCompleted(false);
      setFeedback(null);
      return;
    }

    if (!lesson) return;

    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex((idx) => idx + 1);
      setAnswerInput('');
      setAttempts(0);
      setHintIndex(-1);
      setHighlightHint(false);
      setWorkspaceState(null);
      setIsStepCompleted(false);
      setFeedback(null);
    } else {
      // Complete Lesson -> Constellation Celebration Screen!
      const stars = totalMistakes <= 1 ? 3 : totalMistakes <= 3 ? 2 : 1;
      const score = Math.max(60, 100 - totalMistakes * 8);
      setEarnedStars(stars);
      setIsLessonFinished(true);
      playCelebrationFanfare();
      onLessonComplete(lesson.id, stars, score);
      if (profile.voiceEnabled) {
        speakText(
          `Stellar work, ${profile.name}! You completed ${lesson.title} and earned ${stars} cosmic stars!`,
          true,
        );
      }
    }
  };

  const renderManipulative = () => {
    const key = currentStep.id;
    switch (currentStep.config.track) {
      case 'place-value':
        return (
          <ExplodingDotsMachine
            key={key}
            config={currentStep.config}
            onStateChange={handleStateChange}
            highlightHint={highlightHint}
          />
        );
      case 'number-line':
        return (
          <RocketNumberLine
            key={key}
            config={currentStep.config}
            onStateChange={handleStateChange}
            highlightHint={highlightHint}
          />
        );
      case 'arrays':
        return (
          <EnergyArrayGrid
            key={key}
            config={currentStep.config}
            onStateChange={handleStateChange}
            highlightHint={highlightHint}
          />
        );
      case 'fractions':
        return (
          <FractionSplitterLab
            key={key}
            config={currentStep.config}
            onStateChange={handleStateChange}
            highlightHint={highlightHint}
          />
        );
      case 'balance':
        return (
          <BalanceScaleLab
            key={key}
            config={currentStep.config}
            onStateChange={handleStateChange}
            highlightHint={highlightHint}
          />
        );
    }
  };

  // Constellation Celebration Screen
  if (isLessonFinished && lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-slate-900/95 via-indigo-950/75 to-emerald-950/50 p-8 text-center shadow-2xl glow-emerald">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-500/20 text-4xl shadow-lg shadow-amber-500/25">
            🌟
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Constellation Node Mastered!</span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-white">
            Awesome Discovery, {profile.name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            You completed <span className="font-bold text-cyan-300">{lesson.title}</span> ({lesson.standard}).
          </p>

          {/* 3 Glowing Stars */}
          <div className="my-8 flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all ${
                  s <= earnedStars
                    ? 'border-amber-300 bg-amber-500/20 shadow-lg shadow-amber-400/30 scale-105'
                    : 'border-slate-700 bg-slate-800/60 opacity-45'
                }`}
              >
                <Star
                  className={`h-9 w-9 ${
                    s <= earnedStars
                      ? 'fill-amber-400 text-amber-300'
                      : 'text-slate-500'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setStepIndex(0);
                setAnswerInput('');
                setAttempts(0);
                setTotalMistakes(0);
                setHintIndex(-1);
                setHighlightHint(false);
                setWorkspaceState(null);
                setIsStepCompleted(false);
                setIsLessonFinished(false);
                setFeedback(null);
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Replay Mission</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playPopSound();
                onExitToMap();
              }}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:brightness-110"
            >
              <span>🌌 Back to Star Map</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const trackMeta = TRACK_METADATA[currentStep.config.track];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onExitToMap();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-cyan-400/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Star Map</span>
          </button>

          {mode === 'lesson' && lesson ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{lesson.icon}</span>
                <h1 className="text-base font-extrabold text-white sm:text-lg">
                  {lesson.title}
                </h1>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
                  {lesson.standard}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-200">
                <Zap className="h-3.5 w-3.5" />
                Infinite Challenge • {trackMeta.name}
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200">
                Solved this session: {infiniteSolvedCount}
              </span>
            </div>
          )}
        </div>

        {/* Step Progress Dots (Lesson Mode) OR Track + Difficulty Controls (Infinite Mode) */}
        {mode === 'lesson' && lesson ? (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3.5 py-2">
            {lesson.steps.map((s, idx) => {
              const done = idx < stepIndex || (idx === stepIndex && isStepCompleted);
              const active = idx === stepIndex;
              return (
                <div
                  key={s.id}
                  title={`Step ${idx + 1}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold transition-all ${
                    done
                      ? 'bg-emerald-500 text-slate-950'
                      : active
                        ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/25'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 p-1">
              {TRACK_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    onChangeInfiniteTrack?.(t);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    t === infiniteTrack
                      ? 'bg-cyan-500/25 text-cyan-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {TRACK_METADATA[t].icon} {TRACK_METADATA[t].name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/80 p-1 text-xs font-bold">
              {([1, 2, 3] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setDifficulty(lvl);
                    setInfiniteStep(generateInfiniteChallenge(infiniteTrack, lvl));
                    setAnswerInput('');
                    setAttempts(0);
                    setHintIndex(-1);
                    setHighlightHint(false);
                    setWorkspaceState(null);
                    setIsStepCompleted(false);
                    setFeedback(null);
                  }}
                  className={`rounded-lg px-2.5 py-1 transition-all ${
                    difficulty === lvl
                      ? 'bg-amber-500/25 text-amber-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lvl {lvl}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nova Socratic Tutor Header */}
      <NovaTutor
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        voiceEnabled={profile.voiceEnabled}
        hintIndex={hintIndex}
        onRevealHint={() =>
          setHintIndex((prev) =>
            Math.min(prev + 1, Math.max(0, currentStep.hints.length - 1)),
          )
        }
        feedback={feedback}
        isCelebrating={isStepCompleted}
      />

      {/* Live Workspace Target Reached Pill */}
      {!isStepCompleted &&
        currentStep.stage === 'discover' &&
        workspaceMatchesGoal && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2.5 text-sm font-extrabold text-emerald-200 shadow-lg glow-emerald">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>
              ✨ Workspace Target Reached! Click &quot;Check with Nova&quot; or &quot;Look What I Built, Nova!&quot;
            </span>
          </div>
        )}

      {/* Active Digital Manipulative */}
      <div>{renderManipulative()}</div>

      {/* Tactile Answer / Verification Panel */}
      <NumberPad
        step={currentStep}
        value={answerInput}
        onChange={setAnswerInput}
        onSubmitAnswer={evaluateSubmission}
        onCheckBuild={() => evaluateSubmission(null)}
        workspaceMatchesGoal={workspaceMatchesGoal}
        isStepCompleted={isStepCompleted}
        onNextStep={handleNextStep}
        nextLabel={
          mode === 'infinite'
            ? '⚡ Next Challenge →'
            : stepIndex + 1 >= totalSteps
              ? '🌟 Claim Constellation Stars!'
              : '🚀 Next Step →'
        }
      />
    </div>
  );
};
