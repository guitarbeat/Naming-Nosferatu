import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect, useId, useState } from "react";
import type { z } from "zod";
import styles from "./ValidatedInput.module.css";

interface ValidatedInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	schema?: z.ZodSchema;
	onValidationChange?: (isValid: boolean) => void;
	debounceMs?: number;
	showSuccess?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
	label,
	schema,
	value,
	onChange,
	onValidationChange,
	debounceMs = 300,
	className = "",
	showSuccess = true,
	...props
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isTouched, setIsTouched] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const internalId = useId();
	const id = props.id || internalId;

	const validate = useCallback(
		(val: string) => {
			if (!schema) return;

			const result = schema.safeParse(val);
			if (result.success) {
				setError(null);
				onValidationChange?.(true);
			} else {
				setError(result.error.errors[0]?.message || "Invalid input");
				onValidationChange?.(false);
			}
			setIsValidating(false);
		},
		[schema, onValidationChange],
	);

	useEffect(() => {
		if (!isTouched || !schema) return;

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

	const hasError = isTouched && error && !isValidating;
	const isSuccess =
		isTouched && !error && !isValidating && String(value || "").length > 0;

	return (
		<div className={`${styles.container} ${className}`}>
			{label && (
				<label htmlFor={id} className={styles.label}>
					{label}
				</label>
			)}

			<div className={styles.inputWrapper}>
				<input
					{...props}
					id={id}
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					className={`
            ${styles.input}
            ${hasError ? styles.inputError : ""}
            ${isSuccess && showSuccess ? styles.inputSuccess : ""}
            ${hasError ? styles.shake : ""}
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
							className={styles.feedbackIcon}
						>
							✅
						</motion.span>
					)}
					{hasError && (
						<motion.span
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0, opacity: 0 }}
							className={styles.feedbackIcon}
						>
							❌
						</motion.span>
					)}
				</AnimatePresence>
			</div>

			<div className={styles.errorContainer}>
				<AnimatePresence mode="wait">
					{hasError && (
						<motion.p
							id={`${id}-error`}
							key={error}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className={styles.errorMessage}
							role="alert"
						>
							{error}
						</motion.p>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};

ValidatedInput.displayName = "ValidatedInput";
