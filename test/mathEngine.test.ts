import { describe, expect, it } from 'vitest';
import {
  LESSONS,
  TRACK_METADATA,
  getLessonById,
  getLessonsByTrack,
} from '../src/engine/curriculum';
import {
  areFractionsEquivalent,
  decomposeBase10,
  evaluateStepAttempt,
  generateInfiniteChallenge,
  needsRegrouping,
} from '../src/engine/mathEngine';
import type { PracticeStep, TrackId } from '../src/types';

describe('mathEngine core helpers', () => {
  it('checks fraction equivalence accurately via cross-multiplication', () => {
    expect(areFractionsEquivalent(1, 2, 2, 4)).toBe(true);
    expect(areFractionsEquivalent(2, 3, 8, 12)).toBe(true);
    expect(areFractionsEquivalent(3, 4, 9, 12)).toBe(true);
    expect(areFractionsEquivalent(2, 5, 3, 10)).toBe(false);
    expect(areFractionsEquivalent(1, 0, 1, 2)).toBe(false);
  });

  it('decomposes integers into hundreds, tens, and ones', () => {
    expect(decomposeBase10(0)).toEqual({ hundreds: 0, tens: 0, ones: 0 });
    expect(decomposeBase10(42)).toEqual({ hundreds: 0, tens: 4, ones: 2 });
    expect(decomposeBase10(307)).toEqual({ hundreds: 3, tens: 0, ones: 7 });
    expect(decomposeBase10(512)).toEqual({ hundreds: 5, tens: 1, ones: 2 });
  });

  it('detects when base-10 chambers need regrouping', () => {
    expect(needsRegrouping(0, 3, 9)).toBe(false);
    expect(needsRegrouping(0, 3, 10)).toBe(true);
    expect(needsRegrouping(1, 10, 2)).toBe(true);
    expect(needsRegrouping(4, 9, 9)).toBe(false);
  });
});

describe('evaluateStepAttempt & misconception detectors', () => {
  it('catches unexploded 10+ dots in place-value even when total energy matches', () => {
    const step: PracticeStep = {
      id: 'test-pv',
      stage: 'discover',
      prompt: 'Make 32 cleanly',
      voiceText: 'Make 32',
      goalDescription: '3T 2O',
      config: { track: 'place-value', targetValue: 32 },
      expectedAnswer: 32,
      hints: ['Explode 10 ones!'],
      successFeedback: 'Nice!',
    };

    const unexploded = evaluateStepAttempt(step, null, {
      track: 'place-value',
      hundreds: 0,
      tens: 2,
      ones: 12,
      currentValue: 32,
    });
    expect(unexploded.isCorrect).toBe(false);
    expect(unexploded.misconceptionType).toBe('unexploded-dots');
    expect(unexploded.feedback).toContain('EXPLODE 10');

    const clean = evaluateStepAttempt(step, null, {
      track: 'place-value',
      hundreds: 0,
      tens: 3,
      ones: 2,
      currentValue: 32,
    });
    expect(clean.isCorrect).toBe(true);
    expect(clean.workspaceMatchesGoal).toBe(true);
  });

  it('detects off-by-10 regrouping omission on numeric answer', () => {
    const step = getLessonById('pv-1-first-explosion')!.steps[2]; // 19 + 7 = 26
    const result = evaluateStepAttempt(step, 16, {
      track: 'place-value',
      hundreds: 0,
      tens: 1,
      ones: 16,
      currentValue: 26,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.misconceptionType).toBe('off-by-10-regrouping');
  });

  it('accepts rotated arrays (commutative property) and detects off-by-one row/col', () => {
    const step = getLessonById('ar-1-power-grids')!.steps[0]; // 3 x 4 = 12
    const rotated = evaluateStepAttempt(step, 12, {
      track: 'arrays',
      rows: 4,
      cols: 3,
      rotated: true,
    });
    expect(rotated.isCorrect).toBe(true);
    expect(rotated.workspaceMatchesGoal).toBe(true);

    const practiceStep = getLessonById('ar-1-power-grids')!.steps[2]; // 5 x 6 = 30
    const offByRow = evaluateStepAttempt(practiceStep, 24, {
      track: 'arrays',
      rows: 4,
      cols: 6,
    });
    expect(offByRow.isCorrect).toBe(false);
    expect(offByRow.misconceptionType).toBe('off-by-one-row-or-col');
  });

  it('validates fraction equivalence and catches numerator+denominator mistakes', () => {
    const discoverStep = getLessonById('fr-2-equivalent-bars')!.steps[0]; // 1/2 = 2/4
    const equivResult = evaluateStepAttempt(discoverStep, null, {
      track: 'fractions',
      numerator: 2,
      denominator: 4,
      isEquivalentToTarget: true,
    });
    expect(equivResult.isCorrect).toBe(true);
    expect(equivResult.workspaceMatchesGoal).toBe(true);

    const practiceStep = getLessonById('fr-2-equivalent-bars')!.steps[2]; // 2/3 = 4/6
    const confused = evaluateStepAttempt(practiceStep, 10, {
      track: 'fractions',
      numerator: 2,
      denominator: 6,
      isEquivalentToTarget: false,
    });
    expect(confused.isCorrect).toBe(false);
    expect(confused.misconceptionType).toBe('fraction-parts-confusion');
  });

  it('validates balance scale isolation and catches unbalanced or non-isolated states', () => {
    const step = getLessonById('ba-1-one-mystery')!.steps[0]; // ? + 3 = 8 => ? = 5
    const unbalanced = evaluateStepAttempt(step, null, {
      track: 'balance',
      isBalanced: false,
      leftBoxCount: 1,
      leftWeightSum: 0,
      rightBoxCount: 0,
      rightWeightSum: 8,
    });
    expect(unbalanced.isCorrect).toBe(false);
    expect(unbalanced.misconceptionType).toBe('unbalanced-scale');

    const notIsolated = evaluateStepAttempt(step, null, {
      track: 'balance',
      isBalanced: true,
      leftBoxCount: 1,
      leftWeightSum: 3,
      rightBoxCount: 0,
      rightWeightSum: 8,
    });
    expect(notIsolated.isCorrect).toBe(false);
    expect(notIsolated.misconceptionType).toBe('not-isolated');

    const isolated = evaluateStepAttempt(step, null, {
      track: 'balance',
      isBalanced: true,
      leftBoxCount: 1,
      leftWeightSum: 0,
      rightBoxCount: 0,
      rightWeightSum: 5,
    });
    expect(isolated.isCorrect).toBe(true);
    expect(isolated.workspaceMatchesGoal).toBe(true);
  });
});

describe('generateInfiniteChallenge', () => {
  const tracks: TrackId[] = [
    'place-value',
    'number-line',
    'arrays',
    'fractions',
    'balance',
  ];

  it('produces valid challenges with 4 unique sorted choices for all 5 tracks', () => {
    for (const track of tracks) {
      for (const difficulty of [1, 2, 3] as const) {
        const challenge = generateInfiniteChallenge(track, difficulty);
        expect(challenge.config.track).toBe(track);
        expect(challenge.choices).toBeDefined();
        expect(challenge.choices!.length).toBe(4);
        expect(challenge.choices).toContain(challenge.expectedAnswer);
        const sorted = [...challenge.choices!].sort((a, b) => a - b);
        expect(challenge.choices).toEqual(sorted);
        expect(new Set(challenge.choices).size).toBe(4);
        expect(challenge.hints.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('curriculum integrity', () => {
  it('contains 16 lessons across 5 tracks with 64 valid steps and non-empty hints', () => {
    expect(Object.keys(TRACK_METADATA)).toHaveLength(5);
    expect(LESSONS).toHaveLength(16);

    let totalSteps = 0;
    for (const lesson of LESSONS) {
      expect(lesson.steps).toHaveLength(4);
      expect(lesson.steps[0].stage).toBe('discover');
      expect(lesson.steps[1].stage).toBe('guided');
      expect(lesson.steps[2].stage).toBe('practice');
      expect(lesson.steps[3].stage).toBe('practice');

      for (const step of lesson.steps) {
        totalSteps += 1;
        expect(step.config.track).toBe(lesson.track);
        expect(step.hints.length).toBeGreaterThanOrEqual(2);
        step.hints.forEach((h) => expect(h.trim().length).toBeGreaterThan(0));
        expect(step.choices).toBeDefined();
        expect(step.choices).toContain(step.expectedAnswer);
      }
    }

    expect(totalSteps).toBe(64);
    expect(getLessonsByTrack('place-value')).toHaveLength(4);
    expect(getLessonsByTrack('number-line')).toHaveLength(3);
    expect(getLessonsByTrack('arrays')).toHaveLength(3);
    expect(getLessonsByTrack('fractions')).toHaveLength(3);
    expect(getLessonsByTrack('balance')).toHaveLength(3);
  });
});
