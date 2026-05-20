import type { IdType } from "@/shared/types";
import { ZoomIn } from "lucide-react";

export const ZoomButton = ({
        nameId,
        onClick,
}: {
        nameId: IdType;
        onClick: (id: IdType) => void;
}) => (
        <button
                type="button"
                onClick={(e) => {
                        e.stopPropagation();
                        onClick(nameId);
                }}
                className="absolute top-3 right-3 p-2 sm:p-2.5 rounded-full bg-foreground/70 backdrop-blur-md text-background opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none transition-all duration-300 hover:bg-foreground/90 hover:scale-110 z-10"
                aria-label="View full size"
        >
                <ZoomIn size={14} />
        </button>
);
