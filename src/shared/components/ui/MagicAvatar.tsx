import { motion } from "framer-motion";

export function MagicAvatar({ avatarSrc, onError }: { avatarSrc: string; onError: () => void }) {
	return (
		<motion.div
			className="relative mb-2 cursor-pointer"
			whileHover={{ scale: 1.05, rotate: 2 }}
			whileTap={{ scale: 0.95, rotate: -2 }}
		>
			<div
				className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-60 animate-pulse"
				aria-hidden="true"
			/>
			<div className="relative size-28 rounded-[2rem] overflow-hidden ring-4 ring-primary/40 ring-offset-4 ring-offset-card bg-muted shadow-2xl transition-all duration-300 hover:ring-primary/60">
				<img src={avatarSrc} alt="Profile" className="size-full object-cover transition-transform duration-500 hover:scale-110" onError={onError} />
			</div>
		</motion.div>
	);
}
