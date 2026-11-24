import React, { useState } from 'react';
import {
  X,
  UserCog,
  Volume2,
  Music,
  RotateCcw,
  Award,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { StudentProfile, TrackId } from '../types';
import { LESSONS, TRACK_METADATA, getLessonsByTrack } from '../engine/curriculum';

interface ParentModalProps {
  isOpen: boolean;
  profile: StudentProfile;
  onClose: () => void;
  onUpdateProfile: (next: StudentProfile) => void;
  onResetProgress: () => void;
}

const TRACK_ORDER: TrackId[] = [
  'place-value',
  'number-line',
  'arrays',
  'fractions',
  'balance',
];

const CORE_STANDARDS = [
  '2.NBT.A.1',
  '2.NBT.B.7',
  '2.OA.B.2',
  '2.OA.C.4',
  '3.OA.A.1',
  '3.OA.B.5',
  '3.NF.A.3',
  '4.OA.A.3',
];

export const ParentModal: React.FC<ParentModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdateProfile,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const totalCompleted = Object.keys(profile.completedLessons).length;
  const allStandards = Array.from(
    new Set([...CORE_STANDARDS, ...LESSONS.map((l) => l.standard)]),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Parent Dashboard and Settings"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-indigo-400/35 bg-[#0b1228] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/20 text-indigo-300">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                👨‍👦 Parent Dashboard &amp; Settings
              </h2>
              <p className="text-xs text-slate-400">
                Track conceptual mastery, Common Core standards, and audio preferences.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close parent modal"
            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Child Profile Editor */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <label
              htmlFor="child-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Explorer Name
            </label>
            <input
              id="child-name-input"
              type="text"
              value={profile.name}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  name: e.target.value || 'Explorer',
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Explorer"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <label
              htmlFor="child-age-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Explorer Age
            </label>
            <input
              id="child-age-input"
              type="number"
              min={5}
              max={13}
              value={profile.age}
              onChange={(e) =>
                onUpdateProfile({
                  ...profile,
                  age: Math.max(5, Math.min(13, Number(e.target.value) || 7)),
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Audio & Sandbox Settings */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                voiceEnabled: !profile.voiceEnabled,
              })
            }
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition-all hover:border-cyan-500/40"
          >
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-5 w-5 text-cyan-400" />
              <div>
                <div className="text-sm font-bold text-white">
                  Nova Voice Read-Aloud
                </div>
                <div className="text-xs text-slate-400">
                  Speaks prompts &amp; Socratic hints aloud
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                profile.voiceEnabled
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {profile.voiceEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                soundEnabled: !profile.soundEnabled,
              })
            }
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition-all hover:border-emerald-500/40"
          >
            <div className="flex items-center gap-2.5">
              <Music className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-white">
                  Cosmic Sound Effects
                </div>
                <div className="text-xs text-slate-400">
                  Chimes, explosions, and celebration audio
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                profile.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {profile.soundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Mastery Breakdown Across 5 Tracks */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-300">
              <Award className="h-4 w-4 text-amber-400" />
              <span>Track Mastery ({totalCompleted}/{LESSONS.length} Lessons)</span>
            </h3>
            <span className="text-xs font-bold text-amber-300">
              Total: {profile.totalStars} ⭐
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {TRACK_ORDER.map((trackId) => {
              const meta = TRACK_METADATA[trackId];
              const lessons = getLessonsByTrack(trackId);
              const done = lessons.filter(
                (l) => Boolean(profile.completedLessons[l.id]),
              ).length;
              const stars = lessons.reduce(
                (sum, l) => sum + (profile.completedLessons[l.id]?.stars ?? 0),
                0,
              );
              const maxStars = lessons.length * 3;
              const pct =
                lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;

              return (
                <div
                  key={trackId}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-white">
                      {meta.icon} {meta.name}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        ({meta.grades})
                      </span>
                    </span>
                    <span className="text-xs font-bold text-cyan-300">
                      {done}/{lessons.length} lessons • {stars}/{maxStars} ⭐
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.accentColor} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Core Standards Coverage */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Common Core Standards Covered</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {allStandards.map((std) => {
              const lessonsForStd = LESSONS.filter((l) => l.standard === std);
              const mastered =
                lessonsForStd.length > 0 &&
                lessonsForStd.some((l) => Boolean(profile.completedLessons[l.id]));
              return (
                <span
                  key={std}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-bold ${
                    mastered
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300'
                  }`}
                >
                  {mastered && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  {std}
                </span>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Progress</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-300">
                Clear all stars &amp; lessons?
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-400"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 text-sm font-extrabold text-white hover:brightness-110"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
