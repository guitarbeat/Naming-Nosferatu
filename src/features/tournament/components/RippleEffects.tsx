import { AnimatePresence, motion } from "framer-motion";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import styles from "../tournament.module.css";

export interface RippleHandle {
	trigger: () => void;
}

const RippleEffects = forwardRef<RippleHandle>((_, ref) => {
	const [ripples, setRipples] = useState<{ id: string }[]>([]);

	useImperativeHandle(ref, () => ({
		trigger: () => {
			const rippleId = `ripple-${Date.now()}-${Math.random()}`;
			setRipples((prev) => [...prev, { id: rippleId }]);

			setTimeout(() => {
				setRipples((prev) => prev.filter((r) => r.id !== rippleId));
			}, 800);
		},
	}));

	return (
		<AnimatePresence>
			{ripples.map((ripple) => (
				<motion.div
					key={ripple.id}
					className={styles.ripple}
					initial={{ scale: 0, opacity: 1 }}
					animate={{ scale: 2.5, opacity: 0 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>
			))}
		</AnimatePresence>
	);
});

RippleEffects.displayName = "RippleEffects";
export default React.memo(RippleEffects);
