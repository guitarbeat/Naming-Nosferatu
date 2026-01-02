/**
 * @module Login
 * @description User login component with retro diorama aesthetic.
 */

import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { generateFunName } from "../../shared/utils/coreUtils";
import { useCatFact } from "./hooks/useCatFact";
import { useEyeTracking } from "./hooks/useEyeTracking";
import { useLoginController } from "./hooks/useLoginController";
import styles from "./Login.module.css";

function Login({ onLogin }: { onLogin: (name: string) => void }) {
	const catRef = useRef<HTMLDivElement>(null);

	// * Fetch cat fact
	const catFact = useCatFact();

	// * Track eye position
	// We pass catRef for both as the reference point for now
	const eyePosition = useEyeTracking({ catRef, catSvgRef: catRef });

	// * Form state and handlers
	const {
		name,
		setName,
		isLoading,
		error,
		handleNameChange,
		handleSubmit,
		clearError,
	} = useLoginController(onLogin);

	const handleRandomNameClick = () => {
		if (isLoading) {
			return;
		}
		const funName = generateFunName();
		setName(funName);
		if (error) {
			clearError();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSubmit(e);
		}
	};

	return (
		<div className={styles.loginWrapper}>
			<div className={styles.scene}>
				<div className={styles.cutOutCat} ref={catRef}>
					<motion.div
						className={styles.eye}
						animate={{ x: eyePosition.x, y: eyePosition.y }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					/>
					<motion.div
						className={`${styles.eye} ${styles.eyeRight}`}
						animate={{ x: eyePosition.x, y: eyePosition.y }}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
					/>
				</div>

				<div className={styles.catFactTape}>
					{catFact ? `FACT: ${catFact}` : "LOADING FELINE DATA..."}
				</div>

				<h1 className={styles.title}>JUDGE REGISTRY</h1>
				<p className={styles.subtitle}>
					DEPOSIT NAME BELOW TO EVALUATE FELINES
				</p>

				<div className={styles.inputTray}>
					<input
						type="text"
						className={styles.loginInput}
						placeholder="--- --- ---"
						value={name}
						onChange={handleNameChange}
						onKeyDown={handleKeyDown}
						disabled={isLoading}
						autoFocus
						maxLength={30}
						aria-label="Your Name"
					/>
				</div>

				{error && (
					<div className={styles.error} role="alert">
						{error}
					</div>
				)}

				<motion.button
					className={styles.leverBtn}
					onClick={handleSubmit}
					disabled={isLoading}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					{isLoading ? "ENGAGING..." : "ENGAGE TOURNAMENT"}
				</motion.button>

				<motion.button
					className={styles.rerollBtn}
					onClick={handleRandomNameClick}
					disabled={isLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					aria-label="Generate random name"
				>
					<Dices
						size={16}
						style={{
							display: "inline",
							marginRight: "6px",
							verticalAlign: "text-bottom",
						}}
					/>
					[ RE-ROLL IDENTITY ]
				</motion.button>
			</div>
		</div>
	);
}

export default Login;
