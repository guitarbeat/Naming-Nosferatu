import { useNameSuggestion } from "../../hooks/useNameSuggestion";
import Button from "../Button";
import LiquidGlass from "../LiquidGlass";
import styles from "./NameSuggestion.module.css";

export function NameSuggestion() {
	const { values, isSubmitting, handleChange, handleSubmit, globalError, successMessage } =
		useNameSuggestion();

	const handleLocalSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
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
			<form onSubmit={handleLocalSubmit} className={styles.form} style={{ padding: "2rem" }}>
				<div className={styles.inputGroup}>
					<label htmlFor="suggest-name" className={styles.label}>
						Got a great name in mind?
					</label>
					<div className={styles.inputWrapper}>
						<input
							id="suggest-name"
							type="text"
							value={values.name}
							onChange={(e) => handleChange("name", e.target.value)}
							placeholder="Enter a cool cat name..."
							className={styles.input}
							disabled={isSubmitting}
						/>
						<Button
							type="submit"
							variant="primary"
							disabled={!values.name.trim() || isSubmitting}
							loading={isSubmitting}
						>
							Suggest
						</Button>
					</div>
				</div>
				{globalError && <p className={styles.error}>{globalError}</p>}
				{successMessage && <p className={styles.success}>{successMessage}</p>}
				<p className={styles.hint}>
					Your suggestion will be added to the pool for everyone to discover.
				</p>
			</form>
		</LiquidGlass>
	);
}
