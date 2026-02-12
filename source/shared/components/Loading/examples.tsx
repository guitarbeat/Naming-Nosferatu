/**
 * @file Loading Component Examples
 * @description Demonstrates the consolidated Loading component usage
 * 
 * Requirements Satisfied:
 * - 3.1: Merges LoadingScreen and LoadingSpinner functionality
 * - 3.2: Implements variant prop for 'inline' and 'fullscreen' modes
 * - 3.4: Supports size prop (sm, md, lg) and optional message prop
 */

import { Loading } from '@/layout/FeedbackComponents';

/**
 * Example 1: Basic Inline Loading (Default)
 * Replaces: LoadingSpinner
 */
export const InlineLoadingExample = () => {
  return (
    <div>
      <h3>Inline Loading Examples</h3>
      
      {/* Small inline spinner */}
      <Loading size="sm" />
      
      {/* Medium inline spinner (default) */}
      <Loading size="md" />
      
      {/* Large inline spinner */}
      <Loading size="lg" />
      
      {/* With message */}
      <Loading size="md" message="Loading data..." />
    </div>
  );
};

/**
 * Example 2: Fullscreen Loading Overlay
 * Replaces: LoadingScreen
 */
export const FullscreenLoadingExample = () => {
  return (
    <div>
      <h3>Fullscreen Loading Examples</h3>
      
      {/* Basic fullscreen overlay */}
      <Loading variant="fullscreen" />
      
      {/* With message */}
      <Loading variant="fullscreen" message="Initializing..." />
      
      {/* With size and message */}
      <Loading 
        variant="fullscreen" 
        size="lg" 
        message="Loading tournament data..." 
      />
    </div>
  );
};

/**
 * Example 3: Backward Compatibility
 * Shows that old API still works
 */
export const BackwardCompatibilityExample = () => {
  return (
    <div>
      <h3>Backward Compatibility Examples</h3>
      
      {/* Old API: using 'text' prop */}
      <Loading text="Loading..." />
      
      {/* Old API: using 'overlay' prop */}
      <Loading overlay={true} text="Loading..." />
      
      {/* Old API: using old size values */}
      <Loading size="small" />
      <Loading size="medium" />
      <Loading size="large" />
      
      {/* Old API: using 'spinner' variant */}
      <Loading variant="spinner" text="Loading..." />
    </div>
  );
};

/**
 * Example 4: Extended Variants
 * Shows additional variants available
 */
export const ExtendedVariantsExample = () => {
  return (
    <div>
      <h3>Extended Variants</h3>
      
      {/* Cat variant */}
      <Loading variant="cat" catVariant="paw" message="Loading..." />
      
      {/* Bongo cat variant */}
      <Loading variant="bongo" message="Loading..." />
      
      {/* Skeleton variant */}
      <Loading variant="skeleton" width={200} height={100} />
      
      {/* Card skeleton variant */}
      <Loading 
        variant="card-skeleton" 
        cardSkeletonVariant="name-card" 
        message="Loading card..." 
      />
    </div>
  );
};

/**
 * Example 5: Real-world Usage Scenarios
 */
export const RealWorldExamples = () => {
  return (
    <div>
      <h3>Real-world Usage</h3>
      
      {/* Loading button state */}
      <button disabled>
        <Loading size="sm" message="Saving..." />
      </button>
      
      {/* Loading page content */}
      <div className="min-h-screen">
        <Loading variant="fullscreen" message="Loading page..." />
      </div>
      
      {/* Loading data in a card */}
      <div className="card">
        <Loading size="md" message="Fetching data..." />
      </div>
      
      {/* Loading with suspense */}
      <Loading variant="suspense">
        <div>Content that loads lazily</div>
      </Loading>
    </div>
  );
};

/**
 * Migration Guide from Old Components
 * 
 * OLD: LoadingSpinner
 * <LoadingSpinner />
 * 
 * NEW: Loading with inline variant (default)
 * <Loading />
 * <Loading variant="inline" />
 * 
 * ---
 * 
 * OLD: LoadingScreen
 * <LoadingScreen message="Loading..." />
 * 
 * NEW: Loading with fullscreen variant
 * <Loading variant="fullscreen" message="Loading..." />
 * 
 * ---
 * 
 * Size Mapping:
 * - small → sm
 * - medium → md
 * - large → lg
 * 
 * Prop Mapping:
 * - text → message (text still works for backward compatibility)
 * - overlay → variant="fullscreen" (overlay still works for backward compatibility)
 */
