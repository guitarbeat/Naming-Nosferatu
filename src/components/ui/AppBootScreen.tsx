import { motion } from "framer-motion";
import { scaleFadeMotionPreset } from "@/lib/uiUtils";

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: {
	message?: string;
	visible?: boolean;
}) {
	if (!visible) {
		return null;
	}

	return (
		<div
			data-testid="boot-screen"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
		>
			<motion.div
				{...scaleFadeMotionPreset}
				className="flex flex-col items-center space-y-6 px-4 text-center max-w-md"
			>
				<div className="relative flex h-16 w-16 items-center justify-center">
					<div className="absolute h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute h-16 w-16 rounded-full border-4 border-t-primary animate-spin" />
				</div>

				<div className="space-y-2">
					<h2 className="text-xl font-bold tracking-tight text-foreground">
						{message}
					</h2>
					<p className="text-sm text-muted-foreground animate-pulse">
						Please wait a moment while we load the application context...
					</p>
				</div>
			</motion.div>
		</div>
	);
}
