# Feature Development Workflow

This guide outlines the standard workflow for developing features in **Naming Nosferatu**. It is designed to ensure maintainability, testability, and consistency across the codebase.

## 1. Core Principles

### 📏 Strict File Limits
To prevent "God Components" and unmaintainable technical debt, we enforce strict line limits:
-   **TSX/TS Files**: Max **400 lines**.
-   **CSS Modules**: Max **500 lines**.

**Why?** Large files are harder to read, harder to test, and prone to merge conflicts.
**Enforcement**: Use `pnpm run check:limits` to verify your changes before pushing.

### 📦 Colocation
Keep related code together. If a component, hook, or style is only used by one feature, it belongs in that feature's directory, not in `src/shared`.

### 🧩 Composition over Inheritance
Build complex UIs by composing smaller, focused components rather than creating massive configuration-driven components.

---

## 2. Directory Structure

New features should follow this structure:

```text
src/features/YourFeature/
├── components/                 # Sub-components specific to this feature
│   ├── SubComponent/
│   │   ├── SubComponent.tsx
│   │   ├── SubComponent.module.css
│   │   └── index.ts
│   └── SharedFeatureComponent.tsx
├── hooks/                      # Logic extracted from UI
│   ├── useFeatureLogic.ts
│   └── useFeatureData.ts
├── YourFeature.tsx            # Main container/entry component
├── YourFeature.module.css     # Layout styles
└── index.ts                   # Public API exports
```

---

## 3. State Management Patterns

We use **Zustand** for global state and **React Context/State** for local state.

### ✅ When to use `useState` / `useReducer`
-   Form input values.
-   UI state (is modal open? is dropdown expanded?).
-   State that does not need to persist across page navigation.

### ✅ When to use `useAppStore` (Zustand)
-   Data shared between distinct features (e.g., User Profile and Tournament).
-   Persisted preferences (e.g., Theme, "Don't show this again").
-   Complex business logic that needs to be tested in isolation.

**Pattern**: Avoid giant slices. Create small, focused slices in `src/core/store/slices/` and compose them in `useAppStore`.

---

## 4. Workflows

### 🔨 Creating a New Feature
1.  **Scaffold**: Create the directory structure in `src/features/`.
2.  **Plan**: Define your data requirements and create a `useFeatureLogic` hook first.
3.  **Build**: Create the UI components, keeping them "dumb" (presentational) where possible.
4.  **Integrate**: Connect the hook to the UI in the main `Feature.tsx` container.
5.  **Verify**: Run `pnpm run check:limits` to ensure you haven't bloated any files.

### ✂️ Splitting Large Files (Refactoring)
If a file approaches the 400-line limit:

1.  **Extract Hooks**: Move `useEffect`, `useState`, and handlers into a custom hook in `hooks/`.
    -   *Example*: `const { data, handlers } = useComplexLogic();`
2.  **Extract Sub-Components**: Identify distinct sections of the JSX (e.g., a modal, a list item, a toolbar) and move them to `components/`.
3.  **Extract Constants/Utils**: Move large configuration objects or helper functions to `utils.ts` or `constants.ts`.

### 🚨 CSS Management
-   **Modules Only**: All styles must use CSS Modules (`.module.css`).
-   **No Global leaking**: Never use global selectors (e.g., `body`, `h1`) inside a module.
-   **Decomposition**: If a CSS file hits 500 lines, split it by logical section (e.g., `FeatureLayout.module.css`, `FeatureTheme.module.css`) or extract reusable tokens.

---

## 5. Checklist Before Push
-   [ ] `pnpm run lint` passes (No biome or type errors).
-   [ ] `pnpm run check:limits` passes (No files > 400/500 lines).
-   [ ] Unused code removed (`npx knip`).
