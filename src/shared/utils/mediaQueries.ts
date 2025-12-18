const isBrowser = () => typeof window !== "undefined";

const canUseMatchMedia = () =>
  isBrowser() && typeof window.matchMedia === "function";

export const getMediaQueryList = (query: string): MediaQueryList | null => {
  if (!canUseMatchMedia()) {
    return null;
  }

  try {
    return window.matchMedia(query);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Invalid media query:", query, error);
    }
    return null;
  }
};

export const attachMediaQueryListener = (mediaQueryList: MediaQueryList | null, listener: (event: MediaQueryListEvent) => void): () => void => {
  if (!mediaQueryList || typeof listener !== "function") {
    return () => {};
  }

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);
    return () => mediaQueryList.removeListener(listener);
  }

  return () => {};
};
