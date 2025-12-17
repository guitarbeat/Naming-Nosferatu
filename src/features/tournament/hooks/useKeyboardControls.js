import { useEffect } from "react";

/**
 * Keyboard bindings for tournament interactions.
 * Provides lightweight defaults to keep UI responsive without the legacy hook.
 */
export function useKeyboardControls(
  selectedOption,
  isProcessing,
  isTransitioning,
  isMuted,
  handleVoteWithAnimation,
  globalEventListenersRef,
  options = {},
) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isProcessing || isTransitioning) {
        return;
      }

      const { key } = event;

      if (key === "ArrowLeft") {
        options.onSelectLeft?.();
        return;
      }

      if (key === "ArrowRight") {
        options.onSelectRight?.();
        return;
      }

      if (key === "ArrowUp") {
        handleVoteWithAnimation?.("both");
        return;
      }

      if (key === "ArrowDown") {
        handleVoteWithAnimation?.("neither");
        return;
      }

      if (key === "Enter" && selectedOption) {
        handleVoteWithAnimation?.(selectedOption);
        return;
      }

      if (key === "Escape") {
        options.onClearSelection?.();
        return;
      }

      if (key === "h" || key === "H") {
        options.onToggleHelp?.();
        return;
      }

      if (key === "u" || key === "U") {
        options.onUndo?.();
        return;
      }

      if (key === "c" || key === "C") {
        options.onToggleCatPictures?.();
        return;
      }

      if ((key === "m" || key === "M") && typeof isMuted === "boolean") {
        options.onToggleMute?.();
      }
    };

    const listenersSet = globalEventListenersRef?.current;

    window.addEventListener("keydown", handleKeyDown);
    if (listenersSet) {
      listenersSet.add({
        event: "keydown",
        handler: handleKeyDown,
      });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (listenersSet?.delete) {
        listenersSet.forEach((listener) => {
          if (
            listener?.event === "keydown" &&
            listener?.handler === handleKeyDown
          ) {
            listenersSet.delete(listener);
          }
        });
      }
    };
  }, [
    globalEventListenersRef,
    handleVoteWithAnimation,
    isMuted,
    isProcessing,
    isTransitioning,
    options,
    selectedOption,
  ]);
}
