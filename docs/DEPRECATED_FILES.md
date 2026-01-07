# Deprecated Files

This document lists all files that are marked as deprecated, legacy, or unused in the codebase.

## Status Legend

- **⚠️ UNUSED**: File is not imported or referenced anywhere
- **🔄 LEGACY**: File contains legacy code but may still be referenced
- **📝 MARKED FOR REMOVAL**: File is explicitly marked for removal
- **✅ IN USE**: File is still being used (kept for reference)

## Deprecated Files

### CSS Modules

#### 1. `src/features/tournament/styles/TournamentLegacy.module.css`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Marked as "Legacy / Unused Styles" in file header
- **Description**: Contains legacy tournament styling that has been replaced by modern components
- **Size**: ~142 lines
- **Last Checked**: 2025-01-07
- **Action**: ✅ Removed - verified no imports found

#### 2. `src/features/tournament/styles/SetupLegacy.module.css`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Marked as "Legacy / Unused or Miscellaneous styles for backward compatibility or cleanup"
- **Description**: Contains legacy setup styling and miscellaneous styles
- **Size**: ~182 lines
- **Last Checked**: 2025-01-07
- **Action**: ✅ Removed - verified no imports found

### Documentation Files

#### 3. `docs/LEGACY_CODE_IMPROVEMENTS.md`
- **Status**: 📝 MARKED FOR REMOVAL
- **Reason**: Documentation of legacy code improvements (may be outdated)
- **Action**: Review and archive or remove if no longer relevant

#### 4. `docs/MASONRY_AND_LEGACY_IMPROVEMENTS.md`
- **Status**: 📝 MARKED FOR REMOVAL
- **Reason**: Documentation of masonry and legacy improvements (may be outdated)
- **Action**: Review and archive or remove if no longer relevant

## Legacy Code Sections (Not Full Files)

These are sections within files that contain legacy code but the files themselves are still in use:

### Design Tokens
- `src/shared/styles/design-tokens.css`
  - Legacy shadow variables (line ~196)
  - Legacy transition variables (line ~339)
  - Legacy easing aliases (line ~347)
  - Legacy animation duration aliases (line ~353)
  - **Status**: ✅ IN USE (kept for backward compatibility)

### Comments Referencing Legacy Code
- `src/features/tournament/TournamentSetupIdentity.module.css`
  - References to legacy CRT styling and animations.css
  - **Status**: ✅ IN USE (comments only, code is modern)

## Verification Process

To verify if a file is truly unused:

1. **Search for imports**:
   ```bash
   grep -r "TournamentLegacy\|SetupLegacy" src/
   ```

2. **Check for dynamic imports**:
   ```bash
   grep -r "Legacy" src/ --include="*.ts" --include="*.tsx"
   ```

3. **Check build output**: Ensure file is not included in bundle

4. **Test application**: Verify no runtime errors after removal

## Removal Checklist

Before removing a deprecated file:

- [ ] Verify file is not imported anywhere
- [ ] Check for any unique styles/functionality that should be preserved
- [ ] Test application after removal
- [ ] Update any documentation that references the file
- [ ] Commit removal with clear message

## Notes

- Legacy CSS files may contain styles that are still referenced via class names
- Some legacy code is kept for backward compatibility
- Always test thoroughly before removing files marked as deprecated

### Build Artifacts

#### 5. `build_success.log`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Build log file that should be in .gitignore
- **Description**: Contains build output from Vite
- **Action**: ✅ Removed from repository (already in .gitignore)

### Test Files

#### 6. `test-supabase-credentials.js`
- **Status**: ✅ MOVED (2026-01-06)
- **Reason**: Test file in root directory
- **Description**: Appears to be a test script for Supabase credentials
- **Action**: ✅ Moved to `test/` directory (belongs with other tests)

### Empty Directories

#### 7. `src/examples/`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Empty directory with no files
- **Action**: ✅ Removed (was empty)

### Duplicate/Alternative Files

#### 8. `src/App.modern.tsx`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Alternative/simplified version of App.tsx
- **Description**: Contains a simpler App component (22 lines vs 340 lines in App.tsx)
- **Verification**: ✅ Confirmed not imported in main.tsx (uses App.tsx instead)
- **Content**: Uses AppRouter, AppProviders, ErrorManager - appears to be a refactored version
- **Action**: ✅ Removed (App.tsx is the active version)

### Non-Module CSS Files (May Need Migration)

These CSS files use `.css` instead of `.module.css`. They may be intentional for global styles, but worth reviewing:

#### 9. `src/shared/components/AppNavbar/AppNavbar.css` & `AppNavbar.module.css`
- **Status**: ✅ BOTH IN USE (not deprecated)
- **Reason**: Both files serve different purposes
- **AppNavbar.css**: Contains main navbar styles (`.app-navbar-glass`, etc.) - 224 lines
- **AppNavbar.module.css**: Contains toggle component styles (`.toggleContainer`, etc.) - 71 lines
- **Verification**: ✅ Both imported in AppNavbar.tsx
- **Action**: Keep both - they're intentionally separate

#### 10. `src/shared/components/TournamentToolbar/TournamentToolbar.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file (intentional for global toolbar styles)
- **Note**: Large file (748 lines) - may need splitting

#### 11. `src/features/tournament/RankingAdjustment.css`
- **Status**: ✅ IN USE
- **Reason**: Standalone CSS file (not module)
- **Action**: Consider migrating to `.module.css` for consistency

#### 12. `src/shared/components/NameSuggestionModal/NameSuggestionModal.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

#### 13. `src/shared/components/Header/CollapsibleHeader.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

#### 14. `src/shared/components/CatBackground/CatBackground.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

#### 15. `src/shared/components/LiquidGlass/LiquidGlass.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

#### 16. `src/shared/components/PerformanceBadge/PerformanceBadge.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

#### 17. `src/shared/components/PerformanceBadge/TrendIndicator.css`
- **Status**: ✅ IN USE
- **Reason**: Non-module CSS file

### Potentially Outdated Documentation

These documentation files may contain outdated information or be duplicates:

#### 18. `docs/IMPROVEMENTS.md`
- **Status**: 📝 REVIEW NEEDED
- **Reason**: May be superseded by other improvement docs
- **Action**: Review and consolidate with other improvement docs

#### 19. `docs/STYLING_IMPROVEMENTS.md`
- **Status**: 📝 REVIEW NEEDED
- **Reason**: May be superseded by STYLING_UX_REVIEW.md
- **Action**: Review and consolidate

#### 20. `docs/COMPREHENSIVE_STYLING_IMPROVEMENTS.md`
- **Status**: 📝 REVIEW NEEDED
- **Reason**: May be duplicate of STYLING_UX_REVIEW.md
- **Action**: Review and consolidate

#### 21. `docs/SHARED_COMPONENTS_STYLING_IMPROVEMENTS.md`
- **Status**: 📝 REVIEW NEEDED
- **Reason**: May be duplicate of other styling docs
- **Action**: Review and consolidate

#### 22. `docs/COMPLETION_ASSESSMENT.md`
- **Status**: 📝 REVIEW NEEDED
- **Reason**: May be duplicate of STYLING_UX_REVIEW_PROGRESS.md
- **Action**: Review and consolidate

#### 23. `docs/MAINTAINABILITY_REVIEW.md`
- **Status**: ✅ IN USE
- **Reason**: Active maintainability documentation

## Summary by Category

### Definitely Unused (Safe to Remove)
1. `src/features/tournament/styles/TournamentLegacy.module.css` ✅ REMOVED
2. `src/features/tournament/styles/SetupLegacy.module.css` ✅ REMOVED
3. `build_success.log` ✅ REMOVED (should be in .gitignore)
4. `src/examples/` ✅ REMOVED (empty directory)
5. `src/App.modern.tsx` ✅ REMOVED (verified not imported)

### Potentially Unused (Verify First)
6. `test-supabase-credentials.js` ✅ MOVED to `test/` directory
7. `docs/LEGACY_CODE_IMPROVEMENTS.md` 📝
8. `docs/MASONRY_AND_LEGACY_IMPROVEMENTS.md` 📝

### Documentation to Review/Consolidate
9. `docs/IMPROVEMENTS.md` 📝
10. `docs/STYLING_IMPROVEMENTS.md` 📝
11. `docs/COMPREHENSIVE_STYLING_IMPROVEMENTS.md` 📝
12. `docs/SHARED_COMPONENTS_STYLING_IMPROVEMENTS.md` 📝
13. `docs/COMPLETION_ASSESSMENT.md` 📝

### In Use But Worth Noting
- Non-module CSS files (intentional for global styles, not deprecated)
- `AppNavbar.css` and `AppNavbar.module.css` (both in use, serve different purposes)

### HTML Files

#### 24. `stats.html`
- **Status**: ✅ REMOVED (2026-01-06)
- **Reason**: Generated by Vite bundle analyzer
- **Description**: Bundle analysis visualization (generated during build)
- **Verification**: ✅ Referenced in `vite.config.ts` and `package.json` clean script
- **Action**: ✅ Removed from repository (already in .gitignore)

#### 25. `api/submit-name.html`
- **Status**: ✅ IN USE
- **Reason**: Referenced in vercel.json rewrites
- **Description**: Standalone HTML form for submitting cat names
- **Action**: Keep - actively used

### Test/Documentation Files

#### 26. `test/clean-code.mdc`
- **Status**: ✅ IN USE
- **Reason**: Cursor rules file for code quality guidelines
- **Description**: Markdown with frontmatter for Cursor IDE rules
- **Note**: `.mdc` extension is intentional (Cursor rules format)

#### 27. `test/code-quality.mdc`
- **Status**: ✅ IN USE
- **Reason**: Cursor rules file for code quality guidelines
- **Description**: Markdown with frontmatter for Cursor IDE rules
- **Note**: `.mdc` extension is intentional (Cursor rules format)

#### 28. `test/create-prd.md`
- **Status**: ✅ IN USE
- **Reason**: Cursor rules file for PRD generation
- **Description**: Template/guide for generating Product Requirements Documents
- **Note**: Also exists in `.cursor/rules/test/` (may be duplicate)

#### 29. `test/generate-tasks.md`
- **Status**: ✅ IN USE
- **Reason**: Cursor rules file for task generation
- **Description**: Template/guide for generating task lists
- **Note**: Also exists in `.cursor/rules/test/` (may be duplicate)

#### 30. `.cursor/rules/test/create-prd.md`
- **Status**: ⚠️ POTENTIAL DUPLICATE
- **Reason**: Duplicate of `test/create-prd.md`
- **Action**: Verify if both are needed or if one should be removed

#### 31. `.cursor/rules/test/generate-tasks.md`
- **Status**: ⚠️ POTENTIAL DUPLICATE
- **Reason**: Duplicate of `test/generate-tasks.md`
- **Action**: Verify if both are needed or if one should be removed

### Documentation Consolidation Status

#### ✅ Completed (2025-01-07)

All documentation consolidation has been completed. See `docs/DOCUMENTATION_CONSOLIDATION_COMPLETE.md` for details.

**Consolidation Summary:**
- **Before:** 29 documentation files
- **After:** 16 active documentation files (including meta files)
- **Reduction:** 13 files (45% reduction)
- **Archived:** 10+ files moved to `docs/archive/`

**Consolidated Files:**
- **Styling:** 6 files → 2 files (`STYLING_GUIDE.md` + `STYLING_UX_REVIEW_PROGRESS.md`)
- **Legacy:** 2 files → 1 file (`LEGACY_MIGRATION.md`)
- **Schema:** 2 files → 1 file (`SCHEMA_VERIFICATION.md` with summary)
- **Usability:** 2 files → 1 file (`USABILITY_GUIDE.md`)
- **Bugs:** 2 files → 1 file (`BUGS.md`)
- **Improvements:** 1 file → merged into `MAINTAINABILITY_REVIEW.md`

#### Active Documentation Files (16)

**Core (4):**
- `README.md` - Documentation index
- `DEVELOPMENT.md` - Development guide
- `ARCHITECTURE.md` - System design
- `NAMING_CONVENTIONS.md` - Coding standards

**Development (2):**
- `FEATURE_WORKFLOW.md` - Feature development
- `WORKFLOW.md` - Iterative workflow

**Code Quality (7):**
- `MAINTAINABILITY_REVIEW.md` - Code quality analysis
- `STYLING_GUIDE.md` - Comprehensive styling guide
- `STYLING_UX_REVIEW_PROGRESS.md` - Styling progress tracker
- `LEGACY_MIGRATION.md` - Legacy code migration
- `USABILITY_GUIDE.md` - Usability guide
- `TYPESCRIPT_REVIEW.md` - TypeScript review
- `BUGS.md` - Bug tracking

**Planning & Reference (2):**
- `ROADMAP.md` - Project roadmap
- `SCHEMA_VERIFICATION.md` - Database schema verification

**Meta (1):**
- `DOCUMENTATION_CONSOLIDATION_COMPLETE.md` - Consolidation details

#### Archived Files

All redundant files have been moved to `docs/archive/`:
- `STYLING_UX_REVIEW.md` → Merged into `STYLING_GUIDE.md`
- `STYLING_IMPROVEMENTS.md` → Merged into `STYLING_GUIDE.md`
- `COMPREHENSIVE_STYLING_IMPROVEMENTS.md` → Merged into `STYLING_GUIDE.md`
- `SHARED_COMPONENTS_STYLING_IMPROVEMENTS.md` → Merged into `STYLING_GUIDE.md`
- `COMPLETION_ASSESSMENT.md` → Merged into `STYLING_GUIDE.md`
- `LEGACY_CODE_IMPROVEMENTS.md` → Merged into `LEGACY_MIGRATION.md`
- `MASONRY_AND_LEGACY_IMPROVEMENTS.md` → Merged into `LEGACY_MIGRATION.md`
- `SCHEMA_VERIFICATION_SUMMARY.md` → Merged into `SCHEMA_VERIFICATION.md`
- `EXISTING_USABILITY_FEATURES.md` → Merged into `USABILITY_GUIDE.md`
- `IMPROVEMENTS.md` → Merged into `MAINTAINABILITY_REVIEW.md`

See `docs/archive/README.md` for detailed archive information.

## Cleanup Summary (2026-01-06)

✅ **Completed Cleanup**: All "Definitely Unused" files have been removed:
- 2 legacy CSS module files removed
- 1 unused alternative App component removed
- 1 empty directory removed
- 2 build artifacts removed (already in .gitignore)
- 1 test script moved to appropriate location

✅ **Verification**: No remaining imports or references found for removed files

## Last Updated

2026-01-06 - Completed cleanup of definitely unused files
2025-01-07 - Comprehensive cross-check with docs directory, HTML files, test files, and documentation consolidation analysis
