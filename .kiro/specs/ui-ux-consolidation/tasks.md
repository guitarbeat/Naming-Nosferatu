# Implementation Plan: UI/UX Consolidation

## Overview

This plan migrates the UI/UX system to use design tokens consistently, consolidates documentation, and ensures accessibility compliance. Tasks are ordered to complete foundational token work before component migration.

## Tasks

- [x] 1. Consolidate UI/UX documentation
  - [x] 1.1 Expand `docs/UI_UX.md` with complete token reference
    - Add table of contents with all sections
    - Document all design tokens with usage examples
    - Include glass surface presets documentation
    - _Requirements: 1.1, 1.2, 1.3, 3.4_
  - [x] 1.2 Remove UI sections from `docs/ARCHITECTURE.md`
    - Keep only system design and database schema
    - Reference `UI_UX.md` for visual design guidance
    - _Requirements: 1.1, 1.4_
  - [x] 1.3 Simplify `.agent/workflows/ui-ux.md` to workflow only
    - Remove design guidance that duplicates `UI_UX.md`
    - Keep development commands and checklist
    - _Requirements: 1.1, 1.4_

- [x] 2. Complete design token migration
  - [x] 2.1 Migrate z-index values to tokens
    - Search all CSS files for hardcoded z-index
    - Replace with `--z-*` token references
    - _Requirements: 2.1_
  - [ ]* 2.2 Write property test for z-index token compliance
    - **Property 1: Z-Index Token Compliance**
    - **Validates: Requirements 2.1**
  - [x] 2.3 Migrate `SetupCards.module.css` to responsive tokens
    - Replace hardcoded `180px` widths with `--card-width-responsive`
    - _Requirements: 2.2_
  - [x] 2.4 Migrate `SetupSwipe.module.css` color fallbacks
    - Replace hardcoded colors with token references
    - _Requirements: 2.3_
  - [x] 2.5 Migrate spacing values to tokens
    - Search CSS modules for hardcoded rem/px spacing
    - Replace with `--space-*` tokens
    - _Requirements: 2.4_
  - [ ]* 2.6 Write property test for spacing token compliance
    - **Property 2: Spacing Token Compliance**
    - **Validates: Requirements 2.4**
  - [x] 2.7 Migrate breakpoint values to tokens
    - Replace hardcoded `768px` with `var(--breakpoint-md)`
    - Replace other hardcoded breakpoints similarly
    - _Requirements: 2.5_
  - [ ]* 2.8 Write property test for breakpoint token compliance
    - **Property 3: Breakpoint Token Compliance**
    - **Validates: Requirements 2.5**

- [x] 3. Checkpoint - Verify token migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Standardize glass surfaces
  - [x] 4.1 Add glass preset utility classes to design tokens
    - Define `.glass-light`, `.glass-medium`, `.glass-strong` patterns
    - _Requirements: 3.1, 3.2_
  - [x] 4.2 Verify glass tokens in both themes
    - Ensure all `--glass-*` tokens defined in light and dark theme blocks
    - _Requirements: 3.3_
  - [ ]* 4.3 Write property test for glass token theme parity
    - **Property 4: Glass Token Theme Parity**
    - **Validates: Requirements 3.3**

- [-] 5. Complete accessibility audit
  - [ ] 5.1 Audit analytics views for focus states
    - Add `:focus-visible` styles using `--focus-ring` token
    - _Requirements: 4.1, 4.4_
  - [ ]* 5.2 Write property test for focus state token compliance
    - **Property 5: Focus State Token Compliance**
    - **Validates: Requirements 4.1, 4.4**
  - [ ] 5.3 Verify touch target sizes
    - Ensure all interactive elements have 48px minimum
    - _Requirements: 4.2_
  - [ ]* 5.4 Write property test for touch target minimum size
    - **Property 6: Touch Target Minimum Size**
    - **Validates: Requirements 4.2**
  - [ ] 5.5 Add reduced motion support
    - Verify `prefers-reduced-motion` media queries exist
    - _Requirements: 4.3_
  - [ ]* 5.6 Write property test for reduced motion respect
    - **Property 7: Reduced Motion Respect**
    - **Validates: Requirements 4.3**

- [ ] 6. Checkpoint - Verify accessibility compliance
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Migrate component styles
  - [ ] 7.1 Migrate `useMasonryLayout` hook to design tokens
    - Replace hardcoded values with token references
    - _Requirements: 5.1_
  - [ ] 7.2 Verify CSS module co-location
    - Ensure all component CSS modules are co-located
    - _Requirements: 5.2_
  - [ ]* 7.3 Write property test for CSS module co-location
    - **Property 8: CSS Module Co-location**
    - **Validates: Requirements 5.2**
  - [ ] 7.4 Remove unnecessary inline styles
    - Replace with CSS custom properties where possible
    - _Requirements: 5.3_
  - [ ] 7.5 Migrate responsive sizing to clamp()
    - Use token-based bounds for responsive values
    - _Requirements: 5.4_

- [ ] 8. Verify theme system
  - [ ] 8.1 Audit theme token completeness
    - Document all theme-aware tokens in `UI_UX.md`
    - _Requirements: 6.3_
  - [ ] 8.2 Verify theme transitions use tokens
    - Ensure `--transition-theme` is used consistently
    - _Requirements: 6.4_
  - [ ]* 8.3 Write property test for theme transition token usage
    - **Property 9: Theme Transition Token Usage**
    - **Validates: Requirements 6.4**

- [ ] 9. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use static analysis of CSS files
- Unit tests verify specific file migrations
