# Continuous Fluid Sanctuary Tournament Plan

## 1. Context & Goal
We are eliminating the abrupt transition from the floating orb space into a separate static tournament page. Instead, when **Start Bracket** is clicked, the entire head-to-head tournament unfolds organically inside the same living floating arena: the **Selected Sanctuary Dock** liquid-morphs upward into an **Expanded Sanctuary Arena Stage**, the two active matchup orbs spring-fly into Left & Right Duel Pedestals inside the stage, unselected orbs continue drifting in the outer space around the forcefield, and voting launches eliminated orbs back into the outer drift while returning winners to the Sanctuary survivor pool.

## 2. Confirmed Product & UX Decisions
- **Sanctuary Stage Expansion**: Clicking **Start Bracket** keeps the floating orb canvas, physics bodies, and animated mouse cursor continuously active. The bottom Sanctuary Dock smoothly expands upward into an **Arena Stage** where the two active matchup contenders face off inside the forcefield while remaining tournament survivors wait in a docked Sanctuary queue row.
- **Direct Orb Duel Voting**: Players vote by clicking or tapping directly on either of the two enlarged dueling orbs (or pressing `Left Arrow` / `Right Arrow`), with clear hover/focus rings, matchup prompts, and subtle Web Audio chime feedback.
- **Fluid Post-Vote Resolution**:
  - **Winning Orb(s)**: Pulse with a celebratory golden/rose halo and spring-glide back into the Sanctuary survivor row to await the next round.
  - **Eliminated Orb(s)**: Eject upward across the Sanctuary forcefield boundary with a ripple and launch velocity back into the outer floating drift space.
  - **Champion Finale**: When the final match concludes, the crowned Champion orb(s) take center stage inside the Sanctuary with a celebratory aura, full rankings drawer toggle, and an inline **New Bracket** reset that releases orbs smoothly without reloading.

## 3. Visual & Spatial Architecture

```
+-----------------------------------------------------------------------+
|  [ Theme Toggle ]          OUTER DRIFT ARENA                          |
|                                                                       |
|     ( Mochi )         ( Shadow )      <-- Unselected & eliminated     |
|                          \                orbs keep drifting &        |
|                        ,=^..^=,~~         chasing the Mouse cursor    |
|                                                                       |
|         +--------------- SANCTUARY ARENA STAGE ---------------+       |
|         |  "Which name fits best?"     Round 1 · Match 2 of 4 |       |
|         |                                                     |       |
|         |      ( ( LUNA ) )       VS       ( ( OLIVER ) )     |       |
|         |     [Click / Left]              [Click / Right]     |       |
|         |                                                     |       |
|         |  Survivors Queue:  ( Bella )  ( Leo )  ( Milo )     |       |
|         |  -------------------------------------------------  |       |
|         |  [ Undo ]   [ View Bracket ]        [ End Bracket ] |       |
|         +-----------------------------------------------------+       |
+-----------------------------------------------------------------------+
```

- **Continuous Physics Coordinate Engine**:
  - Every orb remains a single persistent DOM node in `DriftWall` across Selection, Active Matchup, and Champion states—zero unmount/remount page swaps.
  - During tournament mode, each orb's physics state dynamically resolves to one of four spatial roles:
    1. **Outer Drift (`unselected` / `eliminated`)**: Floats freely in the upper/outer arena, bounces off walls and the expanded Sanctuary Stage boundary, and chases the animated mouse cursor.
    2. **Sanctuary Survivor Queue (`queued`)**: Comfortably docked in the lower survivor row inside the Sanctuary forcefield.
    3. **Active Duelist (`dueling-left` / `dueling-right`)**: Springs to the Left or Right Duel Pedestal inside the upper Sanctuary Stage at an enlarged hero scale (`1.35x`–`1.5x`) with an interactive duel halo and click/tap vote handler.
    4. **Crowned Champion (`champion`)**: Springs to the central pedestal inside the Sanctuary Stage at `1.65x` scale with a celebratory crown badge and golden glow.

## 4. Key Functional & Animation Flows
- **Seamless Bracket Start & Match Progression**:
  - Clicking **Start Bracket** locks the current selected orbs as the tournament roster and transitions the Sanctuary Dock into `tournament` mode.
  - For each match (supporting both `1v1` Solo and `2v2` Duo modes), the active contender orb(s) smoothly spring from the survivor queue up to the Left and Right Duel Pedestals inside the Sanctuary Stage.
- **Vote & Ejection Physics**:
  - Clicking a dueling orb (or pressing `ArrowLeft` / `ArrowRight`) triggers a brief resolution beat (`~320ms`): the winner flashes with a victory ring and glides back to the survivor row, while the eliminated contender is removed from the survivor set, triggers a boundary ripple, and receives an upward impulse velocity (`vy < 0`) back into the outer drift space.
- **Inline Controls & Overlays**:
  - The bottom strip of the Sanctuary Stage houses live round progress (`Round X · Match Y`), **Undo Last Pick** (which pulls the last eliminated orb right back from the outer drift into the Sanctuary duel!), **Bracket / Rankings Drawer** modal toggle, and **Exit Bracket** to return to open selection.

## 5. Verification Criteria
- **Zero Page Unmounts**: Starting a bracket, voting through matches, undoing a pick, and crowning a champion all occur within the same continuous `DriftWall` canvas without unmounting orbs or resetting outer drifting orbs.
- **Physics & Boundary Integrity**: Unselected and newly eliminated orbs bounce cleanly off the expanded Sanctuary Stage forcefield and continue reacting to the animated mouse cursor.
- **Full Keyboard & Pointer Accessibility**: Voting works via direct click/tap on the dueling orbs inside the Sanctuary Stage as well as `Left Arrow` / `Right Arrow` keys, with `Undo` restoring both tournament state and orb Sanctuary membership.
