export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getRankDisplay(rank: number): string {
  if (rank === 1) {
    return "🥇 1st";
  }
  if (rank === 2) {
    return "🥈 2nd";
  }
  if (rank === 3) {
    return "🥉 3rd";
  }
  if (rank <= 10) {
    return `🏅 ${rank}th`;
  }
  return `${rank}th`;
}

export function normalizeRoutePath(routeValue: string): string {
  if (!routeValue) {
    return "/";
  }
  return routeValue.startsWith("/") ? routeValue : `/${routeValue}`;
}

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

export const attachMediaQueryListener = (
  mediaQueryList: MediaQueryList | null,
  listener: (event: MediaQueryListEvent) => void,
): (() => void) => {
  if (!mediaQueryList || typeof listener !== "function") {
    return () => {
      // Intentional no-op: invalid parameters, no cleanup needed
    };
  }
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }
  return () => {
    // Intentional no-op: fallback for browsers without addEventListener
  };
};

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser environment required"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function compressImageFile(
  file: File,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
  }: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
  try {
    if (typeof document === "undefined") {
      return file;
    }
    const img = await loadImageFromFile(file);
    const { width, height } = img;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return file;
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        resolve,
        "image/webp",
        Math.min(Math.max(quality, 0.1), 0.95),
      ),
    );
    if (!blob) {
      return file;
    }

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}
