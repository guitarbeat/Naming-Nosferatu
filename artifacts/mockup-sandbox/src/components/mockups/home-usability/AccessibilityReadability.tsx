import { useState } from 'react';
import { Check, User, LogOut, Send, Trophy, Lightbulb, BarChart3 } from 'lucide-react';
import './_group.css';

const MOCK_NAMES = [
  "Mordecai", "Vladislav", "Nosferatu", "Count Clawula",
  "Draculea", "Batsworth", "Grimshaw", "Lilith",
  "Salem", "Baron Von Scratch", "Phantasm", "Nox",
];

// ─── Section heading that matches the real app's gradient-divider pattern ────
function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-1 mb-4">
      <div className="flex w-full items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, hsl(0 0% 0% / 0.15), transparent)' }} />
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/20 bg-black/5 text-black/50 shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, hsl(0 0% 0% / 0.15), transparent)' }} />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight text-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'hsl(0 0% 45%)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Name tile that matches real app card aesthetic ───────────────────────────
function NameTile({
  name,
  isSelected,
  onToggle,
  hintVisible,
}: {
  name: string;
  isSelected: boolean;
  onToggle: () => void;
  hintVisible: boolean;
}) {
  return (
    <label
      className={[
        'relative flex items-center gap-3 p-3 cursor-pointer',
        'rounded-xl border-2 overflow-hidden',
        'transition-all duration-300',
        isSelected
          ? 'border-black bg-gradient-to-br from-black/10 to-black/5 shadow-xl ring-4 ring-black/20 scale-[1.02] z-10'
          : 'border-black/20 bg-gradient-to-br from-black/5 to-black/0 hover:border-black/40 hover:shadow-lg',
        'focus-within:ring-4 focus-within:ring-[hsl(190_100%_50%)] focus-within:ring-offset-2',
      ].join(' ')}
    >
      {/* Visually hidden checkbox (keyboard + screen-reader accessible) */}
      <input
        type="checkbox"
        className="sr-only"
        checked={isSelected}
        onChange={onToggle}
        aria-label={`Select ${name}`}
      />

      {/* Visible checkbox square — always shown, not just on hover */}
      <div
        className={[
          'w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200',
          isSelected ? 'border-black bg-black text-white' : 'border-black/30 bg-white',
        ].join(' ')}
        aria-hidden="true"
      >
        {isSelected && <Check size={13} strokeWidth={3} />}
      </div>

      <span
        className="font-semibold text-sm leading-tight"
        style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(0 0% 5%)' }}
      >
        {name}
      </span>

      {/* "tap to select" hint — only on first tile */}
      {hintVisible && !isSelected && (
        <span
          className="ml-auto text-xs font-medium"
          style={{ color: 'hsl(0 0% 55%)' }}
          aria-hidden="true"
        >
          tap to select
        </span>
      )}

      {/* Selected glow badge — matches real app SelectionBadge */}
      {isSelected && (
        <div className="absolute top-2 right-2 size-5 bg-black rounded-full flex items-center justify-center shadow-lg" aria-hidden="true">
          <Check size={11} className="text-white" strokeWidth={3} />
        </div>
      )}
    </label>
  );
}

// ─── Bottom floating nav — simplified version of real FloatingNavbar ─────────
function BottomNav({
  activeSection,
  selectedCount,
}: {
  activeSection: string;
  selectedCount: number;
}) {
  const items = [
    { id: 'pick', icon: selectedCount >= 2 ? Trophy : Check, label: selectedCount >= 2 ? `Start (${selectedCount})` : 'Pick Names', accent: selectedCount >= 2 },
    { id: 'analyze', icon: BarChart3, label: 'Analyze', accent: false },
    { id: 'suggest', icon: Lightbulb, label: 'Suggest', accent: false },
    { id: 'profile', icon: User, label: 'Profile', accent: false },
  ];

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      style={{ width: 'calc(100% - 2rem)', maxWidth: '480px' }}
    >
      <nav
        aria-label="Primary navigation"
        className="flex items-center justify-around gap-1 px-3 py-2 rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md shadow-xl"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {items.map(({ id, icon: Icon, label, accent }) => {
          const isCurrent = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px]',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-1',
                isCurrent
                  ? 'bg-black text-white'
                  : accent
                    ? 'bg-[hsl(190_100%_50%)] text-black font-bold'
                    : 'text-black/50 hover:text-black hover:bg-black/5',
              ].join(' ')}
              aria-current={isCurrent ? 'location' : undefined}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AccessibilityReadability() {
  const [selectedNames, setSelectedNames] = useState<string[]>(['Nosferatu', 'Salem']);
  const [suggestion, setSuggestion] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeSection] = useState('pick');
  const [submitted, setSubmitted] = useState(false);

  const toggleName = (name: string) => {
    setSelectedNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name],
    );
  };

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestion('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div
      className="min-h-screen pb-32 selection:bg-[hsl(190_100%_50%/0.3)] selection:text-black"
      style={{ background: 'hsl(0 0% 100%)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', lineHeight: '1.6' }}
    >
      {/* Skip-to-content — accessible, invisible until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-black focus:text-white focus:font-bold focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* ── Header ── */}
      <header className="border-b border-black/10 px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div>
          <h1 className="font-bold text-xl text-black" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em' }}>
            Naming Nosferatu
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(0 0% 45%)' }}>Cat name tournament</p>
        </div>

        {/* Profile chip */}
        {isSignedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/15 bg-black/5 text-sm font-medium text-black">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Demo User</span>
            </div>
            <button
              onClick={() => setIsSignedIn(false)}
              className="p-2 rounded-full border border-black/15 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] transition-colors"
              aria-label="Sign out of your account"
            >
              <LogOut className="h-4 w-4 text-black/50" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSignedIn(true)}
            className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-2"
          >
            Sign in
          </button>
        )}
      </header>

      {/* ── Main ── */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 pt-8 space-y-14" tabIndex={-1}>

        {/* ── Step 1: Pick names ── */}
        <section aria-labelledby="pick-heading">
          <SectionHeading icon={Trophy} title="Step 1: Choose your contenders" subtitle="Select at least 2 names to start a tournament bracket." />

          {/* Sign-in nudge (non-signed-in only) */}
          {!isSignedIn && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-black/10 bg-black/3 flex items-center gap-3 text-sm" style={{ color: 'hsl(0 0% 35%)' }}>
              <User className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>
                <button
                  onClick={() => setIsSignedIn(true)}
                  className="font-semibold text-black underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:rounded"
                >
                  Sign in
                </button>
                {' '}to save your scores and rankings.
              </span>
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            role="group"
            aria-label="Cat names — select to add to tournament"
          >
            {MOCK_NAMES.map((name, i) => (
              <NameTile
                key={name}
                name={name}
                isSelected={selectedNames.includes(name)}
                onToggle={() => toggleName(name)}
                hintVisible={i === 0}
              />
            ))}
          </div>

          {/* Selection count + CTA */}
          <div className="mt-6 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p
              className="text-sm font-semibold"
              style={{ color: selectedNames.length >= 2 ? 'hsl(0 0% 10%)' : 'hsl(0 0% 45%)' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedNames.length === 0
                ? 'No names selected yet'
                : selectedNames.length === 1
                  ? '1 name selected — pick one more'
                  : `${selectedNames.length} names selected`}
            </p>
            <button
              disabled={selectedNames.length < 2}
              aria-disabled={selectedNames.length < 2}
              className={[
                'w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-base transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-2',
                selectedNames.length >= 2
                  ? 'bg-[hsl(190_100%_50%)] text-black shadow-lg hover:brightness-105 hover:-translate-y-px active:translate-y-0'
                  : 'bg-black/10 text-black/30 cursor-not-allowed',
              ].join(' ')}
            >
              {selectedNames.length >= 2 ? `Start Tournament →` : 'Select 2+ names to start'}
            </button>
          </div>
        </section>

        {/* ── Step 2: Suggest a name ── */}
        <section aria-labelledby="suggest-heading" className="pt-2">
          <SectionHeading
            icon={Lightbulb}
            title="Suggest a name"
            subtitle="Got a great cat name? Share it with the community."
          />

          <form
            onSubmit={handleSuggest}
            className="rounded-xl border border-black/15 bg-black/3 p-5 space-y-4 shadow-sm"
          >
            <div className="space-y-1.5">
              {/* Explicit visible label — not just placeholder */}
              <label
                htmlFor="name-suggestion"
                className="block text-sm font-semibold text-black"
              >
                Cat name suggestion
              </label>
              <p id="suggestion-hint" className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>
                One name only, max 30 characters.
              </p>
              <input
                id="name-suggestion"
                type="text"
                required
                maxLength={30}
                aria-describedby="suggestion-hint"
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
                placeholder="e.g. Baron Fluffscroft"
                className={[
                  'w-full px-3 py-2.5 rounded-lg border text-sm',
                  'bg-white placeholder:text-black/25',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:border-transparent',
                  'transition-all duration-150',
                  'border-black/20',
                ].join(' ')}
                style={{ fontFamily: 'Space Mono, monospace' }}
              />
            </div>

            {submitted ? (
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'hsl(142 71% 40%)' }} role="alert" aria-live="polite">
                <Check className="h-4 w-4" />
                Suggestion submitted — thank you!
              </div>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-2"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit suggestion
              </button>
            )}
          </form>
        </section>

        {/* ── Profile section ── */}
        <section aria-labelledby="profile-heading" className="pt-2 pb-4">
          <SectionHeading
            icon={User}
            title="Your profile"
            subtitle="Track your rankings and tournament history."
          />
          <div className="rounded-xl border border-black/15 bg-black/3 p-5 shadow-sm">
            {isSignedIn ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-black">Signed in as Demo User</p>
                    <p className="text-xs" style={{ color: 'hsl(0 0% 50%)' }}>Your votes are being saved</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSignedIn(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/15 text-sm font-medium text-black hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-1"
                  aria-label="Sign out of your Demo User account"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-black">Sign in to save your scores</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(0 0% 50%)' }}>
                    Your tournament results and rankings will be saved across sessions.
                  </p>
                </div>
                <button
                  onClick={() => setIsSignedIn(true)}
                  className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(190_100%_50%)] focus:ring-offset-2"
                >
                  Sign in to save scores
                </button>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── Design note footer ── */}
      <div className="max-w-2xl mx-auto px-4 pb-4 mt-8">
        <p className="text-xs text-center" style={{ color: 'hsl(0 0% 60%)' }}>
          Design note: Accessibility first — WCAG AA contrast, semantic structure, visible focus rings, and no decorative motion — at the cost of some visual theatrics.
        </p>
      </div>

      {/* ── Bottom floating nav ── */}
      <BottomNav activeSection={activeSection} selectedCount={selectedNames.length} />
    </div>
  );
}
