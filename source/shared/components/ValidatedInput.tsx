import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { forwardRef, useCallback, useEffect, useId, useState } from "react";
import type { z } from "zod";

// Styles consolidated in src/shared/styles/form-controls.css

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	schema?: z.ZodSchema;
	onValidationChange?: (isValid: boolean) => void;
	debounceMs?: number;
	showSuccess?: boolean;
	externalError?: string | null;
	externalTouched?: boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
	(
		{
			label,
			schema,
			value,
			onChange,
			onValidationChange,
			debounceMs = 300,
			className = "",
			showSuccess = true,
			externalError,
			externalTouched,
			...props
		},
		ref,
	) => {
		const [error, setError] = useState<string | null>(null);
		const [isTouched, setIsTouched] = useState(false);
		const [isValidating, setIsValidating] = useState(false);
		const internalId = useId();
		const id = props.id || internalId;

		const validate = useCallback(
			(val: string) => {
				if (!schema) {
					return;
				}

				const result = schema.safeParse(val);
				if (result.success) {
					setError(null);
					onValidationChange?.(true);
				} else {
					setError(result.error.issues[0]?.message || "Please check your input");
					onValidationChange?.(false);
				}
				setIsValidating(false);
			},
			[schema, onValidationChange],
		);

		useEffect(() => {
			if (!isTouched || !schema) {
				return;
			}

			setIsValidating(true);
			const timer = setTimeout(() => {
				validate(String(value || ""));
			}, debounceMs);

			return () => clearTimeout(timer);
		}, [value, isTouched, schema, validate, debounceMs]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setIsTouched(true);
			onChange?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			setIsTouched(true);
			validate(String(value || ""));
			props.onBlur?.(e);
		};

		const currentError = externalError !== undefined ? externalError : error;
		const currentTouched = externalTouched !== undefined ? externalTouched : isTouched;

		const hasError = currentTouched && currentError && !isValidating;
		const isSuccess =
			currentTouched && !currentError && !isValidating && String(value || "").length > 0;

		return (
			<div className={`input-container ${className}`}>
				{label && (
					<label htmlFor={id} className="form-label">
						{label}
					</label>
				)}

				<div className="input-wrapper">
					<input
						{...props}
						id={id}
						ref={ref}
						value={value}
						onChange={handleChange}
						onBlur={handleBlur}
						className={`
            form-input
            ${hasError ? "error" : ""}
            ${isSuccess && showSuccess ? "success" : ""}
            ${hasError ? "input-shake" : ""}
          `}
						aria-invalid={!!hasError}
						aria-describedby={hasError ? `${id}-error` : undefined}
					/>

					<AnimatePresence>
						{isSuccess && showSuccess && (
							<motion.span
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
								className="feedback-icon"
							>
								✅
							</motion.span>
						)}
						{hasError && (
							<motion.span
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
								className="feedback-icon"
							>
								❌
							</motion.span>
						)}
					</AnimatePresence>
				</div>

				<div className="error-container">
					<AnimatePresence mode="wait">
						{hasError && (
							<motion.p
								id={`${id}-error`}
								key={currentError}
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="error-message"
								role="alert"
							>
								{currentError}
							</motion.p>
						)}
					</AnimatePresence>
				</div>
			</div>
		);
	},
);

ValidatedInput.displayName = "ValidatedInput";
