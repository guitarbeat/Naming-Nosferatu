# Architecture & System Design

**Last Updated:** January 2026
**Status:** Primary Blueprint for System Design & Data

> **Note:** For visual design guidance, design tokens, and UI/UX patterns, see [UI_UX.md](./UI_UX.md).

## 🏛️ System Overview

**Name Nosferatu** is a tournament platform where cat names evolve through a deliberate lifecycle of comparison and elimination. The system enforces mathematical rigor while embracing the obsessive nature of finding the "perfect" name.

### Tech Stack

- **Framework**: React 19.2.3 (Actions, `use` hook)
- **Build Tool**: Vite 7.3.1
- **State Management**: Zustand (Global) + TanStack Query (Server)
- **Routing**: React Router DOM v6.30.3 (programmatic navigation, route protection)
- **Styling**: CSS Modules + Class Variance Authority (CVA) + Design Tokens
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Domain Logic**: TypeScript with strict invariants
- **Animations**: Framer Motion 11.18.1
- **Forms**: React Hook Form with validation

---

## 🎯 Core Business Concept

**Name Nosferatu** transforms generic name picking into deliberate obsession. Names follow a lifecycle of scientific comparison: **Candidate** → **Intake** → **Tournament** → **Winner** → **Archive**. Every decision matters, every comparison reveals truth.

---

## 📊 Domain Model v2.0

### Core Entities

#### Name
The fundamental entity that flows through the lifecycle.

```typescript
interface Name {
  id: string;                    // UUID
  name: string;                  // The actual name text
  status: NameStatus;           // Current lifecycle position
  addedBy: string;              // User who added this name
  addedAt: Date;                // When it entered the system
  categories: string[];         // Themes: science, mythology, vibes, etc.
  syllableCount?: number;       // Optional constraint for tournaments
  provenance: ProvenanceEntry[]; // Complete history
  metadata: NameMetadata;       // Ratings, stats, etc.
}

type NameStatus =
  | 'candidate'     // New, awaiting review
  | 'intake'        // Categorized and tournament-ready
  | 'tournament'    // Currently in active competition
  | 'eliminated'    // Lost in tournament
  | 'archived';     // Preserved winner or notable name
```

#### Tournament
A competition between names using Elo rating system.

```typescript
interface Tournament {
  id: string;                    // UUID
  participantIds: string[];     // Name IDs competing
  votes: Vote[];                // Complete voting history
  status: TournamentStatus;     // Current state
  winnerId?: string;           // Determined winner
  constraints: TournamentConstraints; // Rules and limits
  metadata: TournamentMetadata; // Performance stats
  createdAt: Date;
  completedAt?: Date;
}

type TournamentStatus =
  | 'setup'       // Being configured
  | 'active'      // Accepting votes
  | 'completed'   // Winner determined
  | 'cancelled';  // Abandoned

interface TournamentConstraints {
  maxParticipants: number;      // 4-16 names
  theme?: string;              // Optional category filter
  syllableLimit?: number;       // Optional length constraint
  timeLimit?: number;          // Minutes per session
  expertMode: boolean;         // Advanced features enabled
}
```

#### Vote
An atomic comparison between two names.

```typescript
interface Vote {
  id: string;                  // UUID
  tournamentId: string;        // Parent tournament
  winnerId: string;           // Name that won this comparison
  loserId: string;            // Name that lost
  margin: number;             // Elo rating change magnitude
  userId: string;             // Who made this decision
  timestamp: Date;            // When vote was cast
  context: VoteContext;       // Additional metadata
}

interface VoteContext {
  round: number;              // Tournament round number
  totalRounds: number;        // Total rounds in tournament
  timeToDecide: number;       // Seconds taken to decide
  confidence: number;         // Self-reported confidence 1-5
}
```

#### User
A person participating in the naming obsession.

```typescript
interface User {
  id: string;                  // UUID from auth provider
  username: string;            // Display name
  preferences: UserPreferences;
  statistics: UserStatistics;  // Voting patterns, preferences
  createdAt: Date;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  showCatPictures: boolean;
  decisionFatigueLimit: number;  // Max votes per session
  expertMode: boolean;          // Show advanced features
  notifications: boolean;
}

interface UserStatistics {
  totalVotes: number;
  favoriteCategories: string[];
  averageDecisionTime: number;
  consistencyScore: number;    // How predictable their preferences are
}
```

### Name Lifecycle State Machine

```
candidate → intake → tournament → (eliminated | archived)

- candidate: Initial state for new names
- intake: Categorized and prepared for competition
- tournament: Actively competing in brackets
- eliminated: Lost in tournament (can be revived)
- archived: Preserved winner or historically significant
```

### Lifecycle Business Rules

#### Creation & Intake
```typescript
// Names enter as candidates
const newName: Name = {
  status: 'candidate',
  provenance: [{
    action: 'created',
    userId: currentUser.id,
    timestamp: new Date(),
    details: { source: 'user_input' | 'suggestion' }
  }]
};

// Move to intake after categorization
function moveToIntake(name: Name): Name {
  if (name.categories.length === 0) {
    throw new Error('Names must be categorized before intake');
  }

  return {
    ...name,
    status: 'intake',
    provenance: [...name.provenance, {
      action: 'categorized',
      userId: currentUser.id,
      timestamp: new Date(),
      details: { categories: name.categories }
    }]
  };
}
```

#### Tournament Participation
```typescript
// Names enter tournament from intake or archived
function enterTournament(name: Name, tournamentId: string): Name {
  if (!['intake', 'archived'].includes(name.status)) {
    throw new Error('Only intake/archived names can enter tournaments');
  }

  return {
    ...name,
    status: 'tournament',
    provenance: [...name.provenance, {
      action: 'entered_tournament',
      tournamentId,
      timestamp: new Date()
    }]
  };
}

// Elimination or archiving after tournament
function completeTournament(name: Name, result: 'winner' | 'eliminated'): Name {
  const newStatus = result === 'winner' ? 'archived' : 'eliminated';

  return {
    ...name,
    status: newStatus,
    provenance: [...name.provenance, {
      action: result === 'winner' ? 'archived_as_winner' : 'eliminated',
      timestamp: new Date(),
      details: { tournamentId: currentTournament.id }
    }]
  };
}
```

### Business Invariants

#### Tournament Invariants
```typescript
// INVARIANT: Every tournament produces exactly one winner
function validateTournamentCompletion(tournament: Tournament): boolean {
  const completedTournaments = tournaments.filter(t => t.status === 'completed');
  return completedTournaments.every(t => t.winnerId && t.participantIds.includes(t.winnerId));
}

// INVARIANT: Vote totals always match ballot count
function validateVoteIntegrity(tournament: Tournament): boolean {
  const expectedVotes = calculateExpectedVotes(tournament.participantIds.length);
  return tournament.votes.length === expectedVotes;
}

// INVARIANT: Names can only move forward in lifecycle
function validateLifecycleProgression(name: Name): boolean {
  const statusOrder = ['candidate', 'intake', 'tournament', 'eliminated', 'archived'];
  const currentIndex = statusOrder.indexOf(name.status);

  return name.provenance.every(entry => {
    const entryIndex = statusOrder.indexOf(entry.previousStatus || 'candidate');
    return entryIndex <= currentIndex;
  });
}
```

#### Rating System Invariants
```typescript
// INVARIANT: All ratings are deterministic and reproducible
function validateRatingDeterminism(names: Name[], votes: Vote[]): boolean {
  const initialRatings = new Map(names.map(n => [n.id, 1500]));
  const finalRatings = calculateEloRatings(initialRatings, votes);

  // Re-running should produce identical results
  const recalculated = calculateEloRatings(initialRatings, votes);
  return deepEqual(finalRatings, recalculated);
}

// INVARIANT: No name can have infinite or NaN rating
function validateRatingBounds(names: Name[]): boolean {
  return names.every(name => {
    const rating = name.metadata.currentRating;
    return Number.isFinite(rating) && rating >= 0 && rating <= 4000;
  });
}
```

### Core Algorithms

#### Elo Rating System
```typescript
function calculateEloRatings(initialRatings: Map<string, number>, votes: Vote[]): Map<string, number> {
  const ratings = new Map(initialRatings);

  for (const vote of votes) {
    const winnerRating = ratings.get(vote.winnerId)!;
    const loserRating = ratings.get(vote.loserId)!;

    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    const kFactor = 32; // Standard Elo K-factor
    const winnerNewRating = winnerRating + kFactor * (1 - expectedWinner);
    const loserNewRating = loserRating + kFactor * (0 - expectedLoser);

    ratings.set(vote.winnerId, winnerNewRating);
    ratings.set(vote.loserId, loserNewRating);
  }

  return ratings;
}
```

#### Tournament Bracket Generation
```typescript
function generateBracket(participants: Name[], constraints: TournamentConstraints): Bracket {
  // Sort by current rating for seeding
  const seeded = participants.sort((a, b) =>
    (b.metadata.currentRating || 1500) - (a.metadata.currentRating || 1500)
  );

  // Apply theme/syllable constraints
  const filtered = seeded.filter(name =>
    (!constraints.theme || name.categories.includes(constraints.theme)) &&
    (!constraints.syllableLimit || (name.syllableCount || 0) <= constraints.syllableLimit)
  );

  if (filtered.length < 4) {
    throw new Error('Insufficient participants meet constraints');
  }

  // Generate round-robin or single-elimination based on participant count
  return constraints.expertMode ?
    generateRoundRobin(filtered) :
    generateSingleElimination(filtered);
}
```

---

## 📊 Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cat_name_options` | Available names | `id`, `name`, `avg_rating`, `status`, `categories`, `provenance` |
| `cat_name_ratings` | User ratings | `user_name`, `name_id`, `rating`, `wins`, `losses` |
| `tournament_selections`| History | `user_name`, `name_id`, `tournament_id`, `selection_type` |
| `tournaments` | Tournament data | `id`, `participant_ids`, `votes`, `status`, `winner_id`, `constraints` |
| `votes` | Individual comparisons | `id`, `tournament_id`, `winner_id`, `loser_id`, `margin`, `context` |
| `cat_app_users` | User profiles | `user_name`, `preferences`, `statistics`, `updated_at` |

**Verification Status**: ✅ Migrations match database schema as of Jan 2026.

---

## 🏗️ Design Principles

### 1. Decomposed Features

Features are organized by domain in `src/features/`. Complex views like `NameManagement` are split into specialized "Modes" (Tournament vs. Profile).

### 2. Store Slices

The global `useAppStore` is composed of focused slices:
- `tournamentSlice` - Tournament state and actions
- `userSlice` - User session and preferences
- `uiSlice` - UI state (modals, loading)
- `errorSlice` - Error handling
- `siteSettingsSlice` - Site-wide settings

### Service Layer (Supabase)

The service layer is decomposed into domain-specific modules located in `src/features/[feature]/services/` or `src/shared/services/supabase/modules/`.

- **AdminService**: User management and roles.
- **ImageService**: Cat picture uploading and management.
- **NameService**: Name lifecycle management, CRUD, and visibility.
- **AnalyticsService**: Leaderboards, popularity stats, and history.
- **SiteSettingsService**: Global application configuration.

All services use a standardized `withSupabase` wrapper in `client.ts` to ensure consistent error handling, availability checks, and automatic user context propagation.

### 4. Domain-Driven Architecture

Business logic is organized around the name lifecycle:
- **Features**: `src/features/names/` (lifecycle management), `src/features/tournament/` (competition logic)
- **Invariants**: Business rules enforced through TypeScript types and runtime validation
- **Provenance**: Complete audit trail of name evolution through states

- **Provenance**: Complete audit trail of name evolution through states

### 5. Simplicity & Consolidation
**Objective**: Minimize Lines of Code (LOC) and Cognitive Load.
- **Deduplication**: Prefer configurable shared components (e.g., `Button`) over specialized wrappers (e.g., `TournamentButton`).
- **Direct Usage**: Use Tailwind utilities for one-off styles instead of creating unique component files.
- **Flattened Structure**: Avoid deep nesting; co-locate related logic.
- **YAGNI**: Remove unused features and dead code immediately.

---


## 📁 Project Structure

```
src/
├── core/                    # Core application logic
│   ├── constants/           # App-wide constants
│   ├── hooks/               # Core hooks (routing, storage, session)
│   └── store/               # Zustand store and slices
├── features/                # Feature modules (domain-driven)
│   ├── analytics/           # Analysis dashboard
│   ├── auth/                # Authentication (hooks, utils, services)
│   ├── gallery/             # Photo gallery view
│   ├── names/               # Name lifecycle management
│   ├── profile/             # User profile
│   ├── tournament/          # Tournament competition logic
│   │   ├── components/      # Flat component structure
│   │   ├── hooks/           # Tournament hooks
│   │   ├── services/        # Tournament services
│   │   ├── styles/          # Tournament CSS modules
│   │   └── utils/           # Tournament utilities
│   └── explore/             # Global data and photo discovery
├── shared/                  # Shared utilities
│   ├── components/          # Reusable components
│   ├── hooks/               # Shared hooks
│   ├── providers/           # React context providers
│   ├── services/            # External service integrations
│   ├── styles/              # Global styles and tokens
│   └── utils/               # Utility functions
└── types/                   # TypeScript type definitions
```

---

## 🔄 Data Flow

```
User Action
    ↓
React Component (Feature)
    ↓
Zustand Store (local state) ←→ TanStack Query (server state)
    ↓                              ↓
UI Update                    Supabase API (PostgreSQL)
                                   ↓
                         Domain Invariants Validation
```

---

## 📊 Analytics & Insights

### User Analytics
```typescript
interface UserInsights {
  favoriteCategories: string[];    // Most preferred themes
  decisionPatterns: {
    averageTime: number;           // Seconds per decision
    confidenceTrend: number[];     // Confidence over time
    consistencyScore: number;      // 0-1, how predictable preferences are
  };
  namePreferences: {
    syllablePreference: number;    // Average preferred length
    categorySuccess: Map<string, number>; // Win rates by category
  };
}
```

### System Analytics
```typescript
interface SystemInsights {
  nameSurvivalRates: Map<string, number>;  // Names that consistently win
  categoryPerformance: Map<string, number>; // Which themes dominate
  tournamentEfficiency: {
    averageDuration: number;       // Minutes to complete
    averageVotes: number;          // Votes per tournament
    winnerConfidence: number;      // How decisive winners are
  };
}
```

---

## 🔌 API Design

### Core Service Interfaces
```typescript
interface NameService {
  createName(name: CreateNameRequest): Promise<Name>;
  getNamesByStatus(status: NameStatus): Promise<Name[]>;
  updateNameStatus(id: string, status: NameStatus, reason: string): Promise<Name>;
  getNameProvenance(id: string): Promise<ProvenanceEntry[]>;
}

interface TournamentService {
  createTournament(request: CreateTournamentRequest): Promise<Tournament>;
  castVote(tournamentId: string, vote: VoteRequest): Promise<Tournament>;
  getTournamentResults(id: string): Promise<TournamentResults>;
  validateTournamentIntegrity(id: string): Promise<boolean>;
}

interface AnalyticsService {
  getUserInsights(userId: string): Promise<UserInsights>;
  getSystemInsights(): Promise<SystemInsights>;
  getNameSurvivalStats(nameId: string): Promise<SurvivalStats>;
}
```

---

## 🧪 Testing Strategy

### Invariant Tests
```typescript
describe('Tournament Invariants', () => {
  test('every tournament produces exactly one winner', async () => {
    const tournaments = await getCompletedTournaments();
    tournaments.forEach(tournament => {
      expect(tournament.winnerId).toBeDefined();
      expect(tournament.participantIds).toContain(tournament.winnerId);
    });
  });

  test('vote totals always match expected ballot count', async () => {
    const tournaments = await getAllTournaments();
    tournaments.forEach(tournament => {
      const expectedVotes = calculateExpectedVotes(tournament.participantIds.length);
      expect(tournament.votes).toHaveLength(expectedVotes);
    });
  });
});

describe('Rating System Invariants', () => {
  test('ratings are deterministic and reproducible', () => {
    const initial = new Map([['a', 1500], ['b', 1600]]);
    const votes = [/* vote data */];

    const result1 = calculateEloRatings(initial, votes);
    const result2 = calculateEloRatings(initial, votes);

    expect(result1).toEqual(result2);
  });
});
```

---

## 🚀 Migration Strategy

### Database Schema Evolution
```sql
-- Add lifecycle status to names
ALTER TABLE cat_name_options
ADD COLUMN status name_status_enum DEFAULT 'candidate',
ADD COLUMN provenance jsonb DEFAULT '[]'::jsonb;

-- Add tournament constraints
ALTER TABLE tournaments
ADD COLUMN constraints jsonb,
ADD COLUMN expert_mode boolean DEFAULT false;

-- Add vote context
ALTER TABLE votes
ADD COLUMN context jsonb;
```

### Application Migration
1. **Phase 1**: Add status field with backward compatibility
2. **Phase 2**: Implement provenance logging
3. **Phase 3**: Add constraint validation
4. **Phase 4**: Enable new lifecycle features

---

## 🛠️ Technical Recommendations

1. **Maintain Type Coverage**: Continue replacing `any` in legacy catch blocks
2. **Feature Isolation**: Keep feature modules self-contained
3. **Query Caching**: Leverage TanStack Query for server state caching
4. **Error Boundaries**: Wrap feature modules in error boundaries
5. **Invariant Enforcement**: Use TypeScript + runtime validation for business rules
6. **Provenance Tracking**: Maintain complete audit trails for name lifecycle changes