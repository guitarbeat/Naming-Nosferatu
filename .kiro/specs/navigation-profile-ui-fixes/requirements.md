# Requirements Document

## Introduction

This specification addresses UI/UX issues in the navigation bar and profile section of the Name Nosferatu application. The current implementation has positioning, sizing, and layout issues that affect the visual consistency and user experience. This spec focuses on fixing the navigation bar positioning, ensuring avatar images render as perfect circles, reducing avatar sizes, and removing the search interface from the name management toolbar.

## Glossary

- **FluidNav**: The bottom navigation bar component that provides primary navigation across the application
- **ProfileSection**: The user profile management component displaying user information and avatar
- **TournamentToolbar**: The toolbar component containing filters and search functionality for tournament names
- **Avatar**: The circular profile image representing a user
- **Viewport**: The visible area of the browser window

## Requirements

### Requirement 1: Navigation Bar Positioning

**User Story:** As a user, I want the navigation bar positioned at the bottom edge of the viewport, so that it provides easy thumb access on mobile devices without wasting screen space.

#### Acceptance Criteria

1. THE FluidNav SHALL be positioned at the bottom edge of the viewport with minimal or no gap
2. WHEN the viewport is resized, THE FluidNav SHALL maintain its position at the bottom edge
3. THE FluidNav SHALL remain fixed during scrolling and stay at the bottom of the viewport

### Requirement 2: Profile Avatar Circle Shape

**User Story:** As a user, I want my profile avatar to display as a perfect circle, so that it looks professional and consistent with modern UI design patterns.

#### Acceptance Criteria

1. THE ProfileSection avatar container SHALL maintain a 1:1 aspect ratio to ensure circular rendering
2. THE FluidNav avatar container SHALL maintain a 1:1 aspect ratio to ensure circular rendering
3. WHEN an avatar image is loaded, THE System SHALL preserve the circular shape without distortion
4. THE avatar image SHALL use object-cover with proper aspect ratio constraints

### Requirement 3: Avatar Size Reduction

**User Story:** As a user, I want the profile avatar to be smaller and less prominent, so that it doesn't dominate the profile section and maintains visual hierarchy.

#### Acceptance Criteria

1. THE ProfileSection avatar SHALL be reduced from its current size (w-24 h-24 / w-32 h-32) to a more compact size
2. THE avatar size reduction SHALL maintain readability and recognizability of the image
3. THE avatar size SHALL be responsive across different screen sizes (mobile and desktop)
4. WHEN the avatar size is reduced, THE surrounding layout SHALL adjust proportionally

### Requirement 4: Search Interface Removal

**User Story:** As a user, I want the search names interface removed from the tournament toolbar, so that the interface is simplified and focused on core functionality.

#### Acceptance Criteria

1. THE TournamentToolbar SHALL not display the search input field
2. WHEN the TournamentToolbar is rendered, THE System SHALL exclude search-related UI elements
3. THE remaining toolbar elements SHALL adjust their layout to fill the available space
4. THE search functionality code SHALL be removed or commented out to prevent future confusion
