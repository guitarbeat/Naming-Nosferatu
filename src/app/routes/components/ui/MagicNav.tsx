import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Button from "@/shared/components/layout/Button";
import { TIMING } from "@/shared/lib/constants";

export interface MagicNavAction {
	label: ReactNode;
	onClick: () => void;
	variant?: "default" | "glass" | "outline" | "ghost" | "danger" | "success" | "warning";
}

interface MagicNavProps {
	actions: MagicNavAction[];
}

export function MagicNav({ actions }: MagicNavProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
			className="mt-auto pt-8 flex justify-center w-full"
		>
			<div className="relative flex items-center gap-2 p-1.5 rounded-full bg-foreground/5 backdrop-blur-sm border border-foreground/10 shadow-lg shadow-black/5 group hover:shadow-black/10 transition-shadow">
				{actions.map((action, i) => (
					<motion.div
						key={`nav-action-${i}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Button
							variant={action.variant ?? "glass"}
							size="lg"
							onClick={action.onClick}
							className={`rounded-full px-6 transition-colors duration-300 ${action.variant ? "" : "hover:bg-foreground/10"}`}
						>
							{action.label}
						</Button>
					</motion.div>
				))}
			</div>
		</motion.div>
	);
}
