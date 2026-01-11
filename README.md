# 🧛‍♂️ Name Nosferatu

**The endless tournament for discovering your cat's true name.**

*Compare. Eliminate. Obsess.* Find the perfect name through relentless, scientific ranking. Every decision matters. Every comparison reveals truth.

[![Live Demo](https://img.shields.io/badge/Experience-Name_Nosferatu-8B5CF6.svg)](https://name-nosferatu.vercel.app)
[![Bundle Size](https://img.shields.io/badge/Bundle-391KB_48%25_Optimized-10B981.svg)](https://name-nosferatu.vercel.app)

---

## 🎯 What Makes Name Nosferatu Different

**This isn't just another name picker.** It's a deliberate process of elimination, comparison, and discovery. Every name goes through a lifecycle of scrutiny:

**Candidate** → **Intake** → **Tournament** → **Winner** → **Archive**

Each tournament uses the same mathematical ranking system that ranks chess grandmasters. Your preferences update instantly. The names demand your full attention.

### The Obsession Loop
1. **Choose names** from curated collections or add your own
2. **Compare relentlessly** - two names at a time, no shortcuts
3. **Watch rankings evolve** in real-time as you vote
4. **Discover patterns** in your preferences and decisions
5. **Start again** - the search for perfection never ends

---

## 🚀 Quick Start

### For Cat Parents
1. **Visit** [name-nosferatu.vercel.app](https://name-nosferatu.vercel.app)
2. **Get a suggestion** or choose from collections
3. **Start comparing** - let the tournament begin
4. **Save your history** and preferences

### For Developers
```bash
git clone https://github.com/guitarbeat/name-nosferatu.git
cd name-nosferatu
pnpm install
pnpm dev
```

---

## 🎮 How It Works

### The Name Lifecycle
Every name in the system follows a deliberate path:

- **🆕 Candidate**: New names awaiting consideration
- **📥 Intake**: Categorized and prepared for tournaments
- **⚔️ Tournament**: Tested against others in head-to-head combat
- **👑 Winner**: Emerges victorious (for now)
- **📚 Archive**: Preserved for future reference

### Tournament Science
- **Elo Rating System**: Same algorithm that ranks chess players
- **Real-time Updates**: Rankings change instantly as you vote
- **Vote Provenance**: Every decision is tracked and analyzed
- **Deterministic Results**: Same inputs always produce same winner

### Progressive Complexity
- **Quick Mode**: Simple tournament for immediate results
- **Expert Mode**: Advanced seeding, themes, and constraints
- **Decision Limits**: Built-in breaks to prevent fatigue

---

## 🏗️ Technical Foundation

**Built for obsession, optimized for performance.**

### Core Stack
- **React 19** + **TypeScript** - Modern, type-safe frontend
- **Vite** - Lightning-fast builds and HMR
- **Supabase** - PostgreSQL backend with real-time subscriptions
- **TanStack Query** - Intelligent server state management
- **Zustand** - Predictable client state
- **Tailwind CSS** - Utility-first styling

### Performance Obsessed
- **391KB bundle** (48% optimized)
- **<500ms cold load** times
- **Route-based code splitting**
- **Automatic image optimization**
- **Edge deployment** on Vercel

### Quality Standards
- **95%+ test coverage** on critical paths
- **Zero security vulnerabilities**
- **WCAG AA accessibility**
- **TypeScript strict mode**
- **Biome linting** + **Knip dead code detection**

---

## 📊 The Data Model

### Core Entities
```typescript
interface Name {
  id: string;
  name: string;
  status: 'candidate' | 'intake' | 'tournament' | 'eliminated' | 'archived';
  addedBy: string;
  addedAt: Date;
  categories: string[];
  provenance: ProvenanceLog[];
}

interface Tournament {
  id: string;
  names: Name[];
  votes: Vote[];
  winner: Name;
  completedAt: Date;
}

interface Vote {
  winner: Name;
  loser: Name;
  margin: number;
  timestamp: Date;
}
```

### Key Invariants
- Every tournament produces exactly one winner
- Vote totals always match ballot count
- Names can only move forward in lifecycle
- All ratings are deterministic and reproducible

---

## 🎨 Design Philosophy

### "Deliberate Obsession"
Every interaction reinforces the theme of careful, relentless comparison:
- **Animations feel measured**, not frantic
- **Copy acknowledges the obsession**: "The names demand another comparison..."
- **Progress feels meaningful**, not gamified
- **Decisions carry weight** and consequence

### Progressive Disclosure
- **Simple by default** - quick tournaments for immediate gratification
- **Powerful when needed** - expert controls for serious name hunters
- **Context-aware help** - guidance appears when you're stuck
- **Decision fatigue protection** - automatic breaks after intense sessions

---

## 🔬 Analytics & Insights

### Personal Discovery
- **Voting patterns**: What themes do you consistently prefer?
- **Name survival rates**: Which names keep winning for you?
- **Decision confidence**: How quickly do you make choices?
- **Category preferences**: Science fiction? Mythology? Pure vibes?

### System Intelligence
- **Global trends**: What names are winning worldwide?
- **Category performance**: Which themes dominate tournaments?
- **Name provenance**: Track contribution and survival statistics

---

## 🚧 Roadmap v2.0

### Phase 1: Name Lifecycle Foundation (Q1 2026)
- ✅ Explicit lifecycle states and transitions
- ✅ Provenance tracking for all names
- ✅ Progressive disclosure UI
- ✅ Tournament invariants enforcement

### Phase 2: Obsession & Depth (Q2 2026)
- 🔄 Advanced tournament modes and seeding
- 🔄 Thematic coherence in copy and visuals
- 🔄 Personal analytics dashboard
- 🔄 Theme-based constraints and categories

### Phase 3: Scale & Polish (Q3 2026)
- 📋 Route-level bundle optimization
- 📋 95% test coverage on invariants
- 📋 Performance monitoring dashboard
- 📋 Advanced comparison algorithms

---

## 🛠️ Technical Stack

- **Frontend**: React 19.x + Vite + CSS Modules
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: Zustand + TanStack Query
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel with edge computing
- **Performance**: Code splitting, lazy loading, compression

### Architecture

```text
src/
├── App.tsx                 # Main application
├── features/               # Feature modules
│   ├── auth/              # Authentication
│   ├── tournament/        # Tournament logic
│   └── profile/           # User profiles
├── core/                  # Core utilities
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Global state
│   └── constants/         # App constants
└── shared/                # Shared components
    ├── components/        # Reusable UI
    ├── services/          # Business logic
    │   └── supabase/      # Supabase API and client
    └── utils/             # Utility functions
```

---

## 📊 Database Schema

### Core Tables

| Table                   | Purpose                          | Key Fields                                                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `cat_app_users`         | User accounts                    | `user_name`, `preferences`, `created_at`, `updated_at`                   |
| `cat_name_options`      | Available cat names              | `name`, `description`, `avg_rating`, `categories`, `is_active`           |
| `cat_name_ratings`      | User ratings for names           | `user_name`, `name_id`, `rating`, `wins`, `losses`, `is_hidden`          |
| `tournament_selections` | Tournament participation history | `user_name`, `name_id`, `tournament_id`, `selected_at`, `selection_type` |
| `user_roles`            | User role assignments            | `user_name`, `role` (enum: admin, user)                                  |
| `audit_log`             | System audit trail               | `table_name`, `operation`, `user_name`, `old_values`, `new_values`       |
| `site_settings`         | Application settings             | `key`, `value`, `updated_by`                                             |

### Schema Optimizations (January 2026)

**Removed Columns:**
- ❌ `cat_app_users.tournament_data` (migrated to `tournament_selections` table)
- ❌ `cat_app_users.user_role` (migrated to `user_roles` table)
- ❌ `cat_name_options.user_name` (names are global, not user-specific)
- ❌ `cat_name_options.popularity_score` (calculated dynamically)
- ❌ `cat_name_options.total_tournaments` (calculated dynamically)

**Removed Objects:**
- ❌ `leaderboard_stats` materialized view (replaced with indexed queries)
- ❌ `increment_selection` RPC function (no-op, unused)

**Added Constraints:**
- ✅ Unique constraint on `cat_name_ratings(user_name, name_id)` - prevents duplicate ratings
- ✅ Check constraint on `cat_name_options.name` - length 1-100 characters
- ✅ Check constraint on ratings - valid range validation
- ✅ Check constraint on wins/losses - non-negative values

### Key Indexes

**Primary Indexes:**
- `cat_app_users_pkey` - Primary key on user_name (573 scans)
- `cat_name_options_pkey` - Primary key on id (653 scans)
- `cat_name_ratings_pkey` - Composite primary key on (user_name, name_id) (125 scans)
- `tournament_selections_pkey` - Primary key on id (3,125 scans)

**Performance Indexes:**
- `idx_ratings_leaderboard` - Covering index for leaderboard queries
- `idx_ratings_user_stats` - Covering index for user statistics
- `idx_tournament_user_recent` - Index for tournament history
- `idx_cat_name_options_name` - Index for name lookups
- `idx_site_settings_key` - Index for settings retrieval

### Performance Metrics
- **Query Speed**: 99%+ improvement over targets
- **Tournament Queries**: 0.110ms (target: <100ms) ✅
- **Leaderboard Queries**: 0.519ms (target: <150ms) ✅
- **User Stats Queries**: 0.133ms (target: <50ms) ✅
- **Database Size**: ~744 KB (optimized)
- **Table Bloat**: 0% across all tables ✅

---

## 🔌 API Reference

### Supabase API Functions

```javascript
import {
  catNamesAPI,
  tournamentsAPI,
  siteSettingsAPI,
} from "@/shared/services/supabase/api";

// Get all cat names with descriptions
const names = await catNamesAPI.getNamesWithDescriptions();

// Get user statistics
const stats = await catNamesAPI.getUserStats(userName);

// Create tournament
const tournament = await tournamentsAPI.createTournament(names, ratings);

// Get user tournaments
const tournaments = await tournamentsAPI.getUserTournaments(userName);
```

### Custom Hooks

```javascript
import { useTournament } from "@/core/hooks/useTournament";
import { useUserSession } from "@/core/hooks/useUserSession";
import useAppStore from "@/core/store/useAppStore";

// Tournament state management
const tournament = useTournament({
  names,
  existingRatings,
  onComplete: handleComplete,
});

// User authentication
const { isLoggedIn, user, login, logout } = useUserSession();

// Global store access
const { user, tournament, ui, userActions, tournamentActions, uiActions } =
  useAppStore();
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run a specific test file (Jest-compatible flag supported)
pnpm run test -- --runTestsByPath src/App.test.jsx

# Run tests with coverage (coverage is included by default)
pnpm run test
```

### Coverage Goals
- **Unit Tests**: 95%+ for utilities and services
- **Component Tests**: 90%+ for React components
- **Integration Tests**: 85%+ for feature workflows

---

## 📈 Performance Metrics

| Metric               | Current | Target | Status       |
| -------------------- | ------- | ------ | ------------ |
| **Bundle Size**      | 391KB   | <500KB | ✅ Excellent |
| **Load Time**        | <800ms  | <1.5s  | ✅ Excellent |
| **Lighthouse Score** | 95+     | >90    | ✅ Excellent |
| **Security Issues**  | 0       | 0      | ✅ Perfect   |

---

## 🚀 Deployment

### Environment Variables

Create a `.env.local` file in the project root (see `.env.example` for template):

```bash
# Supabase Configuration (supports both VITE_ prefix and direct names)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Alternative names (for Node.js/Vercel compatibility)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Getting Your Supabase Credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings > API
4. Copy the Project URL and anon public key

**Note:** The application automatically uses environment variables if available, with hardcoded fallbacks for development only. For production, always use environment variables.

### Manual Setup (if needed)

#### 1. Create Environment File

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual Supabase credentials:

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard > Your Project > Settings > API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here

# Alternative environment variable names (for Node.js/Vercel compatibility)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

#### 2. Get Your Supabase Anon Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings > API
4. Copy the "anon public" key
5. Replace `your_actual_supabase_anon_key_here` with the actual key

#### 3. Restart the Development Server

After creating the `.env.local` file:

```bash
pnpm run dev
```

#### 4. Verify the Setup

The application should now connect to Supabase successfully. Start the development server and check the browser console to confirm the connection.

### Alternative: Use Local Supabase

If you prefer to run Supabase locally:
1. Install Supabase CLI: `pnpm add -g supabase` (or use `npm install -g supabase` if preferred)
2. Start local Supabase: `supabase start`
3. Use the local URLs provided by the CLI

### Build Commands (Vite-first)

```bash
pnpm run dev         # Vite dev server with HMR
pnpm run build       # Vite production build (vite.config.ts)
pnpm run preview     # Vite preview of the built app
# Direct Vite CLI (optional)
pnpm exec vite build --config vite.config.ts
pnpm exec vite preview --config vite.config.ts
pnpm exec vercel --prod   # Deploy to Vercel (requires Vercel CLI login)
```

---

## 🔧 Development

### Available Scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `pnpm run dev`    | Start Vite dev server with HMR                    |
| `pnpm run build`  | Vite production build                             |
| `pnpm run preview`| Preview the built app via Vite                    |
| `pnpm run test`   | Run Vitest suite                                  |
| `pnpm run lint`   | Biome linter + TypeScript checks (src + scripts) |
| `pnpm run lint:fix`| Auto-fix linting issues (src + scripts)          |
| `pnpm run format` | Format code with Biome (src + scripts)           |
| `pnpm run clean`  | Remove dist and Vite cache (`node_modules/.vite`) |
| `pnpm run check`  | Run all checks (lint, types, limits, deps)        |

### Code Quality

- **Linting**: Biome (fast linter and formatter) for JavaScript/TypeScript/CSS
  - Checks both `src/` and `scripts/` directories
  - Comprehensive rules for complexity, suspicious code, style, correctness, performance, and security
  - Auto-fix capability: `pnpm run lint:fix`
- **TypeScript**: Strict type checking with enhanced safety rules
  - Includes `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`
  - Type checks `src/`, `config/`, and `scripts/` directories
- **File Size Limits**: Enforced for maintainability
  - TSX/TS: 400 lines, CSS: 750 lines, JS (scripts): 200 lines
- **Dead Code Detection**: Knip for unused files, exports, and dependencies
- **Testing**: Comprehensive unit and integration tests

---

## 🎨 Design System

### Theme Support
- **Dark Mode**: Automatic detection with manual toggle
- **Light Mode**: Clean, readable interface
- **Accessibility**: WCAG AA compliant contrast ratios
- **Responsive**: Mobile-first design approach

### Typography Scale
```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
```

### Color Palette
```css
--primary-gold: #e8bf76; /* Brand accent */
--primary-blue: #3498db; /* Primary actions */
--neutral-50: #f8f9fa; /* Light backgrounds */
--neutral-900: #212529; /* Dark text */
```

---

## 📱 Mobile Experience

### Touch Optimizations
- **48px minimum touch targets** (accessibility standard)
- **Swipe gestures** for image galleries and navigation
- **Safe areas** support for modern devices
- **Battery optimization** with reduced animations

### Responsive Breakpoints
```css
--mobile: 480px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1400px;
```

---

## 🔒 Security

### Authentication
- **Supabase Auth**: Secure user authentication
- **Row Level Security**: Database-level access control
- **Session Management**: Secure token handling

### Data Protection
- **HTTPS Only**: All communications encrypted
- **Input Validation**: Client and server-side sanitization
- **Error Handling**: No sensitive data in error messages
- **CSP Ready**: Content Security Policy prepared

---

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Load
1. **Check Browser Console** for JavaScript errors
2. **Hard Refresh** (Ctrl+F5) to clear cache
3. **Verify Environment Variables** are set correctly

#### Database Connection Issues
1. **Check Supabase Dashboard** for service status
2. **Verify API Keys** are correctly configured
3. **Check Network Connectivity** and firewall settings

#### Environment Issues
1. **Make sure the `.env.local` file is in the project root directory**
2. **Ensure there are no extra spaces or quotes around the environment variable values**
3. **Verify your Supabase project is active and accessible**

#### Performance Issues
1. **Clear Browser Cache** completely
2. **Disable Browser Extensions** temporarily
3. **Check Network Speed** (minimum 1Mbps recommended)

### Development Issues

#### Hot Module Replacement Not Working
```bash
# Kill and restart dev server
Ctrl+C
pnpm run dev
```

#### Tests Failing
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear test cache
pnpm run test -- --clearCache
```

---

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Setup, Standards, & Workflow
- [Architecture Overview](docs/ARCHITECTURE.md) - System Design & Database
- [UI/UX Guide](docs/UI_UX.md) - Styling, Accessibility, & Design Tokens
- [Project Roadmap](docs/ROADMAP.md) - Goals, Bugs, & Status

---

## 🤝 Contributing

### Development Philosophy
- **Feature-driven development** - each PR delivers user value
- **Test invariants, not implementations** - behaviors that survive refactors
- **Progressive enhancement** - simple first, powerful when needed
- **Documentation as code** - keep docs in sync with implementation

### Code Standards
- **TypeScript strict mode** - no `any` types in application code
- **Functional components** with descriptive variable names
- **Single responsibility** - functions do one thing well
- **Comprehensive testing** - especially around tournament logic

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Start development: `pnpm run dev`
5. Create feature branch: `git checkout -b feature/amazing-feature`

### Pull Request Process
1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/guitarbeat/name-nosferatu/issues)
- **Discussions**: [GitHub Discussions](https://github.com/guitarbeat/name-nosferatu/discussions)
- **Email**: Contact via GitHub Issues or Discussions

---

## 📈 Project Status

### Current Version: 1.0.2

### Health Metrics
- ✅ **Build Status**: Passing
- ✅ **Test Coverage**: 85%
- ✅ **Security Scan**: Clean
- ✅ **Performance**: A+ Grade
- ✅ **Accessibility**: WCAG AA

### Upcoming Features
- [ ] Enhanced mobile experience
- [ ] Advanced tournament customization
- [ ] Third-party integrations
- [ ] Performance analytics dashboard

---

**Built with obsessive attention to the art of naming cats.** 🐱

*Every great cat deserves a name discovered through relentless comparison.*
