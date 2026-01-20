import { useCallback, useEffect, useId, useRef } from "react";
import { useNameSuggestion } from "../../hooks/useNameSuggestion";
import LiquidGlass from "../LiquidGlass";
import { ValidatedInput } from "../ValidatedInput";
import "./NameSuggestionModal.css";

/**
 * Modal component for suggesting new cat names
 */
export function NameSuggestionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

	// * Track mount state
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// * Focus name input when modal opens
	useEffect(() => {
		if (isOpen && nameInputRef.current) {
			setTimeout(() => {
				nameInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// * Handle Escape key to close modal
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
			<div className="name-suggestion-modal-backdrop" onClick={handleClose} aria-hidden="true" />
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
				className="name-suggestion-modal-glass"
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
					className="name-suggestion-modal"
					role="dialog"
					aria-labelledby="suggest-name-title"
					aria-describedby="suggest-name-description"
					aria-modal="true"
				>
					<div className="name-suggestion-modal-header">
						<h2 id="suggest-name-title" className="name-suggestion-modal-title">
							💡 Suggest a Name
						</h2>
						<button
							type="button"
							className="name-suggestion-modal-close"
							onClick={handleClose}
							aria-label="Close modal"
							disabled={isSubmitting}
						>
							×
						</button>
					</div>

					<p id="suggest-name-description" className="name-suggestion-modal-description">
						Help us expand the list by suggesting new cat names!
					</p>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							void handleSubmit();
						}}
						className="name-suggestion-modal-form"
					>
						<ValidatedInput
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
						/>

						<div className="name-suggestion-form-group">
							<label htmlFor="modal-description-input" className="name-suggestion-form-label">
								Description
							</label>
							<textarea
								id="modal-description-input"
								value={values.description}
								onChange={(e) => {
									handleChange("description", e.target.value);
									if (globalError) {
										setGlobalError("");
									}
								}}
								onBlur={() => handleBlur("description")}
								placeholder="Why is this name special? (e.g. 'He looks like a vampire!')"
								className={`name-suggestion-form-textarea ${touched.description && errors.description ? "input-error" : ""}`}
								disabled={isSubmitting}
								maxLength={500}
								rows={4}
							/>
							{touched.description && errors.description && (
								<p className="field-error-message">{errors.description}</p>
							)}
						</div>

						{globalError && <div className="name-suggestion-form-error">{globalError}</div>}
						{success && <div className="name-suggestion-form-success">{success}</div>}

						<div className="name-suggestion-modal-actions">
							<button
								type="button"
								onClick={handleClose}
								className="name-suggestion-modal-cancel"
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="name-suggestion-modal-submit"
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
