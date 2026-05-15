// Card styles utility
export const getCardStyles = (isSelected: boolean, isLocked: boolean) => {
        const baseClasses =
                "mobile-readable-card relative group overflow-hidden rounded-[1.35rem] border cursor-pointer transition-all duration-300";
        const selectedClasses = isSelected
                ? "z-10 border-primary/45 bg-gradient-to-br from-primary/14 to-white/[0.04] shadow-[0_20px_45px_rgba(39,135,153,0.2)] ring-1 ring-primary/25"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_16px_40px_rgba(6,12,24,0.18)]";
        const lockedClasses = isLocked
                ? "cursor-not-allowed opacity-55 saturate-50"
                : "";

        return `${baseClasses} ${selectedClasses} ${lockedClasses}`;
};

// Name overlay styles utility
export const getNameOverlayClasses = (variant: "grid" | "swipe") => {
        const baseClasses =
                "absolute inset-0 flex flex-col items-center justify-end pointer-events-none";
        const gridClasses =
                "p-4 sm:p-5 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent text-center";
        const swipeClasses =
                "z-10 p-6 sm:p-8 bg-gradient-to-t from-slate-950/96 via-slate-950/48 to-transparent text-center";

        return `${baseClasses} ${variant === "grid" ? gridClasses : swipeClasses}`;
};
