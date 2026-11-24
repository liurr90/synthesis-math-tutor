export type TrackId =
  | 'place-value'
  | 'number-line'
  | 'arrays'
  | 'fractions'
  | 'balance';

export type LessonStage = 'discover' | 'guided' | 'practice' | 'celebrate';

export interface ManipulativeConfig {
  track: TrackId;
  // Place-value (Exploding Dots)
  initialHundreds?: number;
  initialTens?: number;
  initialOnes?: number;
  targetValue?: number;
  mode?:
    | 'build'
    | 'add'
    | 'subtract'
    | 'jump'
    | 'difference'
    | 'multiply'
    | 'split'
    | 'equivalent'
    | 'solve';
  addendA?: number;
  addendB?: number;
  // Number line
  startNumber?: number;
  targetNumber?: number;
  minLine?: number;
  maxLine?: number;
  // Arrays
  targetRows?: number;
  targetCols?: number;
  initialRows?: number;
  initialCols?: number;
  allowSplit?: boolean;
  // Fractions
  referenceNumerator?: number;
  referenceDenominator?: number;
  initialNumerator?: number;
  initialDenominator?: number;
  targetNumerator?: number;
  targetDenominator?: number;
  // Balance
  mysteryValue?: number;
  leftBoxes?: number;
  leftConstant?: number;
  rightBoxes?: number;
  rightConstant?: number;
}

export interface WorkspaceState {
  track: TrackId;
  // Place-value
  currentValue?: number;
  hundreds?: number;
  tens?: number;
  ones?: number;
  explosionsCount?: number;
  unexplosionsCount?: number;
  // Number line
  currentPos?: number;
  jumps?: number[];
  // Arrays
  rows?: number;
  cols?: number;
  splitCol?: number | null;
  rotated?: boolean;
  // Fractions
  numerator?: number;
  denominator?: number;
  isEquivalentToTarget?: boolean;
  // Balance
  leftTotalWeight?: number;
  rightTotalWeight?: number;
  isBalanced?: boolean;
  leftBoxCount?: number;
  leftWeightSum?: number;
  rightBoxCount?: number;
  rightWeightSum?: number;
}

export interface ManipulativeProps {
  config: ManipulativeConfig;
  onStateChange: (state: WorkspaceState) => void;
  highlightHint?: boolean;
}

export interface PracticeStep {
  id: string;
  stage: 'discover' | 'guided' | 'practice';
  prompt: string;
  voiceText: string;
  goalDescription: string;
  config: ManipulativeConfig;
  expectedAnswer: number;
  requireManipulativeBuild?: boolean;
  choices?: number[];
  hints: string[];
  successFeedback: string;
}

export interface Lesson {
  id: string;
  track: TrackId;
  grade: '2nd Grade' | '3rd Grade' | '4th Grade';
  standard: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  steps: PracticeStep[];
}

export interface EvaluationResult {
  isCorrect: boolean;
  workspaceMatchesGoal: boolean;
  feedback: string;
  misconceptionType?: string;
}

export interface StudentProfile {
  name: string;
  age: number;
  completedLessons: Record<
    string,
    { stars: number; bestScore: number; completedAt: number }
  >;
  totalStars: number;
  streakDays: number;
  lastActiveDate: string;
  voiceEnabled: boolean;
  soundEnabled: boolean;
  unlockAll: boolean;
}
