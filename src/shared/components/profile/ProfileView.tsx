import { LogOut, Pencil } from "lucide-react";
import { motion } from "framer-motion";

export interface ProfileViewProps {
	userName: string | undefined;
	isLoggingOut: boolean;
	handleEdit: () => void;
	handleLogout: () => void;
}

export function ProfileView({ userName, isLoggingOut, handleEdit, handleLogout }: ProfileViewProps) {
	return (
		<div className="w-full flex flex-col items-center gap-3 animate-in fade-in duration-200">
			<div className="flex items-center gap-2">
				<h3 className="text-xl font-bold text-foreground">{userName}</h3>
				<motion.button
					type="button"
					onClick={handleEdit}
					whileHover={{ scale: 1.15, rotate: 10 }}
		whileTap={{ scale: 0.9 }}
					className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
					aria-label="Edit name"
				>
					<Pencil size={14} />
				</motion.button>
			</div>

			<p className="text-xs text-muted-foreground/80">Your preferences are saved for ranking.</p>

			<motion.button
				type="button"
				onClick={handleLogout}
				disabled={isLoggingOut}
				whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
				className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
			>
				<LogOut size={13} />
				{isLoggingOut ? "Logging out..." : "Logout"}
			</motion.button>
		</div>
	);
}
