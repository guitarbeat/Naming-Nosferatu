# Implementation Plan: Navigation and Profile UI Fixes

## Overview

This implementation plan addresses four CSS/layout fixes in the Name Nosferatu application. The changes are straightforward Tailwind CSS class modifications with no architectural changes required. Tasks are organized to make incremental changes with testing after each component modification.

## Tasks

- [x] 1. Fix FluidNav positioning to bottom of viewport
  - Update `FluidNav.tsx` to change `bottom-6` to `bottom-0` in the className
  - Verify the navigation bar is flush with the bottom edge
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 Write unit tests for FluidNav positioning
  - Test that FluidNav has `bottom-0` class applied
  - Test that computed style shows `position: fixed` and `bottom: 0px`
  - _Requirements: 1.1, 1.3_

- [ ]* 1.2 Write property test for navigation position stability
  - **Property 2: Navigation Position Stability Across Viewports**
  - **Validates: Requirements 1.2**
  - Test that FluidNav maintains bottom position across different viewport sizes
  - _Requirements: 1.2_

- [x] 2. Fix ProfileSection avatar sizing and aspect ratio
  - Update `ProfileSection.tsx` avatar container classes
  - Change `w-24 h-24` to `w-16 h-16` for mobile
  - Change `md:w-32 md:h-32` to `md:w-20 md:h-20` for desktop
  - Verify avatar renders as perfect circle at new size
  - _Requirements: 2.1, 2.2, 3.1, 3.3_

- [ ]* 2.1 Write unit tests for ProfileSection avatar
  - Test that avatar container has matching width and height classes
  - Test that avatar img has `object-cover` class
  - Test that avatar size is 64px (mobile) or 80px (desktop)
  - _Requirements: 2.1, 2.4, 3.1_

- [ ]* 2.2 Write property test for avatar aspect ratio
  - **Property 1: Avatar Aspect Ratio Consistency**
  - **Validates: Requirements 2.1, 2.2**
  - Test that all avatar containers maintain 1:1 aspect ratio
  - _Requirements: 2.1, 2.2_

- [ ]* 2.3 Write property test for responsive avatar sizing
  - **Property 3: Responsive Avatar Sizing**
  - **Validates: Requirements 3.3**
  - Test that avatar size changes appropriately at different viewport widths
  - _Requirements: 3.3_

- [x] 3. Remove search interface from TournamentToolbar
  - Update `TournamentToolbar.tsx` to remove the search input div block
  - Remove or comment out `handleSearchChange` function (optional cleanup)
  - Verify toolbar renders correctly without search input
  - _Requirements: 4.1, 4.2_

- [ ]* 3.1 Write unit test for search removal
  - Test that TournamentToolbar does not contain search input element
  - Test that toolbar renders without errors
  - _Requirements: 4.1_

- [ ] 4. Checkpoint - Visual verification and testing
  - Run all tests to ensure they pass
  - Manually verify the UI changes in the browser
  - Check navigation bar is at bottom edge
  - Check avatars are circular and appropriately sized
  - Check search interface is removed
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- All changes are CSS/layout modifications using Tailwind utility classes
- No architectural changes or new components required
- Testing uses React Testing Library and fast-check for property-based tests
- Each property test should run minimum 100 iterations
- Property tests should be tagged with: `// Feature: navigation-profile-ui-fixes, Property {N}: {property text}`
