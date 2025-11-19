/**
 * @module useKeyboardControls
 * @description Custom hook for managing keyboard shortcuts in tournament component.
 * Handles arrow keys, space/enter for voting, escape for undo/clear, and help toggle.
 */

import { useEffect } from "react";

/**
 * Custom hook for keyboard controls
 * @param {string|null} selectedOption - Currently selected voting option
 * @param {boolean} isProcessing - Whether a vote is currently being processed
 * @param {boolean} isTransitioning - Whether the tournament is transitioning
 * @param {boolean} isMuted - Whether audio is muted (unused but kept for API compatibility)
 * @param {Function} handleVoteWithAnimation - Handler for voting with animation
 * @param {Object} globalEventListeners - Ref to track global event listeners for cleanup
 * @param {Object} options - Additional options
 * @param {Function} [options.onToggleHelp] - Callback to toggle keyboard help
 * @param {Function} [options.onUndo] - Callback to undo last vote
 * @param {boolean} [options.canUndoNow] - Whether undo is currently available
 * @param {Function} [options.onClearSelection] - Callback to clear selection
 */
export function useKeyboardControls(
  selectedOption,
  isProcessing,
  isTransitioning,
  isMuted,
  handleVoteWithAnimation,
  globalEventListeners,
  { onToggleHelp, onUndo, canUndoNow, onClearSelection } = {},
) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isProcessing || isTransitioning) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          // Handle left selection
          break;
        case "ArrowRight":
          e.preventDefault();
          // Handle right selection
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          if (selectedOption) {
            handleVoteWithAnimation(selectedOption);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVoteWithAnimation("both");
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVoteWithAnimation("neither");
          break;
        case "Tab":
          break;
        case "Escape":
          e.preventDefault();
          if (canUndoNow && typeof onUndo === "function") {
            onUndo();
          } else if (typeof onClearSelection === "function") {
            onClearSelection();
          }
          break;
        case "?":
          e.preventDefault();
          if (typeof onToggleHelp === "function") onToggleHelp();
          break;
        case "/":
          if (e.shiftKey) {
            e.preventDefault();
            if (typeof onToggleHelp === "function") onToggleHelp();
          }
          break;
        default:
          break;
      }
    };

    // * Track global event listener for proper cleanup
    const currentGlobalEventListeners = globalEventListeners.current;
    currentGlobalEventListeners.add({
      event: "keydown",
      handler: handleKeyPress,
    });
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      currentGlobalEventListeners.delete({
        event: "keydown",
        handler: handleKeyPress,
      });
    };
  }, [
    selectedOption,
    isProcessing,
    isTransitioning,
    isMuted,
    handleVoteWithAnimation,
    globalEventListeners,
    onToggleHelp,
    onUndo,
    canUndoNow,
    onClearSelection,
  ]);
}
