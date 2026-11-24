import React, { useEffect, useState } from 'react';
import { Lesson, StudentProfile, TrackId } from './types';
import {
  loadProfile,
  recordLessonCompletion,
  resetProfile,
  saveProfile,
} from './engine/storage';
import { setSoundEnabled, stopSpeech } from './engine/audio';
import { Header, AppView } from './components/Header';
import { StarMap } from './components/StarMap';
import { LessonWorkspace } from './components/LessonWorkspace';
import { SandboxLab } from './components/SandboxLab';
import { ParentModal } from './components/ParentModal';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile>(() => loadProfile());
  const [activeView, setActiveView] = useState<AppView>('map');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [infiniteTrack, setInfiniteTrack] = useState<TrackId>('place-value');
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  // Sync audio synthesizer with profile setting
  useEffect(() => {
    setSoundEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  const handleUpdateProfile = (next: StudentProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  const handleToggleVoice = () => {
    const nextVoice = !profile.voiceEnabled;
    if (!nextVoice) {
      stopSpeech();
    }
    handleUpdateProfile({ ...profile, voiceEnabled: nextVoice });
  };

  const handleToggleSound = () => {
    const nextSound = !profile.soundEnabled;
    setSoundEnabled(nextSound);
    handleUpdateProfile({ ...profile, soundEnabled: nextSound });
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveView('lesson');
  };

  const handleStartInfinite = (track: TrackId) => {
    setInfiniteTrack(track);
    setActiveView('infinite');
  };

  const handleLessonComplete = (
    lessonId: string,
    stars: number,
    score: number,
  ) => {
    const updated = recordLessonCompletion(profile, lessonId, stars, score);
    setProfile(updated);
  };

  const handleResetProgress = () => {
    const fresh = resetProfile();
    setProfile(fresh);
    setActiveView('map');
    setSelectedLesson(null);
  };

  return (
    <div className="cosmic-bg min-h-screen text-slate-100 flex flex-col">
      <Header
        profile={profile}
        activeView={activeView}
        onNavigate={(view) => {
          stopSpeech();
          setActiveView(view);
        }}
        onToggleVoice={handleToggleVoice}
        onToggleSound={handleToggleSound}
        onOpenParent={() => setIsParentModalOpen(true)}
      />

      <main className="flex-1 pb-12">
        {activeView === 'map' && (
          <StarMap
            profile={profile}
            onSelectLesson={handleSelectLesson}
            onStartInfinite={handleStartInfinite}
          />
        )}

        {activeView === 'lesson' && selectedLesson && (
          <LessonWorkspace
            mode="lesson"
            lesson={selectedLesson}
            profile={profile}
            onLessonComplete={handleLessonComplete}
            onExitToMap={() => setActiveView('map')}
          />
        )}

        {activeView === 'sandbox' && <SandboxLab />}

        {activeView === 'infinite' && (
          <LessonWorkspace
            mode="infinite"
            infiniteTrack={infiniteTrack}
            onChangeInfiniteTrack={setInfiniteTrack}
            profile={profile}
            onLessonComplete={handleLessonComplete}
            onExitToMap={() => setActiveView('map')}
          />
        )}
      </main>

      <ParentModal
        isOpen={isParentModalOpen}
        profile={profile}
        onClose={() => setIsParentModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
};

export default App;
