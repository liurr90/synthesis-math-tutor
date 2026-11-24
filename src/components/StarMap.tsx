import React, { useMemo, useState } from 'react';
import { Star, Rocket, ArrowRight, Sparkles, Award } from 'lucide-react';
import { Lesson, StudentProfile, TrackId } from '../types';
import { LESSONS, TRACK_METADATA, getLessonsByTrack } from '../engine/curriculum';
import { playPopSound } from '../engine/audio';

interface StarMapProps {
  profile: StudentProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onStartInfinite: (track: TrackId) => void;
}

const FILTER_PILLS: Array<{ id: 'all' | TrackId; label: string }> = [
  { id: 'all', label: 'All Tracks' },
  { id: 'place-value', label: '⚡ Exploding Dots (2nd)' },
  { id: 'number-line', label: '🚀 Rocket Number Line (2nd)' },
  { id: 'arrays', label: '🟦 Energy Arrays (2nd-3rd)' },
  { id: 'fractions', label: '🧪 Fraction Lab (3rd-4th)' },
  { id: 'balance', label: '⚖️ Balance Logic (2nd-4th)' },
];

const TRACK_ORDER: TrackId[] = [
  'place-value',
  'number-line',
  'arrays',
  'fractions',
  'balance',
];

export const StarMap: React.FC<StarMapProps> = ({
  profile,
  onSelectLesson,
  onStartInfinite,
}) => {
  const [filter, setFilter] = useState<'all' | TrackId>('all');

  const visibleTracks = useMemo(
    () => (filter === 'all' ? TRACK_ORDER : [filter]),
    [filter],
  );

  // Recommend the first uncompleted lesson globally as the primary Next Mission
  const recommendedLessonId = useMemo(() => {
    const firstIncomplete = LESSONS.find(
      (lesson) => !profile.completedLessons[lesson.id],
    );
    return firstIncomplete?.id ?? LESSONS[0]?.id;
  }, [profile.completedLessons]);

  const completedCount = Object.keys(profile.completedLessons).length;
  const maxPossibleStars = LESSONS.length * 3;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-[#0d1530] to-indigo-950/80 p-6 shadow-2xl glow-cyan">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cosmic Math Constellation • Grades 2–4</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Chart Your Math Galaxy, {profile.name}!
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              Explore 5 interactive worlds with Nova. Discover patterns visually first,
              test ideas on cosmic machines, and earn 3 stars on every star node!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Missions Cleared
              </div>
              <div className="mt-0.5 text-xl font-extrabold text-cyan-300">
                {completedCount} / {LESSONS.length}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                Galaxy Stars
              </div>
              <div className="mt-0.5 text-xl font-extrabold text-amber-300">
                {profile.totalStars} / {maxPossibleStars} ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Track Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => {
            const active = filter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  playPopSound();
                  setFilter(pill.id);
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                  active
                    ? 'border-cyan-300 bg-cyan-500/25 text-white shadow-sm shadow-cyan-500/20'
                    : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Track Constellation Pathways */}
      <div className="space-y-6">
        {visibleTracks.map((trackId) => {
          const meta = TRACK_METADATA[trackId];
          const lessons = getLessonsByTrack(trackId);
          const standards = Array.from(new Set(lessons.map((l) => l.standard)));
          const trackStars = lessons.reduce(
            (sum, l) => sum + (profile.completedLessons[l.id]?.stars ?? 0),
            0,
          );
          const trackMaxStars = lessons.length * 3;
          const nextInTrack = lessons.find(
            (l) => !profile.completedLessons[l.id],
          );

          return (
            <section
              key={trackId}
              className="rounded-3xl border border-slate-700/75 bg-slate-900/75 p-5 shadow-xl backdrop-blur-xl sm:p-6"
            >
              {/* Track Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accentColor} text-2xl shadow-lg`}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-white">
                        {meta.name}
                      </h2>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.badgeBg}`}
                      >
                        {meta.grades}
                      </span>
                      {standards.map((std) => (
                        <span
                          key={std}
                          className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-300"
                        >
                          {std}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-amber-300">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>
                      {trackStars}/{trackMaxStars} ⭐
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      onStartInfinite(trackId);
                    }}
                    className="rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition-all hover:bg-amber-500/25"
                  >
                    ⚡ Infinite Practice
                  </button>
                </div>
              </div>

              {/* Connected Constellation Nodes */}
              <div className="relative mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {lessons.map((lesson, idx) => {
                  const completion = profile.completedLessons[lesson.id];
                  const earnedStars = completion?.stars ?? 0;
                  const isRecommended =
                    lesson.id === recommendedLessonId ||
                    (!recommendedLessonId && idx === 0) ||
                    (nextInTrack?.id === lesson.id && filter !== 'all');

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        playPopSound();
                        onSelectLesson(lesson);
                      }}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99] ${
                        isRecommended
                          ? 'border-cyan-400/70 bg-gradient-to-br from-cyan-500/15 via-slate-800/90 to-indigo-900/50 ring-2 ring-cyan-400/35 glow-cyan'
                          : earnedStars > 0
                            ? 'border-emerald-500/40 bg-slate-800/75 hover:border-emerald-400/70'
                            : 'border-slate-700/80 bg-slate-800/60 hover:border-cyan-400/50 hover:bg-slate-800/90'
                      }`}
                    >
                      {/* Connector line indicator on wide screens */}
                      {idx < lessons.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 top-1/2 hidden h-0.5 w-3 bg-gradient-to-r from-cyan-400/60 to-indigo-400/60 xl:block"
                        />
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 text-xl ring-1 ring-slate-700">
                              {lesson.icon}
                            </span>
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Node {idx + 1} • {lesson.grade}
                              </span>
                              <div className="font-mono text-[11px] font-semibold text-cyan-300">
                                {lesson.standard}
                              </div>
                            </div>
                          </div>

                          {isRecommended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-950 shadow">
                              <Rocket className="h-3 w-3" />
                              Next Mission 🚀
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-base font-extrabold text-white group-hover:text-cyan-200">
                          {lesson.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">
                          {lesson.subtitle}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-3">
                        <div className="flex items-center gap-1" aria-label={`${earnedStars} of 3 stars`}>
                          {[1, 2, 3].map((starNum) => (
                            <Star
                              key={starNum}
                              className={`h-4 w-4 ${
                                starNum <= earnedStars
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 group-hover:translate-x-0.5 transition-transform">
                          <span>{earnedStars > 0 ? 'Replay' : 'Launch'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
