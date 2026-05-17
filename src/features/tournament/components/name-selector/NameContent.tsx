import type { NameItem } from "@/shared/types";

export const NameContent = ({
        nameItem,
        variant = "grid",
}: {
        nameItem: NameItem;
        variant?: "grid" | "swipe";
}) => {
        const isGrid = variant === "grid";
        const nameClasses = isGrid
                ? "w-full break-words font-display text-2xl leading-[0.92] tracking-tight text-white sm:text-[2rem]"
                : "w-full break-words font-display text-4xl leading-[0.92] tracking-tight text-white lg:text-5xl";

        const pronunciationClasses = isGrid
                ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70"
                : "text-xs font-semibold uppercase tracking-[0.28em] text-white/65";

        const descriptionClasses = isGrid
                ? "mt-2 line-clamp-2 text-xs leading-relaxed text-white/72 sm:text-sm"
                : "mt-3 max-w-md line-clamp-3 text-sm leading-relaxed text-white/72 md:text-base";

        return (
                <>
                        <span className={nameClasses}>{nameItem.name}</span>
                        {nameItem.pronunciation && (
                                <span
                                        className={
                                                isGrid ? pronunciationClasses : `${pronunciationClasses} block mt-2`
                                        }
                                >
                                        [{nameItem.pronunciation}]
                                </span>
                        )}
                        {nameItem.description && (
                                <p className={descriptionClasses}>{nameItem.description}</p>
                        )}
                </>
        );
};
