/**
 * @module shared/components
 * @description Consolidated exports for all shared components.
 * Provides a single import point for all reusable components.
 */

// * Core UI Components
import Button from "./Button/Button";
import IconButton from "./Button/IconButton";
import Card from "./Card/Card";
import Loading from "./Loading/Loading";
import Error from "./Error/Error";
import Toast from "./Toast/Toast";
import SkeletonLoader from "./SkeletonLoader/SkeletonLoader";

// * Form Components
import Input from "./Form/Input";
import Select from "./Form/Select";

// * Feature Components
import NameCard from "./NameCard/NameCard";
import Bracket from "./Bracket/Bracket";
import CatImage from "./CatImage/CatImage";
import StartTournamentButton from "./StartTournamentButton/StartTournamentButton";
import ScrollToTopButton from "./ScrollToTopButton";

// * Direct named exports (not default exports)
export { NameGrid } from "./NameGrid/NameGrid";
export { UnifiedFilters } from "./UnifiedFilters/UnifiedFilters";
export { default as FormField } from "./Form/FormField";
export {
  NameManagementView,
  useNameManagementContext,
} from "./NameManagementView/NameManagementView";

// * Analysis Mode Components
export { AnalysisToggle, AnalysisModeBanner } from "./AnalysisPanel";
export { AnalysisDashboard } from "./AnalysisDashboard";
export { AnalysisBulkActions } from "./AnalysisBulkActions";
export { AdminAnalytics } from "./AdminAnalytics";

// * Utility Components
export { CollapsibleSection } from "./CollapsibleSection";
export { CollapsibleHeader, CollapsibleContent } from "./CollapsibleHeader";
export { BarChart } from "./BarChart";

// * Named exports
export {
  Button,
  IconButton,
  Card,
  Loading,
  Error,
  Toast,
  SkeletonLoader,
  Input,
  Select,
  NameCard,
  Bracket,
  CatImage,
  StartTournamentButton,
  ScrollToTopButton,
};
