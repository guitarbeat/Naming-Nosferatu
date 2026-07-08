import { motion } from "framer-motion";
import { LogOut, Pencil } from "lucide-react";
import { hapticNavTap } from "@/shared/lib/browser/haptics";

interface MagicActionGroupProps {
	onEdit: () => void;
	onLogout: () => void;
	isLoggingOut: boolean;
}

export function MagicActionGroup({
	onEdit,
	onLogout,
	isLoggingOut,
}: MagicActionGroupProps) {
	return (
		<div className="flex items-center gap-1.5 p-1.5 bg-foreground/5 border border-border/30 rounded-2xl backdrop-blur-md shadow-inner">
			<motion.button
				type="button"
				onClick={() => {
					hapticNavTap();
					onEdit();
				}}
				className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-background/80 hover:shadow-sm transition-all"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.95 }}
			>
				<Pencil size={15} />
				Edit Profile
			</motion.button>
			<div className="w-px h-6 bg-border/40 mx-1" />
			<motion.button
				type="button"
				onClick={() => {
					hapticNavTap();
					onLogout();
				}}
				disabled={isLoggingOut}
				className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 hover:shadow-sm transition-all disabled:opacity-50"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.95 }}
			>
				<LogOut size={15} />
				{isLoggingOut ? "Leaving..." : "Logout"}
			</motion.button>
		</div>
	);
}
