import React from 'react';
import { Sparkles, Volume2, VolumeX, Music, UserCog, Star, Flame, Compass, FlaskConical, Zap } from 'lucide-react';
import { StudentProfile } from '../types';

export type AppView = 'map' | 'lesson' | 'sandbox' | 'infinite';

interface HeaderProps {
  profile: StudentProfile;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onToggleVoice: () => void;
  onToggleSound: () => void;
  onOpenParent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeView,
  onNavigate,
  onToggleVoice,
  onToggleSound,
  onOpenParent,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#080d1e]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate('map')}
          className="group flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-wider text-white">
                SYNTHESIS
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Math Discovery Lab
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Hi, <span className="font-semibold text-cyan-300">{profile.name}</span>! Ready to discover?
            </p>
          </div>
        </button>

        {/* Primary Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-1">
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeView === 'map' || activeView === 'lesson'
                ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-200 ring-1 ring-cyan-400/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>🌌 Star Map (Curriculum)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('sandbox')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeView === 'sandbox'
                ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-200 ring-1 ring-purple-400/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-purple-400" />
            <span>🧪 Free Play Lab (Sandbox)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('infinite')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeView === 'infinite'
                ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-200 ring-1 ring-amber-400/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4 text-amber-400" />
            <span>⚡ Infinite Challenge</span>
          </button>
        </nav>

        {/* Stats + Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stars */}
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>⭐ {profile.totalStars} Stars</span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300">
            <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
            <span>🔥 {profile.streakDays} Day Streak</span>
          </div>

          {/* Voice Toggle */}
          <button
            type="button"
            onClick={onToggleVoice}
            title="Toggle Nova voice read-aloud"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              profile.voiceEnabled
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            {profile.voiceEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>🔊 Voice: {profile.voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* SFX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title="Toggle sound effects"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
              profile.soundEnabled
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>🎵 SFX: {profile.soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Parent Mode */}
          <button
            type="button"
            onClick={onOpenParent}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-bold text-indigo-200 transition-all hover:bg-indigo-500/25"
          >
            <UserCog className="h-3.5 w-3.5 text-indigo-300" />
            <span>👨‍👦 Parent Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
};
