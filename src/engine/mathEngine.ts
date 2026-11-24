import type {
  EvaluationResult,
  PracticeStep,
  TrackId,
  WorkspaceState,
} from '../types';

export function areFractionsEquivalent(
  n1: number,
  d1: number,
  n2: number,
  d2: number,
): boolean {
  if (d1 <= 0 || d2 <= 0 || n1 < 0 || n2 < 0) {
    return false;
  }
  return n1 * d2 === n2 * d1;
}

export function decomposeBase10(n: number): {
  hundreds: number;
  tens: number;
  ones: number;
} {
  const safe = Math.max(0, Math.floor(n));
  const hundreds = Math.floor(safe / 100);
  const tens = Math.floor((safe % 100) / 10);
  const ones = safe % 10;
  return { hundreds, tens, ones };
}

export function needsRegrouping(
  hundreds: number,
  tens: number,
  ones: number,
): boolean {
  void hundreds;
  return ones >= 10 || tens >= 10;
}

function getPlaceValueTotal(workspace: WorkspaceState): number {
  if (
    workspace.hundreds !== undefined ||
    workspace.tens !== undefined ||
    workspace.ones !== undefined
  ) {
    return (
      (workspace.hundreds ?? 0) * 100 +
      (workspace.tens ?? 0) * 10 +
      (workspace.ones ?? 0)
    );
  }
  return workspace.currentValue ?? 0;
}

function isBalanceIsolated(workspace: WorkspaceState): boolean {
  const leftBoxes = workspace.leftBoxCount ?? 0;
  const leftWeights = workspace.leftWeightSum ?? 0;
  const rightBoxes = workspace.rightBoxCount ?? 0;
  const rightWeights = workspace.rightWeightSum ?? 0;

  const isolatedLeft =
    leftBoxes === 1 && leftWeights === 0 && rightBoxes === 0;
  const isolatedRight =
    rightBoxes === 1 && rightWeights === 0 && leftBoxes === 0;

  return isolatedLeft || isolatedRight;
}

function checkWorkspaceMatchesGoal(
  step: PracticeStep,
  workspace: WorkspaceState | null,
): boolean {
  if (!workspace || workspace.track !== step.config.track) {
    return false;
  }

  switch (step.config.track) {
    case 'place-value': {
      const h = workspace.hundreds ?? 0;
      const t = workspace.tens ?? 0;
      const o = workspace.ones ?? 0;
      const total = getPlaceValueTotal(workspace);
      const target = step.config.targetValue ?? step.expectedAnswer;
      return total === target && !needsRegrouping(h, t, o);
    }

    case 'number-line': {
      const targetPos = step.config.targetNumber ?? step.expectedAnswer;
      return workspace.currentPos === targetPos;
    }

    case 'arrays': {
      const rows = workspace.rows ?? 0;
      const cols = workspace.cols ?? 0;
      const product = rows * cols;
      if (product !== step.expectedAnswer) {
        return false;
      }
      if (step.config.targetRows && step.config.targetCols) {
        const directMatch =
          rows === step.config.targetRows && cols === step.config.targetCols;
        const rotatedMatch =
          rows === step.config.targetCols && cols === step.config.targetRows;
        return directMatch || rotatedMatch;
      }
      return true;
    }

    case 'fractions': {
      if (workspace.isEquivalentToTarget) {
        return true;
      }
      const n = workspace.numerator ?? 0;
      const d = workspace.denominator ?? 0;
      const targetN =
        step.config.targetNumerator ??
        step.config.referenceNumerator ??
        step.expectedAnswer;
      const targetD =
        step.config.targetDenominator ?? step.config.referenceDenominator ?? 1;
      return areFractionsEquivalent(n, d, targetN, targetD);
    }

    case 'balance': {
      if (!workspace.isBalanced) {
        return false;
      }
      if (step.config.mode === 'solve') {
        return isBalanceIsolated(workspace);
      }
      return true;
    }
  }
}

export function evaluateStepAttempt(
  step: PracticeStep,
  numericAnswer: number | null,
  workspace: WorkspaceState | null,
  attemptNumber = 1,
): EvaluationResult {
  const workspaceMatchesGoal = checkWorkspaceMatchesGoal(step, workspace);
  const track = step.config.track;

  // Check place-value unexploded dots before declaring discover success
  if (track === 'place-value' && workspace) {
    const h = workspace.hundreds ?? 0;
    const t = workspace.tens ?? 0;
    const o = workspace.ones ?? 0;
    const total = getPlaceValueTotal(workspace);
    const target = step.config.targetValue ?? step.expectedAnswer;

    if (
      total === target &&
      needsRegrouping(h, t, o) &&
      (numericAnswer === null || numericAnswer === step.expectedAnswer)
    ) {
      return {
        isCorrect: false,
        workspaceMatchesGoal: false,
        misconceptionType: 'unexploded-dots',
        feedback: `You have the right total energy (${target}), but look at the chambers — one chamber has 10 or more dots! Hit 💥 EXPLODE 10 → 1 to regroup them!`,
      };
    }
  }

  // Discover stage: building the target state on the manipulative succeeds immediately
  if (step.stage === 'discover' && workspaceMatchesGoal) {
    return {
      isCorrect: true,
      workspaceMatchesGoal: true,
      feedback: step.successFeedback,
    };
  }

  // Numeric answer matches expected answer
  if (numericAnswer !== null && numericAnswer === step.expectedAnswer) {
    if (step.requireManipulativeBuild && !workspaceMatchesGoal) {
      return {
        isCorrect: false,
        workspaceMatchesGoal: false,
        misconceptionType: 'missing-manipulative-build',
        feedback: `Your number ${numericAnswer} looks right! Now finish building it on the cosmic lab above: ${step.goalDescription}`,
      };
    }
    return {
      isCorrect: true,
      workspaceMatchesGoal,
      feedback: step.successFeedback,
    };
  }

  // Track-specific misconception detectors
  switch (track) {
    case 'place-value': {
      if (
        numericAnswer !== null &&
        (numericAnswer === step.expectedAnswer - 10 ||
          numericAnswer === step.expectedAnswer + 10)
      ) {
        return {
          isCorrect: false,
          workspaceMatchesGoal,
          misconceptionType: 'off-by-10-regrouping',
          feedback:
            'Close! Did a group of 10 ones explode into the Tens chamber? Check the Tens column.',
        };
      }
      if (workspace) {
        const total = getPlaceValueTotal(workspace);
        const target = step.config.targetValue ?? step.expectedAnswer;
        if (total !== target && numericAnswer === null) {
          return {
            isCorrect: false,
            workspaceMatchesGoal: false,
            misconceptionType: 'place-value-mismatch',
            feedback:
              total < target
                ? `Your chambers currently show ${total}. Try adding more dots to reach ${target}!`
                : `Your chambers show ${total}, which is a bit past ${target}. Try removing or unexploding dots.`,
          };
        }
      }
      break;
    }

    case 'number-line': {
      const pos = workspace?.currentPos;
      const start = step.config.startNumber ?? 0;
      const target = step.config.targetNumber ?? step.expectedAnswer;
      if (pos !== undefined && pos !== target) {
        const wentWrongWay =
          (target > start && pos < start) || (target < start && pos > start);
        if (wentWrongWay) {
          return {
            isCorrect: false,
            workspaceMatchesGoal: false,
            misconceptionType: 'wrong-direction',
            feedback: `Careful — your rocket blasted the opposite direction! From ${start}, head toward ${target}.`,
          };
        }
        if (Math.abs(pos - target) <= 5) {
          return {
            isCorrect: false,
            workspaceMatchesGoal: false,
            misconceptionType: 'close-jump',
            feedback: `You landed on ${pos} — so close to ${target}! Use small +1 or -1 hops, or jump to the next friendly 10.`,
          };
        }
        return {
          isCorrect: false,
          workspaceMatchesGoal: false,
          misconceptionType: 'friendly-ten-hint',
          feedback: `Your rocket is at ${pos}. Try jumping to a friendly multiple of 10 first on your way to ${target}!`,
        };
      }
      break;
    }

    case 'arrays': {
      const rows = workspace?.rows ?? 0;
      const cols = workspace?.cols ?? 0;
      const product = rows * cols;
      if (
        product === step.expectedAnswer &&
        numericAnswer !== null &&
        numericAnswer !== step.expectedAnswer
      ) {
        return {
          isCorrect: false,
          workspaceMatchesGoal: true,
          misconceptionType: 'count-array-cells',
          feedback: `Your ${rows} × ${cols} energy grid has the right shape! Count the rows of ${cols} carefully to find the total cells.`,
        };
      }
      const stepCols = step.config.targetCols || cols || 1;
      const stepRows = step.config.targetRows || rows || 1;
      if (
        numericAnswer !== null &&
        (Math.abs(numericAnswer - step.expectedAnswer) === stepCols ||
          Math.abs(numericAnswer - step.expectedAnswer) === stepRows)
      ) {
        return {
          isCorrect: false,
          workspaceMatchesGoal,
          misconceptionType: 'off-by-one-row-or-col',
          feedback: `Ooh, you're off by just one row or column! Check how many rows and columns are lit up in your array.`,
        };
      }
      break;
    }

    case 'fractions': {
      const n = workspace?.numerator ?? 0;
      const d = workspace?.denominator ?? 1;
      const targetN =
        step.config.targetNumerator ??
        step.config.referenceNumerator ??
        step.expectedAnswer;
      const targetD =
        step.config.targetDenominator ?? step.config.referenceDenominator ?? 1;

      if (
        numericAnswer !== null &&
        (numericAnswer === targetN + targetD ||
          (d !== targetD && n === targetN))
      ) {
        return {
          isCorrect: false,
          workspaceMatchesGoal,
          misconceptionType: 'fraction-parts-confusion',
          feedback:
            'Remember: the bottom number (denominator) tells the total equal pieces in the whole bar, and the top number (numerator) counts the shaded pieces!',
        };
      }
      if (!workspaceMatchesGoal) {
        return {
          isCorrect: false,
          workspaceMatchesGoal: false,
          misconceptionType: 'fraction-mismatch',
          feedback:
            'Look at the two energy bars side by side. Adjust the slices or shaded parts until both bars hold the exact same amount of cosmic energy!',
        };
      }
      break;
    }

    case 'balance': {
      if (workspace) {
        if (!workspace.isBalanced) {
          return {
            isCorrect: false,
            workspaceMatchesGoal: false,
            misconceptionType: 'unbalanced-scale',
            feedback:
              'The scale is tilted! Remember the Golden Rule of Balance: whatever you remove from one pan, remove the exact same amount from the other pan.',
          };
        }
        if (step.config.mode === 'solve' && !isBalanceIsolated(workspace)) {
          return {
            isCorrect: false,
            workspaceMatchesGoal: false,
            misconceptionType: 'not-isolated',
            feedback:
              'Your scale is balanced! Now remove equal weights or boxes from both pans until one Mystery Box (?) sits all alone.',
          };
        }
      }
      break;
    }
  }

  const hintIdx = Math.min(
    Math.max(0, attemptNumber - 1),
    Math.max(0, step.hints.length - 1),
  );
  const fallbackHint =
    step.hints[hintIdx] ||
    'Experiment with the manipulative above — see what pattern jumps out!';

  return {
    isCorrect: false,
    workspaceMatchesGoal,
    misconceptionType: 'general-retry',
    feedback: fallbackHint,
  };
}

function makeChoices(expected: number, minVal = 1): number[] {
  const candidates = new Set<number>([expected]);
  const offsets = [-10, -3, -2, -1, 1, 2, 3, 4, 10, 12];
  let idx = 0;
  while (candidates.size < 4 && idx < offsets.length) {
    const val = expected + offsets[idx];
    if (val >= minVal && val !== expected) {
      candidates.add(val);
    }
    idx += 1;
  }
  let bump = 1;
  while (candidates.size < 4) {
    candidates.add(expected + bump);
    bump += 1;
  }
  return Array.from(candidates).sort((a, b) => a - b);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateInfiniteChallenge(
  track: TrackId,
  difficulty: 1 | 2 | 3 = 2,
): PracticeStep {
  const uid = `inf-${track}-${difficulty}-${Date.now()}-${randInt(100, 999)}`;

  switch (track) {
    case 'place-value': {
      const a =
        difficulty === 1
          ? randInt(14, 29)
          : difficulty === 2
            ? randInt(35, 89)
            : randInt(125, 289);
      const b =
        difficulty === 1
          ? randInt(6, 18)
          : difficulty === 2
            ? randInt(15, 58)
            : randInt(45, 165);
      const sum = a + b;
      const decompA = decomposeBase10(a);
      return {
        id: uid,
        stage: 'practice',
        prompt: `Combine ${a} + ${b} in the Exploding Dots machine! Remember to explode any chamber with 10 or more dots.`,
        voiceText: `Combine ${a} plus ${b} in the Exploding Dots machine, and explode any group of ten!`,
        goalDescription: `Build ${sum} with no chamber holding 10+ dots.`,
        config: {
          track: 'place-value',
          mode: 'add',
          addendA: a,
          addendB: b,
          initialHundreds: decompA.hundreds,
          initialTens: decompA.tens,
          initialOnes: decompA.ones,
          targetValue: sum,
        },
        expectedAnswer: sum,
        choices: makeChoices(sum),
        hints: [
          `Start with ${a} (${decompA.hundreds}H, ${decompA.tens}T, ${decompA.ones}O), then add ${b}.`,
          `Whenever Ones or Tens hits 10+, hit EXPLODE 10 → 1!`,
        ],
        successFeedback: `Boom! ${a} + ${b} = ${sum}. Clean regrouping!`,
      };
    }

    case 'number-line': {
      const start =
        difficulty === 1
          ? randInt(8, 25)
          : difficulty === 2
            ? randInt(24, 58)
            : randInt(35, 95);
      const jump =
        difficulty === 1
          ? randInt(7, 16)
          : difficulty === 2
            ? randInt(16, 34)
            : randInt(26, 48);
      const target = start + jump;
      const minLine = Math.max(0, Math.floor(start / 10) * 10 - 10);
      const maxLine = Math.ceil((target + 10) / 10) * 10;
      return {
        id: uid,
        stage: 'practice',
        prompt: `Launch your rocket from ${start} and jump +${jump} units. Where do you land?`,
        voiceText: `Blast off from ${start} and jump forward ${jump}. Where does your rocket land?`,
        goalDescription: `Fly the rocket from ${start} to ${target}.`,
        config: {
          track: 'number-line',
          mode: 'jump',
          startNumber: start,
          targetNumber: target,
          minLine,
          maxLine,
        },
        expectedAnswer: target,
        choices: makeChoices(target),
        hints: [
          `Hop to the next friendly multiple of 10 first, then add the rest of ${jump}.`,
          `Start at ${start}. Count how many tens and ones are in ${jump}.`,
        ],
        successFeedback: `Touchdown at ${target}! ${start} + ${jump} = ${target}.`,
      };
    }

    case 'arrays': {
      const rows =
        difficulty === 1
          ? randInt(2, 5)
          : difficulty === 2
            ? randInt(3, 7)
            : randInt(5, 9);
      const cols =
        difficulty === 1
          ? randInt(3, 6)
          : difficulty === 2
            ? randInt(4, 8)
            : randInt(6, 10);
      const product = rows * cols;
      return {
        id: uid,
        stage: 'practice',
        prompt: `Build a ${rows} × ${cols} Energy Array. How many total power cells light up?`,
        voiceText: `Build an energy array with ${rows} rows and ${cols} columns. How many total cells light up?`,
        goalDescription: `Light up a ${rows} × ${cols} (or ${cols} × ${rows}) array.`,
        config: {
          track: 'arrays',
          mode: difficulty === 3 ? 'split' : 'multiply',
          initialRows: 2,
          initialCols: 2,
          targetRows: rows,
          targetCols: cols,
          allowSplit: difficulty >= 2,
        },
        expectedAnswer: product,
        choices: makeChoices(product),
        hints: [
          `Try skip-counting ${rows} groups of ${cols}!`,
          `Use the Laser Splitter to slice ${cols} into friendly chunks like 5 + ${Math.max(1, cols - 5)}.`,
        ],
        successFeedback: `Brilliant! ${rows} × ${cols} = ${product} energy cells.`,
      };
    }

    case 'fractions': {
      const pairs: Array<[number, number, number, number]> =
        difficulty === 1
          ? [
              [1, 2, 2, 4],
              [1, 2, 3, 6],
              [1, 3, 2, 6],
            ]
          : difficulty === 2
            ? [
                [2, 3, 4, 6],
                [3, 4, 6, 8],
                [1, 4, 2, 8],
              ]
            : [
                [2, 5, 4, 10],
                [3, 4, 9, 12],
                [2, 3, 8, 12],
              ];
      const [refN, refD, tgtN, tgtD] = pairs[randInt(0, pairs.length - 1)];
      return {
        id: uid,
        stage: 'practice',
        prompt: `The reference crystal shows ${refN}/${refD}. Split your bar into ${tgtD} equal parts — how many pieces must you shade to match ${refN}/${refD}?`,
        voiceText: `Match ${refN} over ${refD} by splitting your bar into ${tgtD} equal parts. How many pieces do you shade?`,
        goalDescription: `Build ${tgtN}/${tgtD} equivalent to ${refN}/${refD}.`,
        config: {
          track: 'fractions',
          mode: 'equivalent',
          referenceNumerator: refN,
          referenceDenominator: refD,
          initialNumerator: 1,
          initialDenominator: tgtD,
          targetNumerator: tgtN,
          targetDenominator: tgtD,
        },
        expectedAnswer: tgtN,
        choices: makeChoices(tgtN, 1),
        hints: [
          `Notice the denominator grew from ${refD} to ${tgtD} (multiplied by ${tgtD / refD}).`,
          `Multiply the numerator ${refN} by ${tgtD / refD} too, and verify visually on the bars!`,
        ],
        successFeedback: `Exact match! ${refN}/${refD} = ${tgtN}/${tgtD}.`,
      };
    }

    case 'balance': {
      const mystery =
        difficulty === 1
          ? randInt(3, 8)
          : difficulty === 2
            ? randInt(4, 12)
            : randInt(5, 15);
      const leftBoxes = difficulty === 1 ? 1 : 2;
      const leftConst = difficulty === 1 ? randInt(2, 6) : randInt(1, 5);
      const rightBoxes = difficulty === 3 ? 1 : 0;
      const rightConst =
        (leftBoxes - rightBoxes) * mystery + leftConst;
      return {
        id: uid,
        stage: 'practice',
        prompt: `Balance the cosmic scale to find the weight of one Mystery Box (?)!`,
        voiceText: `Keep both pans balanced and isolate one Mystery Box to discover its secret weight!`,
        goalDescription: `Isolate 1 Mystery Box (?) on a balanced scale.`,
        config: {
          track: 'balance',
          mode: 'solve',
          mysteryValue: mystery,
          leftBoxes,
          leftConstant: leftConst,
          rightBoxes,
          rightConstant: rightConst,
        },
        expectedAnswer: mystery,
        choices: makeChoices(mystery, 1),
        hints: [
          `Remove ${leftConst} from BOTH pans first so the scale stays level.`,
          leftBoxes > 1
            ? `Once boxes are alone on one side, split the remaining weight evenly among the boxes.`
            : `Read the weight left on the opposite pan when ? is alone!`,
        ],
        successFeedback: `Mystery solved! Each ? box weighs ${mystery}.`,
      };
    }
  }
}
