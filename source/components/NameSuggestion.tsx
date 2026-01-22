/**
 * @module NameSuggestion
 * @description Unified name suggestion component with inline and modal variants.
 * Uses the shared useNameSuggestion hook for consistent submission logic.
 */

import { useCallback, useEffect, useId, useRef } from "react";
import { useNameSuggestion } from "@/hooks/useNameSuggestion";
import Button from "./Button";
import { Input, Textarea } from "./FormPrimitives";
import LiquidGlass from "./LiquidGlass";
import styles from "./NameSuggestion.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface NameSuggestionProps {
	/** Variant: inline (compact) or modal (full-featured) */
	variant?: "inline" | "modal";
	/** For modal variant: controls visibility */
	isOpen?: boolean;
	/** For modal variant: close callback */
	onClose?: () => void;
}

// ============================================================================
// INLINE VARIANT
// ============================================================================

function InlineNameSuggestion() {
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

// ============================================================================
// MODAL VARIANT
// ============================================================================

interface ModalNameSuggestionProps {
	isOpen: boolean;
	onClose: () => void;
}

function ModalNameSuggestion({ isOpen, onClose }: ModalNameSuggestionProps) {
	const isMountedRef = useRef(true);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const modalGlassId = useId();

	const {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		successMessage: success,
		setGlobalError,
	} = useNameSuggestion({
		onSuccess: () => {
			setTimeout(() => {
				if (isMountedRef.current) {
					onClose();
				}
			}, 3000);
		},
	});

	// Track mount state
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Focus name input when modal opens
	useEffect(() => {
		if (isOpen && nameInputRef.current) {
			setTimeout(() => {
				nameInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Handle Escape key to close modal
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				reset();
				onClose();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose, reset]);

	const handleClose = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		reset();
		setGlobalError("");
		onClose();
	}, [isSubmitting, onClose, reset, setGlobalError]);

	if (!isOpen) {
		return null;
	}

	return (
		<>
			<div className={styles.modalBackdrop} onClick={handleClose} aria-hidden="true" />
			<LiquidGlass
				id={`modal-glass-${modalGlassId.replace(/:/g, "-")}`}
				width={500}
				height={600}
				radius={20}
				scale={-80}
				saturation={1.05}
				frost={0.08}
				inputBlur={8}
				outputBlur={1.2}
				className={styles.modalGlass}
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "min(90vw, 500px)",
					maxHeight: "90vh",
					height: "auto",
					minHeight: "400px",
					maxWidth: "min(90vw, 500px)",
					zIndex: "1051",
				}}
			>
				<div
					className={styles.modal}
					role="dialog"
					aria-labelledby="suggest-name-title"
					aria-describedby="suggest-name-description"
					aria-modal="true"
				>
					<div className={styles.modalHeader}>
						<h2 id="suggest-name-title" className={styles.modalTitle}>
							💡 Suggest a Name
						</h2>
						<button
							type="button"
							className={styles.modalClose}
							onClick={handleClose}
							aria-label="Close modal"
							disabled={isSubmitting}
						>
							×
						</button>
					</div>

					<p id="suggest-name-description" className={styles.modalDescription}>
						Help us expand the list by suggesting new cat names!
					</p>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							void handleSubmit();
						}}
						className={styles.modalForm}
					>
						<Input
							id="modal-name-input"
							label="Name"
							ref={nameInputRef}
							type="text"
							value={values.name}
							onChange={(e) => {
								handleChange("name", e.target.value);
								if (globalError) {
									setGlobalError("");
								}
							}}
							onBlur={() => handleBlur("name")}
							placeholder="e.g., Whiskers"
							maxLength={50}
							showSuccess={true}
							error={touched.name ? errors.name : null}
						/>

						<Textarea
							id="modal-description-input"
							label="Description"
							value={values.description}
							onChange={(e) => {
								handleChange("description", e.target.value);
								if (globalError) {
									setGlobalError("");
								}
							}}
							onBlur={() => handleBlur("description")}
							placeholder="Why is this name special? (e.g. 'He looks like a vampire!')"
							disabled={isSubmitting}
							maxLength={500}
							rows={4}
							error={touched.description ? errors.description : null}
						/>

						{globalError && <div className={styles.formError}>{globalError}</div>}
						{success && <div className={styles.formSuccess}>{success}</div>}

						<div className={styles.modalActions}>
							<button
								type="button"
								onClick={handleClose}
								className={styles.modalCancel}
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								className={styles.modalSubmit}
								disabled={isSubmitting || !isValid}
							>
								{isSubmitting ? "Submitting..." : "Submit Suggestion"}
							</button>
						</div>
					</form>
				</div>
			</LiquidGlass>
		</>
	);
}

// ============================================================================
// UNIFIED EXPORT
// ============================================================================

export function NameSuggestion({
	variant = "inline",
	isOpen = false,
	onClose,
}: NameSuggestionProps) {
	if (variant === "modal") {
		return (
			<ModalNameSuggestion
				isOpen={isOpen}
				onClose={
					onClose ||
					(() => {
						/* No-op default */
					})
				}
			/>
		);
	}
	return <InlineNameSuggestion />;
}
