# Codebase Modernization Guide

This document outlines the modernization efforts applied to the codebase using modern React and Supabase patterns.

## Overview

The codebase has been modernized to use:
- **React Query (TanStack Query)** for data fetching and caching
- **Modern React patterns** (useTransition, useDeferredValue, proper memoization)
- **Type-safe Supabase queries** with TypeScript
- **Improved error handling** with React Query's built-in error management
- **Better performance** through intelligent caching and request deduplication

## Changes Made

### 1. React Query Integration ✅

**Added:**
- `@tanstack/react-query` and `@tanstack/react-query-devtools` packages
- Query client configuration in `src/shared/services/supabase/queryClient.ts`
- Query client provider in `src/index.jsx`

**Benefits:**
- Automatic request caching and deduplication
- Background refetching and stale-while-revalidate pattern
- Built-in loading and error states
- Optimistic updates for mutations
- DevTools for debugging queries

### 2. Modern Query Hooks ✅

**Created:**
- `useSupabaseQuery.ts` - Type-safe query hook wrapper
- `useSupabaseMutation.ts` - Type-safe mutation hook wrapper

**Usage Example:**
```typescript
// Old pattern (manual state management)
const [names, setNames] = useState([]);
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  fetchNames().then(setNames).finally(() => setIsLoading(false));
}, []);

// New pattern (React Query)
const { data: names, isLoading, error } = useSupabaseQuery({
  queryKey: ['names', userId],
  queryFn: async (client) => {
    const { data } = await client.from('cat_name_options').select('*');
    return data;
  },
});
```

### 3. Modern React Patterns

**Recommended patterns to adopt:**

#### useTransition for non-urgent updates
```typescript
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

const handleUpdate = () => {
  startTransition(() => {
    // Non-urgent state updates
    setFilter(filter);
  });
};
```

#### useDeferredValue for expensive renders
```typescript
import { useDeferredValue } from 'react';

const deferredFilter = useDeferredValue(filter);
// Use deferredFilter for expensive computations
```

#### Proper memoization
```typescript
// Memoize expensive computations
const sortedNames = useMemo(
  () => names.sort((a, b) => a.rating - b.rating),
  [names]
);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Migration Path

### Phase 1: New Features (Use React Query)
All new data fetching should use `useSupabaseQuery` and `useSupabaseMutation`.

### Phase 2: Gradual Migration
Migrate existing hooks one at a time:

1. **useNameData.js** → Convert to `useSupabaseQuery`
2. **useProfileStats.js** → Convert to `useSupabaseQuery`
3. **Tournament data fetching** → Convert to `useSupabaseQuery`
4. **Mutations** → Convert to `useSupabaseMutation`

### Phase 3: Remove Legacy Patterns
Once all hooks are migrated, remove:
- Manual `useState` + `useEffect` data fetching patterns
- Custom loading/error state management
- Manual cache invalidation logic

## Best Practices

### Query Keys
Use consistent, hierarchical query keys:
```typescript
['names']                    // All names
['names', userId]            // User-specific names
['names', userId, 'hidden']  // User's hidden names
['tournament', tournamentId] // Tournament data
```

### Stale Time
Configure appropriate stale times:
- **Real-time data**: 0ms (always refetch)
- **User data**: 30s (fresh for 30 seconds)
- **Static data**: 5min+ (rarely changes)

### Error Handling
React Query provides built-in error handling:
```typescript
const { data, error, isError } = useSupabaseQuery({...});

if (isError) {
  // Handle error
  return <ErrorComponent error={error} />;
}
```

### Optimistic Updates
For mutations, use optimistic updates:
```typescript
const mutation = useSupabaseMutation({
  mutationFn: async (variables, client) => {
    // Mutation logic
  },
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['names'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['names']);
    
    // Optimistically update
    queryClient.setQueryData(['names'], (old) => [...old, newData]);
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['names'], context.previous);
  },
});
```

## Performance Improvements

### Before (Manual Fetching)
- ❌ No request deduplication
- ❌ No caching
- ❌ Manual loading states
- ❌ Manual error handling
- ❌ Unnecessary re-fetches

### After (React Query)
- ✅ Automatic request deduplication
- ✅ Intelligent caching
- ✅ Built-in loading/error states
- ✅ Background refetching
- ✅ Stale-while-revalidate pattern

## Next Steps

1. **Migrate useNameData.js** to use React Query
2. **Migrate useProfileStats.js** to use React Query
3. **Add Realtime subscriptions** using Supabase Realtime with React Query
4. **Implement optimistic updates** for mutations
5. **Add query prefetching** for better UX

## Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase React Query Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Modern React Patterns](https://react.dev/reference/react)

