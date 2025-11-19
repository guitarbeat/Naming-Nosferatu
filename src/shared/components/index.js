/**
 * @module shared/components
 * @description Consolidated exports for all shared components.
 * Provides a single import point for all reusable components.
 */

// * Core UI Components
import Button from "./Button/Button";
import Card from "./Card/Card";
import Loading from "./Loading/Loading";
import Error from "./Error/Error";
import Toast from "./Toast/Toast";
import SkeletonLoader from "./SkeletonLoader/SkeletonLoader";

// * Form Components
import Form from "./Form/Form";
import Input from "./Form/Input";
import Select from "./Form/Select";

// * Layout Components
import { AppSidebar } from "./AppSidebar/AppSidebar";
import Breadcrumb from "./Breadcrumb/Breadcrumb";

// * Feature Components
import NameCard from "./NameCard/NameCard";
import StatsCard from "./StatsCard/StatsCard";
import Bracket from "./Bracket/Bracket";
import BongoCat from "./BongoCat/BongoCat";
import CatBackground from "./CatBackground/CatBackground";
import CatImage from "./CatImage/CatImage";
import FloatingGallery from "./FloatingGallery/FloatingGallery";
import PerformanceDashboard from "./PerformanceDashboard/PerformanceDashboard";
import StartTournamentButton from "./StartTournamentButton/StartTournamentButton";
import CalendarButton from "./CalendarButton/CalendarButton";
import ViewRouter from "./ViewRouter/ViewRouter";
import ScrollToTopButton from "./ScrollToTopButton";

// * UI System Components
import ErrorBoundary from "./Error/ErrorBoundary";
import ErrorBoundaryFallback from "./Error/ErrorBoundaryFallback";
export { SidebarProvider, useSidebar } from "./ui/sidebar";

// * Component prop types for external use
export { default as PropTypes } from "prop-types";

// * Build component object once
const components = {
  // Core UI
  Button,
  Card,
  Loading,
  Error,
  Toast,
  SkeletonLoader,

  // Form
  Form,
  Input,
  Select,

  // Layout
  AppSidebar,
  Breadcrumb,

  // Features
  NameCard,
  StatsCard,
  Bracket,
  BongoCat,
  CatBackground,
  CatImage,
  FloatingGallery,
  PerformanceDashboard,
  StartTournamentButton,
  CalendarButton,
  ViewRouter,
  ScrollToTopButton,

  // UI System
  ErrorBoundary,
  ErrorBoundaryFallback,
};

// * Named exports
export {
  Button,
  Card,
  Loading,
  Error,
  Toast,
  SkeletonLoader,
  Form,
  Input,
  Select,
  AppSidebar,
  Breadcrumb,
  NameCard,
  StatsCard,
  Bracket,
  BongoCat,
  CatBackground,
  CatImage,
  FloatingGallery,
  PerformanceDashboard,
  StartTournamentButton,
  CalendarButton,
  ViewRouter,
  ScrollToTopButton,
  ErrorBoundary,
  ErrorBoundaryFallback,
};

// * Default export reuses the same object
export default components;
