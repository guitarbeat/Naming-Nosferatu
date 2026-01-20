import { useState } from "react";
import useAppStore from "../../../core/store/useAppStore";
import { useToast } from "../../providers/ToastProvider";
import { catNamesAPI } from "../../services/supabase/client";
import Button from "../Button";
import LiquidGlass from "../LiquidGlass";
import styles from "./NameSuggestion.module.css";

export function NameSuggestion() {
	const { user } = useAppStore();
	const { showToast } = useToast();
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			return;
		}

		setIsSubmitting(true);
		try {
			await catNamesAPI.addName(name.trim(), user?.name || "anonymous");
			showToast({
				message: `"${name}" has been added to the database.`,
				type: "success",
			});
			setName("");
		} catch {
			showToast({
				message: "Failed to suggest name. Please try again.",
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<LiquidGlass
			className={styles.suggestionBox}
			style={{ width: "100%", height: "auto", minHeight: "200px" }}
			radius={24}
			frost={0.2}
			saturation={1.1}
			outputBlur={0.8}
		>
			<form onSubmit={handleSubmit} className={styles.form} style={{ padding: "2rem" }}>
				<div className={styles.inputGroup}>
					<label htmlFor="suggest-name" className={styles.label}>
						Got a great name in mind?
					</label>
					<div className={styles.inputWrapper}>
						<input
							id="suggest-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter a cool cat name..."
							className={styles.input}
							disabled={isSubmitting}
						/>
						<Button
							type="submit"
							variant="primary"
							disabled={!name.trim() || isSubmitting}
							loading={isSubmitting}
						>
							Suggest
						</Button>
					</div>
				</div>
				<p className={styles.hint}>
					Your suggestion will be added to the pool for everyone to discover.
				</p>
			</form>
		</LiquidGlass>
	);
}
