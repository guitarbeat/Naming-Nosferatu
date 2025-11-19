/**
 * @module TournamentSetup/components
 * @description Barrel export for tournament setup components
 */

// Existing components
export { default as Lightbox } from "./Lightbox";
export { default as NameSuggestionSection } from "./NameSuggestionSection";
export { default as StartButton } from "./StartButton";

// NameSelection components
export { NameSelection, FilterControls, ResultsInfo } from "./NameSelection";

// SwipeMode components
export { SwipeableNameCards, SwipeCard, SwipeControls } from "./SwipeMode";

// TournamentHeader components
export {
  TournamentHeader,
  HeaderActions,
  NameCounter,
  AdminStats,
} from "./TournamentHeader";

// TournamentSidebar components
export {
  TournamentSidebar,
  TournamentInfo,
  PhotoGallery,
  PhotoThumbnail,
} from "./TournamentSidebar";
