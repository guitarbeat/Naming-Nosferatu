# 00-system-understanding.md

## Application Overview

**Naming Nosferatu** is a React application for managing cat names and related tournament data. The application supports name suggestion, voting, ranking, and tournament management functionality centered around cat naming competitions.

## Tech Stack and Tooling

### Core Framework

- **React 19.2.3** with TypeScript
- **Vite 7.3.1** for build tooling and development server
- **React Router DOM 6.21.3** for client-side routing

### State Management

- **Zustand 5.0.9** for client-side state management (slices-based architecture)
- **@tanstack/react-query 5.90.16** for server state management and caching
- **Immer 11.1.3** for immutable state updates

### Backend & Data

- **Supabase** for backend services and database
- **Zod 4.3.5** for schema validation
- **React Hook Form 7.49.3** with resolvers for form management

### UI & Styling

- **Tailwind CSS 4.1.18** for utility-first styling
- **Framer Motion 12.24.10** for animations
- **Lucide React** and **Heroicons** for iconography (dual icon libraries)
- **@radix-ui/react-slot** for component composition
- **Class Variance Authority** for component variants

### Development & Quality

- **Biome** for linting and formatting
- **Vitest** for testing
- **Knip** for dependency analysis
- **Stylelint** for CSS linting
- **TypeScript** for type checking

### Additional Libraries

- **@hello-pangea/dnd** for drag-and-drop functionality
- **Lovable-tagger** for tagging functionality
- Custom sound manager and performance monitoring

## Component Architecture and Folder Structure

### Feature-Based Organization

The codebase follows a feature-driven architecture with clear separation:

```
src/
├── core/                    # Application core (constants, hooks, store)
├── features/               # Feature modules
│   ├── analytics/          # Analytics dashboard and components
│   ├── auth/               # Authentication functionality
│   ├── gallery/            # Gallery view for cat images
│   ├── profile/            # User profile management
│   └── tournament/         # Tournament management (most complex feature)
├── integrations/           # External service integrations (Supabase)
├── shared/                 # Shared components and utilities
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Shared custom hooks
│   ├── navigation/         # Navigation system
│   ├── providers/          # React context providers
│   ├── services/           # Business logic services
│   ├── styles/             # Shared CSS styles
│   └── utils/              # Utility functions
├── types/                  # TypeScript type definitions
└── App.tsx, main.tsx       # Application entry points
```

### Component Patterns

- **Feature components** live within their respective feature directories
- **Shared components** are organized by component name (e.g., `Button/`, `Card/`, `Form/`)
- Many components have dedicated CSS modules alongside their TSX files
- Mix of CSS modules and Tailwind classes for styling

## Styling Approach and Design Tokens

### Primary Styling Strategy

- **Tailwind CSS** as the primary styling system with utility classes
- **CSS Modules** for component-specific styles (particularly in tournament features)
- **Design tokens** appear to be implicit rather than formally defined

### Observed Patterns

- Heavy use of Tailwind's spacing, color, and layout utilities
- Custom CSS variables for theming (likely defined in shared styles)
- Mix of component-level styling (CSS modules) and utility classes
- Some components use dedicated style directories with multiple CSS files

### Iconography

- **Dual icon systems**: Both Lucide React and Heroicons are installed
- Icons are used throughout the application for UI elements
- No clear design system documentation for icon usage patterns

## Repeated UI Patterns

### Layout Components

- **Card components** for content containers
- **Header/Navigation** components for page structure
- **Form components** with validation (ValidatedInput, Form)
- **Loading/Error states** with consistent UI patterns

### Tournament-Specific Patterns

- **Tournament controls** and setup components
- **Bracket visualization** for tournament structure
- **Ranking adjustment** interfaces
- **Performance badges** for displaying metrics

### Shared UI Elements

- **Toast notifications** for user feedback
- **Modal dialogs** (NameSuggestionModal - accessed via "Suggest" button in bottom navigation)
- **Empty states** for no-data scenarios
- **Offline indicators** for connectivity status

## Constraints and Risks

### Bundle Size

- Current bundle: **391KB total (48% optimized)**
- Target: **<368KB** through systematic optimization
- Multiple icon libraries contributing to bundle size
- Complex feature set requiring careful dependency management

### Architecture Constraints

- Feature-based organization with shared components
- State management split between Zustand (client) and React Query (server)
- Supabase dependency for backend services
- TypeScript strictness requirements

### Development Constraints

- Modern tooling requirements (Node >=20, pnpm >=9)
- Multiple quality gates (linting, type checking, bundle limits)
- Vercel deployment target

## Areas of Uncertainty

### Design System Maturity

- Lack of explicit design tokens or component library documentation
- Inconsistent styling patterns (CSS modules vs Tailwind)
- Dual icon library usage without clear guidelines

### Navigation Architecture

- Recent navigation consolidation work (evident from `.dev/specs/navigation-consolidation/`)
- Multiple navigation-related files suggest potential complexity or evolution

### UI/UX Consolidation

- Active UI/UX consolidation project (evident from `.dev/specs/ui-ux-consolidation/`)
- Suggests current UI patterns may be inconsistent or need standardization

### Performance Characteristics

- Bundle size optimization in progress
- Unknown runtime performance characteristics
- Impact of Framer Motion animations on performance

### Testing Coverage

- Vitest setup exists but test file coverage unknown
- Only one test file visible (`tournamentUtils.test.ts`)

### Accessibility Compliance

- No explicit accessibility guidelines or testing mentioned
- Unknown WCAG compliance level
- Screen reader and keyboard navigation support unclear
