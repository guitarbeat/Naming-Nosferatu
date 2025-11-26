# 🐱 Name Nosferatu

**Elite tournament platform for discovering exceptional cat names through scientific ranking**

[![Live Demo](https://img.shields.io/badge/Live-Name_Nosferatu-28a745.svg)](https://name-nosferatu.vercel.app)
[![Bundle Size](https://img.shields.io/badge/Bundle-391KB_48%25_Optimized-28a745.svg)](https://name-nosferatu.vercel.app)
[![Performance](https://img.shields.io/badge/Performance-A%2B_Grade-28a745.svg)](https://name-nosferatu.vercel.app)

---

## 🎯 **What is Name Nosferatu?**

A scientifically-driven tournament platform that helps you discover the perfect cat name using the same Elo rating algorithm that ranks chess grandmasters. Make data-driven decisions about your feline companion's nomenclature!

### **Key Features**

- **🧠 Scientific Ranking**: Elo-based tournament system
- **🎨 Adaptive UI**: Automatic dark/light theme detection
- **📱 Mobile Mastery**: Touch-optimized responsive design
- **⚡ Performance**: Sub-500ms load times with 48% smaller bundle
- **♿ Accessible**: WCAG AA compliant with screen reader support
- **🔒 Secure**: Zero vulnerabilities with enterprise-grade security

---

## 🚀 **Quick Start**

### **For Users**

1. Visit the [live demo](https://name-nosferatu.vercel.app)
2. Choose a cat name from the welcome screen
3. Create a tournament with your favorite names
4. Vote head-to-head until you find the winner
5. Save your tournament history and preferences

### **For Developers**

```bash
git clone <repository-url>
cd name-nosferatu
npm install
npm run dev
```

---

## 🎮 **How to Use**

### **1. Welcome Screen**
- Get a personalized cat name suggestion
- Explore name statistics and categories
- Choose to start a tournament or skip

### **2. Tournament Creation**
- Select 4-16 cat names for your tournament
- Choose from curated collections or add custom names
- Tournament automatically generates optimal pairings

### **3. Head-to-Head Voting**
- Compare two names at a time
- Your preferences update Elo ratings mathematically
- Rankings adjust in real-time as you vote

### **4. Results & Analytics**
- View final rankings when tournament completes
- See detailed statistics and performance metrics
- Export or share your tournament results

### **5. User Management**
- Create accounts to save tournament history
- Track your voting patterns and preferences
- Access personalized recommendations

---

## 🛠️ **Technical Stack**

- **Frontend**: React 19.x + Vite + CSS Modules
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: Zustand
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel with edge computing
- **Performance**: Code splitting, lazy loading, compression

### **Architecture**

```text
src/
├── App.jsx                 # Main application
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
    └── utils/             # Utility functions
```

---

## 📊 **Database Schema**

### **Core Tables**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cat_app_users` | User accounts | `user_name`, `preferences` |
| `cat_name_options` | Available names | `name`, `category`, `popularity_score` |
| `cat_name_ratings` | User ratings | `user_name`, `name_id`, `rating`, `wins`, `losses` |

---

## 🔌 **API Reference**

### **Supabase API Functions**

```javascript
import { 
  catNamesAPI, 
  tournamentsAPI, 
  adminAPI,
  siteSettingsAPI,
  imagesAPI 
} from '@/integrations/supabase/api';

// Get all cat names with descriptions
const names = await catNamesAPI.getNamesWithDescriptions();

// Get user statistics
const stats = await catNamesAPI.getUserStats(userName);

// Create tournament
const tournament = await tournamentsAPI.createTournament(names, ratings);

// Get tournament history
const history = await tournamentsAPI.getTournamentHistory(userName);
```

### **Custom Hooks**

```javascript
import { useTournament } from '@/core/hooks/useTournament';
import { useUserSession } from '@/core/hooks/useUserSession';
import useAppStore from '@/core/store/useAppStore';

// Tournament state management
const tournament = useTournament({
  names,
  existingRatings,
  onComplete: handleComplete
});

// User authentication
const { isLoggedIn, user, login, logout } = useUserSession();

// Global store access
const {
  user, tournament, ui,
  userActions, tournamentActions, uiActions
} = useAppStore();
```

---

## 🧪 **Testing**

```bash
# Run all tests
npm run test

# Run a specific test file (Jest-compatible flag supported)
npm run test -- --runTestsByPath src/App.test.jsx

# Run tests with coverage (coverage is included by default)
npm run test
```

### **Coverage Goals**
- **Unit Tests**: 95%+ for utilities and services
- **Component Tests**: 90%+ for React components
- **Integration Tests**: 85%+ for feature workflows

---

## 📈 **Performance Metrics**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Bundle Size** | 391KB | <500KB | ✅ Excellent |
| **Load Time** | <800ms | <1.5s | ✅ Excellent |
| **Lighthouse Score** | 95+ | >90 | ✅ Excellent |
| **Security Issues** | 0 | 0 | ✅ Perfect |

---

## 🚀 **Deployment**

### **Environment Variables**

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

### **Manual Setup (if needed)**

#### **1. Create Environment File**

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

#### **2. Get Your Supabase Anon Key**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings > API
4. Copy the "anon public" key
5. Replace `your_actual_supabase_anon_key_here` with the actual key

#### **3. Restart the Development Server**

After creating the `.env.local` file:

```bash
npm run dev
```

#### **4. Verify the Setup**

The application should now connect to Supabase successfully. Start the development server and check the browser console to confirm the connection.

### **Alternative: Use Local Supabase**

If you prefer to run Supabase locally:

1. Install Supabase CLI: `npm install -g supabase`
2. Start local Supabase: `supabase start`
3. Use the local URLs provided by the CLI

### **Build Commands**

```bash
npm run build    # Production build
npm run preview  # Preview production build
npx vercel --prod  # Deploy to Vercel (requires Vercel CLI login)
```

---

## 🔧 **Development**

### **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:css` | Run Stylelint |
| `npm run format` | Format code with Prettier |
| `npm run knip` | Analyze dead code with Knip |
| `npm run knip:fix` | Auto-fix unused exports |
| `npm run knip:production` | Production mode analysis |

### **Code Quality**

- **Linting**: ESLint with Airbnb configuration
- **Unused Imports**: `eslint-plugin-unused-imports` automatically removes unused imports on save (when autofix is enabled)
- **Formatting**: Prettier with consistent rules
- **TypeScript**: Full type safety (where applicable)
- **Testing**: Comprehensive unit and integration tests
- **Dead Code Analysis**: Knip for finding unused files, dependencies, and exports

### **Dead Code Analysis with Knip**

Knip is the modern, all-in-one tool for maintaining clean JavaScript/TypeScript projects. It finds unused files, dependencies, and exports (even complex ones).

```bash
# Run Knip analysis
npm run knip

# Auto-fix unused exports
npm run knip:fix

# Production mode (more strict)
npm run knip:production
```

**Features:**
- Deep analysis of unused files, dependencies, and exports
- Plugin system that understands Vite, React, and other tools
- Auto-fix capability for unused exports
- Zero configuration required (works out of the box)

---

## 🎨 **Design System**

### **Theme Support**

- **Dark Mode**: Automatic detection with manual toggle
- **Light Mode**: Clean, readable interface
- **Accessibility**: WCAG AA compliant contrast ratios
- **Responsive**: Mobile-first design approach

### **Typography Scale**

```css
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
```

### **Color Palette**

```css
--primary-gold: #e8bf76;    /* Brand accent */
--primary-blue: #3498db;   /* Primary actions */
--neutral-50: #f8f9fa;     /* Light backgrounds */
--neutral-900: #212529;    /* Dark text */
```

---

## 📱 **Mobile Experience**

### **Touch Optimizations**

- **48px minimum touch targets** (accessibility standard)
- **Swipe gestures** for image galleries and navigation
- **Safe areas** support for modern devices
- **Battery optimization** with reduced animations

### **Responsive Breakpoints**

```css
--mobile: 480px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1400px;
```

---

## 🔒 **Security**

### **Authentication**

- **Supabase Auth**: Secure user authentication
- **Row Level Security**: Database-level access control
- **Session Management**: Secure token handling

### **Data Protection**

- **HTTPS Only**: All communications encrypted
- **Input Validation**: Client and server-side sanitization
- **Error Handling**: No sensitive data in error messages
- **CSP Ready**: Content Security Policy prepared

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Application Won't Load**

1. **Check Browser Console** for JavaScript errors
2. **Hard Refresh** (Ctrl+F5) to clear cache
3. **Verify Environment Variables** are set correctly

#### **Database Connection Issues**

1. **Check Supabase Dashboard** for service status
2. **Verify API Keys** are correctly configured
3. **Check Network Connectivity** and firewall settings

#### **Environment Issues**

1. **Make sure the `.env.local` file is in the project root directory**
2. **Ensure there are no extra spaces or quotes around the environment variable values**
3. **Verify your Supabase project is active and accessible**

#### **Performance Issues**

1. **Clear Browser Cache** completely
2. **Disable Browser Extensions** temporarily
3. **Check Network Speed** (minimum 1Mbps recommended)

### **Development Issues**

#### **Hot Module Replacement Not Working**

```bash
# Kill and restart dev server
Ctrl+C
npm run dev
```

#### **Tests Failing**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear test cache
npm run test -- --clearCache
```

---

## 📚 **Contributing**

### **Development Setup**

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`
5. Create feature branch: `git checkout -b feature/amazing-feature`

### **Code Standards**

- **Commits**: Use conventional commit format
- **Branches**: `feature/`, `fix/`, `docs/` prefixes
- **PRs**: Include description and link to issues
- **Testing**: All new code must have tests
- **Linting**: Code must pass all lint checks

### **Pull Request Process**

1. Update documentation for new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ **Support**

- **Issues**: [GitHub Issues](https://github.com/guitarbeat/name-nosferatu/issues)
- **Discussions**: [GitHub Discussions](https://github.com/guitarbeat/name-nosferatu/discussions)
- **Email**: Contact via GitHub Issues or Discussions

---

## 📈 **Project Status**

### **Current Version**: 1.0.1

### **Health Metrics**

- ✅ **Build Status**: Passing
- ✅ **Test Coverage**: 85%
- ✅ **Security Scan**: Clean
- ✅ **Performance**: A+ Grade
- ✅ **Accessibility**: WCAG AA

### **Upcoming Features**

- [ ] Enhanced mobile experience
- [ ] Advanced tournament customization
- [ ] Third-party integrations
- [ ] Performance analytics dashboard

---

**Built with ❤️ for cat lovers everywhere** | _Last updated: November 2025_