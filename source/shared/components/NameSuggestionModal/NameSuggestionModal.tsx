/**
 * @module NameSuggestionModal
 * @description Modal component for suggesting new cat names
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { VALIDATION } from "../../../core/constants";
import useAppStore from "../../../core/store/useAppStore";
import { useToast } from "../../hooks/useAppHooks";
import { useValidatedForm } from "../../hooks/useValidatedForm";
import { ErrorManager } from "../../services/errorManager/index";
import { catNamesAPI } from "../../services/supabase/client";
import LiquidGlass from "../LiquidGlass";
import { ValidatedInput } from "../ValidatedInput";
import "./NameSuggestionModal.css";

/**
 * Schema for name suggestion form validation
 */
const SuggestionSchema = z.object({
	name: z
		.string()
		.min(VALIDATION.MIN_CAT_NAME_LENGTH || 2, "Name must be at least 2 characters")
		.max(VALIDATION.MAX_CAT_NAME_LENGTH || 50, "Name must be 50 characters or less"),
	description: z
		.string()
		.min(
			5, // * Low-Friction Validation: Relaxed from 10 to 5
			"Description can be short!",
		)
		.max(VALIDATION.MAX_DESCRIPTION_LENGTH || 500, "Description must be 500 characters or less"),
});

/**
 * Modal component for suggesting new cat names
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
export function NameSuggestionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const [globalError, setGlobalError] = useState("");
	const [success, setSuccess] = useState("");
	const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isMountedRef = useRef(true);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const modalGlassId = useId();
	const { showSuccess, showError } = useToast();

	// * Get current user name from store for RLS context
	const userName = useAppStore((state) => state.user.name);

	const form = useValidatedForm<typeof SuggestionSchema.shape>({
		schema: SuggestionSchema,
		initialValues: { name: "", description: "" },
		onSubmit: async (values) => {
			if (!userName || !userName.trim()) {
				setGlobalError("Please log in to suggest a name.");
				return;
			}

			try {
				setGlobalError("");
				const submissionResult = await catNamesAPI.addName(
					values.name,
					values.description,
					userName,
				);

				if (!isMountedRef.current) {
					return;
				}

				if (submissionResult?.success === false) {
					throw new Error(submissionResult.error || "Unable to add name. Please try again.");
				}

				setSuccess("Thank you for your suggestion!");
				showSuccess("Name suggestion submitted!");
				form.reset();

				// * Clear success message after 3 seconds, then close modal
				if (successTimeoutRef.current) {
					clearTimeout(successTimeoutRef.current);
				}
				successTimeoutRef.current = setTimeout(() => {
					if (isMountedRef.current) {
						setSuccess("");
						onClose();
					}
					successTimeoutRef.current = null;
				}, 3000);
			} catch (err) {
				if (!isMountedRef.current) {
					return;
				}

				const errorObj = err as { message?: string; error?: string } | null;
				const errorMessage =
					errorObj?.message ||
					errorObj?.error ||
					"Unable to submit your suggestion. Please try again.";
				setGlobalError(errorMessage);
				showError(errorMessage);

				ErrorManager.handleError(err, "Add Name Suggestion", {
					isRetryable: true,
					affectsUserData: false,
					isCritical: false,
				});
			}
		},
	});

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
	} = form;

	// * Track mount state and cleanup timeout on unmount
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			if (successTimeoutRef.current) {
				clearTimeout(successTimeoutRef.current);
				successTimeoutRef.current = null;
			}
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
		setSuccess("");
		onClose();
	}, [isSubmitting, onClose, reset]);

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
							disabled={isSubmitting}
							maxLength={50}
							schema={SuggestionSchema.shape.name}
							externalError={errors.name}
							externalTouched={touched.name}
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
