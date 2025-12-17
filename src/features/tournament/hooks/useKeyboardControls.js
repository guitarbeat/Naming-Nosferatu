import { useEffect } from "react";

export function useKeyboardControls(
  selectedOption,
  isProcessing,
  isTransitioning,
  isMuted,
  handleVoteWithAnimation,
  globalEventListeners,
  {
    onToggleHelp,
    onUndo,
    canUndoNow,
    onClearSelection,
    onSelectLeft,
    onSelectRight,
    onToggleCatPictures,
  },
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event) => {
      if (isProcessing || isTransitioning) return;

      switch (event.key) {
        case "ArrowLeft":
          onSelectLeft?.();
          break;
        case "ArrowRight":
          onSelectRight?.();
          break;
        case "ArrowUp":
        case "ArrowDown":
          if (!selectedOption) onToggleHelp?.();
          break;
        case " ":
        case "Enter":
          if (selectedOption) {
            handleVoteWithAnimation(selectedOption);
          }
          break;
        case "Escape":
          onClearSelection?.();
          if (canUndoNow) {
            onUndo?.();
          }
          break;
        case "m":
        case "M":
          if (!isMuted) {
            onToggleCatPictures?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const listenerSet =
      globalEventListeners && globalEventListeners.current instanceof Set
        ? globalEventListeners.current
        : null;
    listenerSet?.add({ event: "keydown", handler: handleKeyDown });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (!listenerSet) return;
      listenerSet.forEach((listener) => {
        if (
          listener.handler === handleKeyDown &&
          listener.event === "keydown"
        ) {
          listenerSet.delete(listener);
        }
      });
    };
  }, [
    canUndoNow,
    globalEventListeners,
    handleVoteWithAnimation,
    isMuted,
    isProcessing,
    isTransitioning,
    onClearSelection,
    onSelectLeft,
    onSelectRight,
    onToggleCatPictures,
    onToggleHelp,
    onUndo,
    selectedOption,
  ]);
}
