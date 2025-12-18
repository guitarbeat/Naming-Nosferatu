/**
 * @module shared/components
 * @description Consolidated exports for all shared components.
 * Provides a single import point for all reusable components.
 */

// * Core UI Components
import { Button, IconButton, TournamentButton, ScrollToTopButton } from "./Button";
import Card from "./Card";
import Loading from "./Loading/Loading";
import CatImage from "./CatImage";
import Error from "./Error/Error";
import Toast from "./Toast/Toast";

// * Feature Components
import Bracket from "./Bracket/Bracket";

// * Direct named exports (not default exports)
export { NameGrid } from "./NameGrid/NameGrid";
export {
  NameManagementView,
  useNameManagementContextSafe,
} from "./NameManagementView/NameManagementView";

// * Analysis Mode Components
export { AnalysisDashboard } from "./AnalysisDashboard";
export { AnalysisBulkActions } from "./AnalysisPanel";

// * Utility Components


// * Named exports
export { Button, IconButton, TournamentButton, ScrollToTopButton, Card, CatImage, Loading, Error, Toast, Bracket };
