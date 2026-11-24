import type { StudentProfile } from '../types';

const STORAGE_KEY = 'synthesis_math_tutor_profile_v1';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultProfile(): StudentProfile {
  return {
    name: 'Explorer',
    age: 7,
    completedLessons: {},
    totalStars: 0,
    streakDays: 1,
    lastActiveDate: getTodayDateString(),
    voiceEnabled: true,
    soundEnabled: true,
    unlockAll: false,
  };
}

export function loadProfile(): StudentProfile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultProfile();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultProfile();
    }
    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    const defaults = createDefaultProfile();
    const completedLessons = parsed.completedLessons ?? {};
    const totalStars = Object.values(completedLessons).reduce(
      (sum, entry) => sum + (entry?.stars ?? 0),
      0,
    );

    return {
      ...defaults,
      ...parsed,
      completedLessons,
      totalStars:
        typeof parsed.totalStars === 'number' ? parsed.totalStars : totalStars,
    };
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota / privacy mode storage errors
  }
}

export function recordLessonCompletion(
  profile: StudentProfile,
  lessonId: string,
  stars: number,
  score: number,
): StudentProfile {
  const existing = profile.completedLessons[lessonId];
  const clampedStars = Math.max(1, Math.min(3, Math.round(stars)));
  const bestStars = Math.max(existing?.stars ?? 0, clampedStars);
  const bestScore = Math.max(existing?.bestScore ?? 0, score);

  const completedLessons = {
    ...profile.completedLessons,
    [lessonId]: {
      stars: bestStars,
      bestScore,
      completedAt: Date.now(),
    },
  };

  const totalStars = Object.values(completedLessons).reduce(
    (sum, item) => sum + item.stars,
    0,
  );

  const today = getTodayDateString();
  let streakDays = profile.streakDays || 1;
  if (profile.lastActiveDate && profile.lastActiveDate !== today) {
    const lastMs = Date.parse(profile.lastActiveDate);
    const todayMs = Date.parse(today);
    const diffDays = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }
  }

  const updated: StudentProfile = {
    ...profile,
    completedLessons,
    totalStars,
    streakDays,
    lastActiveDate: today,
  };

  saveProfile(updated);
  return updated;
}

export function resetProfile(): StudentProfile {
  const fresh = createDefaultProfile();
  saveProfile(fresh);
  return fresh;
}
