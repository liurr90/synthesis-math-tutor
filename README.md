# Synthesis Math Tutor — Cosmic Math Discovery Lab (Grades 2–4)

An interactive, Socratic visual math discovery platform inspired by Synthesis Tutor. Students learn by **building, exploding, jumping, splitting, and balancing** inside 5 tactile cosmic manipulatives guided by **Nova**, a friendly voice-enabled Socratic tutor.

---

## 5 Interactive Manipulative Engines

1. **Exploding Dots Base-10 Machine (`place-value`)**
   - Inspired by James Tanton's *Exploding Dots* (`10 → 1` machine).
   - Add or remove glowing energy dots in Ones, Tens, and Hundreds chambers.
   - When a chamber holds 10+ dots, trigger **Explode 10 → 1** to regroup upward—or **Unexplode 1 → 10** to borrow downward for subtraction.

2. **Rocket Number Line (`number-line`)**
   - Blast across space in strategic hops (`+1`, `+5`, `+10`, `-1`, `-5`, `-10`, or custom friendly-10 leaps).
   - Visualizes addition, subtraction, missing addends, and bridging across tens/hundreds.

3. **Energy Array & Laser Splitter (`arrays`)**
   - Build rectangular grids of plasma cells (`rows × cols`), rotate to discover the **Commutative Property**, and slice arrays with a **Laser Splitter** to visualize the **Distributive Property** (e.g., `7 × 6 = 5 × 6 + 2 × 6`).

4. **Fraction Splitter & Equivalence Lab (`fractions`)**
   - Partition cosmic energy bars (`1` through `12` equal parts), shade slices, and compare directly against a reference crystal bar to discover **equivalent fractions** (`1/2 = 2/4 = 3/6`) and fraction addition.

5. **Mystery Box Balance Scale (`balance`)**
   - Tactile pre-algebra balance beam with Mystery Boxes (`?`) and unit weights.
   - Add or remove equal weights/boxes from both pans until `?` is isolated on one side and the beam balances level.

---

## Socratic Voice Guide: Nova

- **Stage-Based Learning Loop**: Every lesson follows `Discover` → `Guided` → `Practice` → `Celebrate`.
- **Zero-File Web Audio & Speech**: Synthesized sci-fi sound effects (`Web Audio API`) and spoken guidance (`window.speechSynthesis`) with toggleable sound and voice controls.
- **Misconception Detectors**: Deterministic engine catches un-exploded 10+ dot chambers, off-by-10 regrouping errors, array off-by-one row/column errors, fraction numerator/denominator mistakes, and unbalanced mystery-box isolations—returning gentle, targeted Socratic prompts instead of generic "Wrong" messages.
- **Infinite Challenge Generator**: Unlimited randomized practice challenges across difficulty tiers (`1`, `2`, `3`) for every track.

---

## Common Core Alignment (Grades 2–4)

| Track | Standards Covered | Core Concepts |
| --- | --- | --- |
| Place Value (`place-value`) | `2.NBT.A.1`, `2.NBT.B.7`, `3.NBT.A.2` | Hundreds/Tens/Ones, 10-for-1 regrouping, addition & subtraction |
| Number Line (`number-line`) | `2.MD.B.6`, `2.NBT.B.5`, `3.NBT.A.2` | Friendly-10 jumps, missing addends, distance & difference |
| Arrays (`arrays`) | `2.OA.C.4`, `3.OA.A.1`, `3.OA.B.5` | Repeated addition, commutative rotation, distributive laser split |
| Fractions (`fractions`) | `3.NF.A.1`, `3.NF.A.3`, `4.NF.A.1`, `4.NF.B.3` | Unit fractions, equivalence, benchmark comparisons, combining parts |
| Balance (`balance`) | `2.OA.A.1`, `3.OA.A.4`, `4.OA.A.2`, `4.OA.A.3` | Equality, unknown quantities (`?`), two-step equation balancing |

---

## Scripts

```bash
npm install
npm run dev      # Start Vite dev server at http://127.0.0.1:5175
npm test         # Run Vitest deterministic math & curriculum checks
npm run build    # Type-check and build production bundle
```
