/**
 * @module shared/components
 * @description Consolidated exports for all shared components.
 * Provides a single import point for all reusable components.
 */

// * Core UI Components
import Button, { IconButton } from "./Button";
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
export { TournamentToolbar } from "./TournamentToolbar/TournamentToolbar";
export { default as FormField } from "./Form/FormField";
export {
  NameManagementView,
  useNameManagementContextSafe,
} from "./NameManagementView/NameManagementView";

// * Analysis Mode Components
export { AnalysisDashboard } from "./AnalysisDashboard";
export { AnalysisBulkActions } from "./AnalysisBulkActions";
export { AdminAnalytics } from "./AdminAnalytics";

// * Utility Components
export {
  CollapsibleHeader,
  CollapsibleContent,
  CollapsibleSection,
} from "./CollapsibleHeader";
export { BarChart } from "./BarChart";
export { default as ReadabilityChecker } from "./ReadabilityChecker";
export { default as LiquidGlass } from "./LiquidGlass";
export { useLiquidGlass } from "./LiquidGlass/useLiquidGlass";

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
