import React from 'react';
import { AppProviders } from './shared/providers/AppProviders';
import { AppRouter } from './shared/components/AppRouter';
import { OfflineIndicator } from './shared/components/OfflineIndicator';
import { ErrorManager } from './shared/services/errorManager';

// Initialize global error handling
ErrorManager.setupGlobalErrorHandling();

const App: React.FC = () => {
  return (
    <AppProviders>
      <div className="app">
        <OfflineIndicator />
        <AppRouter />
      </div>
    </AppProviders>
  );
};

export default App;
