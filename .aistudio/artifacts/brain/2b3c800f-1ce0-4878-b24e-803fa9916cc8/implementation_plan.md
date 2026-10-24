# Minimal Command Dock & Dedicated Selection Clear

A streamlined, ultra-minimal interface for Name Nosferatu featuring an always-responsive selection Clear button, simplified floating dock geometry, and reduced visual clutter.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices**:
> - **Clear Button Scope**: Clears currently selected names from the sanctuary selection pool without resetting overall tournament records.
> - **Design Direction**: Ultra-clean floating dock with minimal text, quiet counters, and essential actions only.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces crowded explanatory labels, redundant status text, and heavy ornamentation in the floating bottom dock with a sleek, minimalist command bar. Adds a clear, accessible button to empty currently selected contender orbs at any point.
- **Key Value**: Focuses attention entirely on the floating contender orbs and duel mechanics, eliminating unnecessary visual noise and providing instant, tactile reset controls.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Selection & Clear**:
   - As the user taps or marquee-selects floating contender orbs, the dock displays a concise badge (e.g., `3 selected`).
   - A distinct, minimal `Clear` button appears with immediate zero-latency feedback to deselect all orbs with a single click.
   - When $\ge 2$ orbs are selected, the primary action button (`Start`) becomes active.
2. **Active Tournament Flow**:
   - During head-to-head voting, the dock displays a quiet match tracker (`Round 1 · Match 2/4`) with an `Undo` button and a compact `Exit` action.
3. **Tournament Finished Flow**:
   - When a champion is crowned, the dock displays a clean victory indicator (`Champion: [Name]`) alongside a primary `New Bracket` button.

### Visual Styling & Geometry

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│                                ( Floating Contender Orbs )                              │
│                                                                                        │
│                                                                                        │
│                  ┌──────────────────────────────────────────────────┐                  │
│                  │  Name Nosferatu   ·   4 selected      Clear   Start │                  │
│                  └──────────────────────────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Floating Shell**: Single-tier pill (`h-12 sm:h-14`, `rounded-full`) with reduced border opacity and refined frosted glass backdrop (`backdrop-blur-xl`).
- **Typography**: Clean text hierarchy without multi-line descriptions or decorative code comments.
- **Action Buttons**:
  - `Clear`: Subtle ghost/muted pill with an `X` icon, clearly visible whenever items are selected.
  - `Start`: High-contrast primary action button displaying contender count (`Start · 4`).

---

## 3. Key Product Decisions & Trade-Offs

- **Clear Button Action**:
  - *Chosen Approach*: Resets `selectedNames` in the store (`tournamentActions.setSelection([])`).
  - *Why*: Allows users to quickly restart selection or abandon accidental multi-selects without wiping earned Elo ratings or previous tournament history.
- **Dock Text Reduction**:
  - *Chosen Approach*: Remove redundant instruction text (`Drag a box or tap orbs to choose names`, `in sanctuary`, mode formulas).
  - *Why*: The drifting orbs and marquee drag mechanics are intuitive; removing instructional text gives the interface a quiet, premium feel.

---

## 4. Technical Architecture & Component Mapping

```
┌──────────────────────────────────────────────────────────┐
│                 TournamentSetup Container                │
│                                                          │
│  ┌─────────────────────────┐   ┌───────────────────────┐ │
│  │   tournamentActions     │   │     DriftWall         │ │
│  │   .setSelection([])     │   │   (Floating Arena)    │ │
│  └────────────┬────────────┘   └───────────┬───────────┘ │
│               │                            │             │
│               ▼                            ▼             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           Ultra-Minimal Dock Footer                 │ │
│  │  [Brand Mark]  [Count Badge]   [Clear]   [Action]   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Component Adjustments

1. `src/tournament/TournamentSetup.tsx`:
   - Refactor `dockFooterControls` to render minimal, scannable states across idle selection, active tournament, and completed bracket.
   - Ensure the `Clear` button is always rendered with clear interactive affordance whenever `selectedCount > 0`.
   - Streamline status indicators into clean typographic pairings with subtle bullet separators.
2. `src/components/DriftWall.tsx`:
   - Tune dock shell padding and height for a sleek, compact vertical footprint.
