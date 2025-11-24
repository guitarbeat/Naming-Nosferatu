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

## 📋 Step 2: Extract Unified Filter Controls

**Goal:** Create a single `UnifiedFilters` component that works for both views.

**Actions:**
1. Analyze common filters:
   - **Tournament**: category, search, sort (alphabetical/rating/recent)
   - **Profile**: status (active/hidden), user, selection, sort (rating/name/wins/losses)

2. Create `UnifiedFilters.jsx`:
   ```jsx
   <UnifiedFilters
     mode="tournament" // or "profile"
     onFilterChange={handleFilterChange}
     filters={currentFilters}
     showUserFilter={isAdmin}
     showSelectionFilter={hasSelectionStats}
     categories={categories}
   />
   ```

3. Merge logic from:
   - `ProfileFilters.jsx`
   - Tournament's inline filter controls

**Files to create:**
- `/src/shared/components/UnifiedFilters/UnifiedFilters.jsx`
- `/src/shared/components/UnifiedFilters/UnifiedFilters.module.css`

**Benefits:**
- Consistent filter UX across views
- Single component to maintain
- Easy to add new filters everywhere

## 📋 Step 3: Unified Data Fetching Hook

**Goal:** Create `useNameData` hook that works for both views.

**Actions:**
1. Extract common data needs:
   - Fetch available names from Supabase
   - Handle hidden/active status
   - Load user ratings
   - Support admin filters

2. Create `useNameData.js`:
   ```javascript
   export function useNameData({ userName, mode }) {
     // Returns: { names, isLoading, error, refetch }
     // Handles differences between tournament and profile data
   }
   ```

3. Merge logic from:
   - `useTournamentSetup.js`
   - `useProfileNames.js`

**Files to create:**
- `/src/core/hooks/useNameData.js`

**Benefits:**
- Single data fetching strategy
- Consistent error handling
- Easier caching/optimization

## 📋 Step 4: Unified Selection Management

**Goal:** Create `useNameSelection` hook for selection state.

**Actions:**
1. Create unified hook:
   ```javascript
   export function use NameSelection({ names, mode, userName }) {
     const [selectedNames, setSelectedNames] = useState(new Set());
     const toggleName = (nameId) => { /* ... */ };
     const selectAll = () => { /* ... */ };
     const clearSelection = () => { /* ... */ };
     
     return { selectedNames, toggleName, selectAll, clearSelection };
   }
   ```

2. Merge logic from:
   - Tournament's `useTournamentSetup`
   - Profile's `useProfileNameOperations`

**Files to create:**
- `/src/core/hooks/useNameSelection.js`

**Benefits:**
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

## 📋 Step 6: Mode-Specific Extensions

**Goal:** Add mode-specific features as optional plugins.

**Actions:**
1. Create extension system:
   ```jsx
   <NameManagementView
     mode="profile"
     extensions={{
       dashboard: <ProfileDashboard />,
       bulkActions: <ProfileBulkActions />,
       stats: <ProfileStats />,
     }}
   />
   ```

2. Allows each view to customize without breaking unified structure

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

## 🚀 Migration Strategy

### Phase 1 (DONE):
- ✅ Create NameGrid component

### Phase 2 (Next):
- Update ProfileNameList to use NameGrid
- Update Tournament NameSelection to use NameGrid
- Verify both views work correctly

### Phase 3:
- Extract UnifiedFilters
- Update both views to use it

### Phase 4:
- Create useNameData and useNameSelection hooks
- Migrate both views

### Phase 5:
- Create NameManagementView
- Convert views to thin wrappers

### Phase 6:
- Optimize and refine
- Add mode-specific extensions
- Remove old code

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
