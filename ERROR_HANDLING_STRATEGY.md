# Comprehensive Error Handling Strategy

This document outlines the complete error handling strategy implemented for the Name Nosferatu web application, providing graceful degradation, user-friendly error messages, offline support, and comprehensive error logging.

## 🏗️ Architecture Overview

The error handling system is built on several key components:

1. **ErrorManager** - Central error processing and formatting service
2. **ErrorBoundary** - React component for catching JavaScript errors
3. **Error Hooks** - React hooks for component-level error handling
4. **Network Monitoring** - Online/offline status and connection quality
5. **Offline Support** - Operation queuing and retry mechanisms
6. **API Client** - Resilient HTTP client with built-in error handling
7. **Validation System** - Input validation with error reporting

## 🔧 Core Components

### 1. ErrorManager Service

**Location**: `src/shared/services/errorManager/index.ts`

Central service that handles all error processing:

```typescript
import { ErrorManager } from '@/shared/services/errorManager';

// Handle any error with context
const formattedError = ErrorManager.handleError(error, 'Tournament Creation', {
  tournamentName: 'My Tournament',
  userAction: 'create_tournament'
});

// Create resilient functions with retry logic
const resilientApiCall = ErrorManager.createResilientFunction(apiCall, {
  maxAttempts: 3,
  baseDelay: 1000
});
```

**Features**:
- Automatic error type detection (network, validation, auth, etc.)
- User-friendly message generation
- Error severity classification
- Retry logic with exponential backoff
- Circuit breaker pattern for failing services
- Comprehensive error logging

### 2. ErrorBoundary Component

**Location**: `src/shared/components/ErrorBoundary/`

React Error Boundary that catches JavaScript errors in component trees:

```tsx
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

<ErrorBoundary 
  context="Tournament Dashboard"
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Component error:', error);
  }}
>
  <TournamentComponent />
</ErrorBoundary>
```

**Features**:
- Graceful fallback UI
- Error details with unique error IDs
- Retry functionality
- Custom fallback components
- Error reporting integration

### 3. useErrorHandler Hook

**Location**: `src/shared/hooks/useErrorHandler.ts`

React hook for component-level error handling:

```tsx
import { useErrorHandler } from '@/shared/hooks/useErrorHandler';

const MyComponent = () => {
  const { error, isLoading, handleError, executeWithErrorHandling } = useErrorHandler({
    context: 'User Profile',
    showToast: true
  });

  const loadUserData = async () => {
    await executeWithErrorHandling(async () => {
      const userData = await api.getUser();
      setUser(userData);
    });
  };

  return (
    <div>
      {error && <div className="error">{error.userMessage}</div>}
      <button onClick={loadUserData} disabled={isLoading}>
        Load Data
      </button>
    </div>
  );
};
```

### 4. Network Status Monitoring

**Location**: `src/shared/hooks/useNetworkStatus.ts`

Monitors network connectivity and connection quality:

```tsx
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const { isOnline, isSlowConnection, connectionType } = useNetworkStatus();
```

### 5. Offline Support

**Location**: `src/shared/hooks/useOfflineSupport.ts`

Queues operations when offline and processes them when connection is restored:

```tsx
import { useOfflineSupport } from '@/shared/hooks/useOfflineSupport';

const { executeWithOfflineSupport, queuedOperations } = useOfflineSupport();

// This will queue the operation if offline
await executeWithOfflineSupport(
  () => api.updateTournament(data),
  'Update Tournament'
);
```

## 🎯 Error Types and Handling

### Network Errors
- **Detection**: Failed fetch requests, timeout errors, offline status
- **User Message**: "Connection issue. Check your connection and try again."
- **Handling**: Automatic retry with exponential backoff, offline queuing
- **Fallback**: Show cached data, queue operations for later

### Validation Errors
- **Detection**: Input validation failures, schema validation errors
- **User Message**: "Please check your input and try again."
- **Handling**: Highlight invalid fields, show specific validation messages
- **Fallback**: Prevent form submission, guide user to correct input

### Authentication Errors
- **Detection**: 401/403 responses, expired tokens
- **User Message**: "Please log in again."
- **Handling**: Redirect to login, clear invalid tokens
- **Fallback**: Show login form, preserve user's work

### API Errors
- **Detection**: HTTP error status codes, malformed responses
- **User Message**: Context-specific messages based on operation
- **Handling**: Retry for transient errors, show specific error details
- **Fallback**: Show cached data, allow manual retry

### Runtime Errors
- **Detection**: JavaScript errors, component crashes
- **User Message**: "Something went wrong. Please try again."
- **Handling**: Error boundary catches errors, logs details
- **Fallback**: Show error UI with retry option

## 🔄 Retry and Recovery Strategies

### Automatic Retry
```typescript
// Automatic retry with exponential backoff
const resilientFunction = ErrorManager.createResilientFunction(apiCall, {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
});
```

### Circuit Breaker
```typescript
// Prevents cascading failures
const circuitBreaker = new ErrorManager.CircuitBreaker(5, 60000);
await circuitBreaker.execute(() => apiCall());
```

### Manual Retry
```tsx
// User-initiated retry
{error?.isRetryable && (
  <button onClick={retryOperation}>
    Try Again
  </button>
)}
```

## 📱 User Experience Features

### 1. OfflineIndicator Component
Shows connection status to users:
- Red indicator when offline
- Green indicator when back online
- Yellow indicator for slow connections

### 2. ErrorToast Component
Non-intrusive error notifications:
- Auto-dismiss after 5 seconds
- Retry button for recoverable errors
- Severity-based styling (critical, high, medium, low)

### 3. Graceful Degradation
```typescript
import { gracefulDegradation } from '@/shared/utils/errorHandling';

// Fallback for unsupported features
const result = gracefulDegradation.withFallback(
  () => useAdvancedFeature(),
  () => useBasicFeature(),
  'Advanced Feature'
);

// Safe storage operations
gracefulDegradation.storage.set('userPrefs', preferences);
```

## 🛠️ Implementation Examples

### Tournament Creation with Error Handling
```tsx
const TournamentCreation = () => {
  const { executeWithErrorHandling } = useErrorHandler({
    context: 'Tournament Creation'
  });
  const { executeWithOfflineSupport } = useOfflineSupport();

  const createTournament = async (data) => {
    // Input validation
    const validation = validateInput(data.name, [
      validationRules.required(),
      validationRules.minLength(3)
    ]);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // API call with offline support and error handling
    return executeWithErrorHandling(async () => {
      return executeWithOfflineSupport(
        () => api.createTournament(data),
        'Create Tournament'
      );
    });
  };
};
```

### API Service with Error Handling
```typescript
class TournamentService {
  private apiClient = new ApiClient('/api/tournaments');

  async getTournaments(userId: string) {
    return await this.apiClient.get(`/user/${userId}`, 'Get User Tournaments');
  }

  async updateRating(nameId: string, rating: number) {
    // Validation
    const validation = validateInput(rating, [
      validationRules.required(),
      { 
        name: 'range', 
        validator: (v) => v >= 0 && v <= 3000,
        message: 'Rating must be between 0 and 3000'
      }
    ]);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.apiClient.put(`/ratings/${nameId}`, { rating });
  }
}
```

## 📊 Error Logging and Monitoring

### Development Environment
- Console logging with grouped error details
- Error context and stack traces
- Performance impact warnings

### Production Environment
- Integration with error tracking services (Sentry)
- Structured error logging
- User session context
- Error frequency monitoring

### Error Metadata
Each error includes:
- Unique error ID for tracking
- User context (logged in, admin, etc.)
- Operation context (what the user was doing)
- Environment information (browser, connection, etc.)
- Error fingerprint for deduplication

## 🔧 Configuration

### Environment Variables
```bash
# Error tracking service
VITE_SENTRY_DSN=your_sentry_dsn

# Error logging level
VITE_ERROR_LOG_LEVEL=error

# Retry configuration
VITE_MAX_RETRY_ATTEMPTS=3
VITE_RETRY_BASE_DELAY=1000
```

### Error Severity Levels
- **Critical**: Application-breaking errors, requires immediate attention
- **High**: Feature-breaking errors, affects user workflow
- **Medium**: Recoverable errors, may impact user experience
- **Low**: Minor issues, minimal user impact

## 🚀 Best Practices

### 1. Always Provide Context
```typescript
// Good
ErrorManager.handleError(error, 'Tournament Creation', { tournamentName });

// Bad
ErrorManager.handleError(error);
```

### 2. Use Appropriate Error Boundaries
```tsx
// Wrap major features
<ErrorBoundary context="Tournament Dashboard">
  <TournamentDashboard />
</ErrorBoundary>

// Don't wrap every small component
```

### 3. Validate Early and Often
```typescript
// Validate at component level
const validation = validateInput(userInput, rules);
if (!validation.isValid) {
  handleError(new Error(validation.errors.join(', ')));
  return;
}
```

### 4. Provide Meaningful User Messages
```typescript
// Good - specific and actionable
"Tournament name must be between 3 and 50 characters"

// Bad - generic and unhelpful
"Validation error"
```

### 5. Handle Offline Scenarios
```typescript
// Always consider offline users
if (!isOnline) {
  queueOperation(() => saveData(data), 'Save User Data');
  showMessage('Changes will be saved when connection is restored');
  return;
}
```

## 🧪 Testing Error Handling

### Unit Tests
```typescript
describe('ErrorManager', () => {
  it('should format network errors correctly', () => {
    const error = new Error('fetch failed');
    const formatted = ErrorManager.handleError(error, 'API Call');
    
    expect(formatted.type).toBe('network');
    expect(formatted.userMessage).toContain('connection');
  });
});
```

### Integration Tests
```typescript
describe('Tournament Creation', () => {
  it('should handle validation errors gracefully', async () => {
    const { getByText, getByRole } = render(<TournamentCreation />);
    
    fireEvent.click(getByRole('button', { name: 'Create' }));
    
    expect(getByText(/tournament name is required/i)).toBeInTheDocument();
  });
});
```

### Error Simulation
```typescript
// Simulate network errors in development
if (process.env.NODE_ENV === 'development') {
  window.simulateNetworkError = () => {
    throw new Error('Simulated network error');
  };
}
```

This comprehensive error handling strategy ensures that users have a smooth experience even when things go wrong, with clear feedback, automatic recovery where possible, and graceful degradation when features are unavailable.
