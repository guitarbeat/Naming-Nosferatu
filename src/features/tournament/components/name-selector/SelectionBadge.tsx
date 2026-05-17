import { motion } from "framer-motion";
import { Check } from "@/shared/lib/icons";

export const SelectionBadge = () => (
        <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-3 right-3 z-20"
        >
                <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative size-6 sm:size-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-primary/50">
                                <Check size={14} className="text-primary-foreground" strokeWidth={3} />
                        </div>
                </div>
        </motion.div>
);
