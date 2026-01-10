import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface RippleHandle {
	addRipple: () => void;
}

interface RippleContainerProps {
	className?: string;
}

export const RippleContainer = forwardRef<RippleHandle, RippleContainerProps>(
	({ className }, ref) => {
		const [ripples, setRipples] = useState<{ id: string }[]>([]);

		useImperativeHandle(ref, () => ({
			addRipple: () => {
				const id = `${Date.now()}-${Math.random()}`;
				setRipples((prev) => [...prev, { id }]);
				setTimeout(() => {
					setRipples((prev) => prev.filter((r) => r.id !== id));
				}, 800);
			},
		}));

		return (
			<AnimatePresence>
				{ripples.map((ripple) => (
					<motion.div
						key={ripple.id}
						className={className}
						initial={{ scale: 0, opacity: 1 }}
						animate={{ scale: 2.5, opacity: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					/>
				))}
			</AnimatePresence>
		);
	},
);

RippleContainer.displayName = "RippleContainer";
