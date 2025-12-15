import { useEffect } from "react";

export function useThemeSync(theme) {
  useEffect(() => {
    const rootElement =
      typeof document !== "undefined" ? document.documentElement : null;
    const bodyElement = typeof document !== "undefined" ? document.body : null;

    if (!rootElement) {
      return undefined;
    }

    rootElement.dataset.theme = theme;
    if (bodyElement) {
      bodyElement.dataset.theme = theme;
    }

    return () => {
      rootElement.removeAttribute("data-theme");
      if (bodyElement) {
        bodyElement.removeAttribute("data-theme");
      }
    };
  }, [theme]);
}
