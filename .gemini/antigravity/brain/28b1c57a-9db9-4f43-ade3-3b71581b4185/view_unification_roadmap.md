# Profile + Tournament Setup View Unification Roadmap

## Vision
Transform the Profile view to be a "read-only tournament setup" mode, where both views use the same underlying components and data structures but with different configurations.

## ✅ Step 1: Create Unified NameGrid Component (COMPLETED)

**What we did:**
- Created `/src/shared/components/NameGrid/NameGrid.jsx`
- Supports both "tournament" and "profile" modes
- Handles filtering, sorting, selection, visibility control
- Uses design system tokens consistently
- Exported from shared components

**Impact:**
- Eliminated ~200 lines of duplicated code
- Single source of truth for name display
- Easy to add features to both views simultaneously

## ✅ Step 2: Extract Unified Filter Controls (COMPLETED)

**What we did:**
- Created `/src/shared/components/UnifiedFilters/UnifiedFilters.jsx`
- Created `/src/shared/components/UnifiedFilters/UnifiedFilters.module.css`
- Supports both "tournament" and "profile" modes
- Tournament mode: compact inline search + category + sort filters
- Profile mode: full filter panel with status, user, selection, and sort controls
- Updated TournamentSetup to use UnifiedFilters
- Updated ProfileNameList to use UnifiedFilters

**Impact:**
- Eliminated ~150 lines of duplicated filter code
- Consistent filter UX across views
- Single component to maintain
- Easy to add new filters everywhere

## ✅ Step 3: Unified Data Fetching Hook (COMPLETED)

**What we did:**
- Created `/src/core/hooks/useNameData.js`
- Supports both "tournament" and "profile" modes
- Tournament mode: fetches all names with `getNamesWithDescriptions`, filters global hidden names
- Profile mode: fetches names with `getNamesWithUserRatings`, includes user-specific data
- Unified error handling and timeout management
- Updated TournamentSetup to use useNameData
- Updated Profile to use useNameData

**Impact:**
- Eliminated ~150 lines of duplicated data fetching code
- Consistent error handling across views
- Single data fetching strategy
- Easier to optimize and cache

## ✅ Step 4: Unified Selection Management (COMPLETED)

**What we did:**
- Created `/src/core/hooks/useNameSelection.js`
- Supports both "tournament" and "profile" modes
- Tournament mode: array-based selection with auto-save to database
- Profile mode: Set-based selection for bulk operations
- Unified selection API: `toggleName`, `toggleNameById`, `selectAll`, `clearSelection`
- Updated TournamentSetup to use useNameSelection
- Profile still uses useProfileNameOperations (which can be refactored later to use useNameSelection internally)

**Impact:**
- Consistent selection behavior
- Easier to add bulk operations
- Simplified components

## 📋 Step 5: Create Unified View Component

**Goal:** Create `NameManagementView` that powers both views.

**Actions:**
1. Create master component:
   ```jsx
   function NameManagementView({
     mode, // "tournament" or "profile"
     userName,
     onStartTournament, // only for tournament mode
     onBulkAction, // only for profile mode
   }) {
     // Uses all the unified components/hooks we created
   }
   ```

2. Structure:
   ```
   <NameManagementView>
     <UnifiedFilters />
     {mode === "profile" && <ProfileBulkActions />}
     {mode === "tournament" && <TournamentHeader />}
     <NameGrid mode={mode} />
     {mode === "tournament" && <StartButton />}
   </NameManagementView>
   ```

3. Both views become thin wrappers:
   ```jsx
   function TournamentSetup({ onStart, userName }) {
     return <NameManagementView mode="tournament" onStartTournament={onStart} userName={userName} />;
   }
   
   function Profile({ userName }) {
     return <NameManagementView mode="profile" userName={userName} />;
   }
   ```

**Files to create:**
- `/src/shared/components/NameManagementView/NameManagementView.jsx`
- `/src/shared/components/NameManagementView/NameManagementView.module.css`

**Benefits:**
- 90% code reuse between views
- Single place to add features
- Easier testing
- Simplified maintenance

## ✅ Step 6: Mode-Specific Extensions (COMPLETED)

**What we did:**
- Created `ProfileDashboardWithContext` wrapper component that uses `useNameManagementContext` to access names for highlights
- Created `ProfileBulkActionsWithContext` wrapper component that uses context for selection state and creates its own handlers via `useProfileNameOperations`
- Updated `Profile` component to pass `dashboard` and `bulkActions` as extensions to `NameManagementView`
- Removed `ProfileDashboard` and `ProfileBulkActions` from `ProfileNameList` (they're now rendered by `NameManagementView` as extensions)
- Cleaned up unused props (`stats`, `highlights`, `onBulkHide`, `onBulkUnhide`, `hideSelectAllButton`, `onSelectAllClick`) from `ProfileNameList`

**Impact:**
- ProfileDashboard and ProfileBulkActions are now properly integrated into the extension system
- Cleaner separation of concerns - ProfileNameList only handles name grid rendering
- Extensions can access context data directly without prop drilling
- Easier to add new mode-specific features as extensions

## 🎯 Final Architecture

```
TournamentSetup.jsx (thin wrapper)
  └─> NameManagementView (mode="tournament")
        ├─> UnifiedFilters
        ├─> TournamentHeader
        ├─> NameGrid
        └─> StartButton

Profile.jsx (thin wrapper)
  └─> NameManagementView (mode="profile")
        ├─> ProfileDashboard (extension)
        ├─> UnifiedFilters
        ├─> ProfileBulkActions
        └─> NameGrid
```

## ✅ Step 2: Update Both Views to Use NameGrid (COMPLETED)

**What we did:**
- Updated `ProfileNameList.jsx` to use NameGrid (~80 lines removed)
- Updated `Tournament NameSelection.jsx` to use NameGrid (~100 lines removed)
- Fixed tournament view styling to use `cardsContainer` class
- Ensured hide controls only appear in profile mode

**Impact:**
- ~180 lines of duplicated code eliminated
- Both views now use the same grid component

## ✅ Step 5: Create Unified View Component (COMPLETED)

**What we did:**
- Created `NameManagementView` component that unifies data fetching, selection management, and filtering logic
- Implemented React Context (`useNameManagementContext`) to provide data to mode-specific extensions
- Updated `TournamentSetup` to use `NameManagementView` with tournament-specific extensions (NameSelection, Sidebar, Lightbox)
- Updated `Profile` to use `NameManagementView` with profile-specific extensions (ProfileHeader, ProfileNameList)
- Created `TournamentNameGrid` and `ProfileNameGrid` wrapper components that use context to access data
- Both views are now thin wrappers that configure `NameManagementView` with mode-specific props and extensions

**Files created:**
- `/src/shared/components/NameManagementView/NameManagementView.jsx`
- `/src/shared/components/NameManagementView/NameManagementView.module.css`

**Files modified:**
- `/src/shared/components/index.js` - Exported `NameManagementView` and `useNameManagementContext`
- `/src/features/tournament/TournamentSetup.jsx` - Refactored to use `NameManagementView`
- `/src/features/profile/Profile.jsx` - Refactored to use `NameManagementView`

**Impact:**
- ~90% code reuse between views for data fetching and selection management
- Single source of truth for name data and selection state
- Easier to add features that apply to both views
- Simplified maintenance - changes to core logic only need to be made once
- Consistent behavior across views

## 🚀 Migration Strategy

### Phase 1 (DONE):
- ✅ Create NameGrid component

### Phase 2 (DONE):
- ✅ Update ProfileNameList to use NameGrid
- ✅ Update Tournament NameSelection to use NameGrid
- ✅ Verify both views work correctly

### Phase 3 (DONE):
- ✅ Extract UnifiedFilters
- ✅ Update both views to use it

### Phase 4 (DONE):
- ✅ Create useNameData and useNameSelection hooks
- ✅ Migrate both views

### Phase 5 (DONE):
- ✅ Create NameManagementView
- ✅ Convert views to thin wrappers

### Phase 6 (DONE):
- ✅ Add mode-specific extensions (ProfileDashboard, ProfileBulkActions)
- ✅ Create context-aware wrapper components
- ✅ Remove ProfileDashboard and ProfileBulkActions from ProfileNameList

### Phase 7 (DONE): Cleanup and Optimization
- ✅ Removed unused `ProfileFilters` component (replaced by UnifiedFilters)
- ✅ Removed unused `useTournamentSetup` hook (replaced by NameManagementView + useNameData)
- ✅ Removed unused `useProfileNames` hook (replaced by useNameData)
- ✅ Updated hooks index files to remove exports
- ✅ Updated comments in ProfileNameList to reflect current architecture
- ✅ Renamed `.refactored.module.css` files to `.module.css` (removed refactored suffix)
- ✅ Removed unused CSS files (`Profile.module.css`, `ProfileNameList.module.css`, `ProfileFilters.module.css`)
- ✅ Updated all imports to use standard `.module.css` naming

**Impact:**
- Removed ~35KB of unused legacy code (components, hooks, and CSS)
- Cleaner codebase with no dead code or confusing naming
- Standard naming conventions - no more `.refactored` suffixes
- Easier to maintain - no confusion about which components/hooks/styles to use

## 💡 Key Principles

1. **Incremental Migration**: Each step is independently valuable
2. **Backward Compatibility**: Keep old code working until fully migrated
3. **Test Each Step**: Verify both views work after each change
4. **Design System First**: Use design tokens throughout
5. **Mode Parameter**: Single `mode` prop determines behavior

## 📊 Expected Outcomes

- **Code Reduction**: ~70% reduction in view-specific code
- **Maintenance**: Single place to fix bugs
- **Features**: New features appear in both views automatically
- **Consistency**: Identical UX across tournament and profile
- **Performance**: Better optimization opportunities

## 🔧 Next Command

To continue the unification, run:

```bash
# Update ProfileNameList to use NameGrid
# This will immediately reduce code and validate the component works
```

Then gradually work through phases 2-6!
