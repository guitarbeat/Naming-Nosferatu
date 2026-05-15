import { motion } from "framer-motion";
import type { NameItem } from "@/shared/types";
import { isNameHidden, isNameLocked } from "@/shared/lib/names/nameFilters";
import { CheckCircle, Eye } from "@/shared/lib/icons";

export const AdminActionButton = ({
        nameItem,
        actionType,
        isProcessing,
        onClick,
}: {
        nameItem: NameItem;
        actionType: "toggle-hidden" | "toggle-locked";
        isProcessing: boolean;
        onClick: () => void;
}) => {
        const isHidden = actionType === "toggle-hidden";
        const _isLocked = actionType === "toggle-locked";
        const isEnabled = isHidden ? isNameHidden(nameItem) : isNameLocked(nameItem);

        const buttonClasses = `flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isHidden
                        ? isEnabled
                                ? "bg-success hover:bg-success/80 text-success-foreground shadow-success/25"
                                : "bg-destructive hover:bg-destructive/80 text-destructive-foreground shadow-destructive/25"
                        : isEnabled
                                ? "bg-muted hover:bg-muted/80 text-muted-foreground shadow-muted/25"
                                : "bg-warning hover:bg-warning/80 text-warning-foreground shadow-warning/25"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} shadow-lg`;

        return (
                <motion.button
                        type="button"
                        onClick={onClick}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={buttonClasses}
                >
                        {isProcessing ? (
                                <div className="flex items-center justify-center gap-1">
                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                        <span>Processing...</span>
                                </div>
                        ) : isHidden ? (
                                <>
                                        <Eye size={12} className="mr-1 inline" />
                                        {isEnabled ? "Unhide" : "Hide"}
                                </>
                        ) : (
                                <>
                                        <CheckCircle size={12} className="mr-1 inline" />
                                        {isEnabled ? "Unlock" : "Lock"}
                                </>
                        )}
                </motion.button>
        );
};
