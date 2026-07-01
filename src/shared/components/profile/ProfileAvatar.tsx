import { motion } from "framer-motion";

export function ProfileAvatar({
	avatarSrc,
	onError,
}: {
	avatarSrc: string;
	onError: () => void;
}) {
	return (
		<div className="relative mb-1">
			<div
				className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl opacity-50"
				aria-hidden="true"
			/>
			<motion.div
				whileHover={{ scale: 1.05, rotate: [-2, 2, -2, 0] }}
				whileTap={{ scale: 0.95 }}
				transition={{ type: "spring", stiffness: 400, damping: 15 }}
				className="relative size-24 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-card bg-muted shadow-lg"
			>
				<img
					src={avatarSrc}
					alt="Profile"
					className="size-full object-cover"
					onError={onError}
				/>
			</motion.div>
		</div>
	);
}
