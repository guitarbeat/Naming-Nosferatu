/**
 * @module FormPrimitives
 * @description Unified form system with validated inputs, selects, and textareas.
 * Single source of truth for all form components in the application.
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { forwardRef, useCallback, useEffect, useId, useState } from "react";
import type { z } from "zod";
import styles from "./FormPrimitives.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface BaseFieldProps {
	label?: string;
	error?: string | null;
	required?: boolean;
	showSuccess?: boolean;
	className?: string;
}

interface ValidationProps {
	schema?: z.ZodSchema;
	onValidationChange?: (isValid: boolean) => void;
	debounceMs?: number;
	externalError?: string | null;
	externalTouched?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

interface FormFieldContextValue {
	id: string;
	errorId: string | undefined;
	error: string | null;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export const useFormField = () => {
	const context = React.useContext(FormFieldContext);
	if (!context) {
		throw new Error("Form components must be used within a FormField");
	}
	return context;
};

// ============================================================================
// FORM FIELD WRAPPER
// ============================================================================

interface FormFieldProps extends BaseFieldProps {
	children: React.ReactNode;
	id?: string;
	name?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
	id,
	name,
	label,
	error,
	required = false,
	children,
	className = "",
}) => {
	const generatedId = useId();
	const fieldId = id || (name ? `${name}-field` : `field-${generatedId}`);
	const errorId = error ? `${fieldId}-error` : undefined;

	return (
		<FormFieldContext.Provider value={{ id: fieldId, errorId, error: error || null }}>
			<div className={`${styles.formField} ${className}`.trim()}>
				{label && (
					<label htmlFor={fieldId} className={styles.label}>
						{label}
						{required && <span className={styles.required}>*</span>}
					</label>
				)}
				{children}
				<AnimatePresence mode="wait">
					{error && errorId && (
						<motion.div
							id={errorId}
							key={error}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className={styles.errorText}
							role="alert"
						>
							{error}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</FormFieldContext.Provider>
	);
};

FormField.displayName = "FormField";

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
	BaseFieldProps,
	ValidationProps { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			error,
			required,
			schema,
			value,
			onChange,
			onValidationChange,
			debounceMs = 300,
			showSuccess = false,
			externalError,
			externalTouched,
			className = "",
			...props
		},
		ref,
	) => {
		const [internalError, setInternalError] = useState<string | null>(null);
		const [isTouched, setIsTouched] = useState(false);
		const [isValidating, setIsValidating] = useState(false);
		const internalId = useId();
		const id = props.id || internalId;

		const validate = useCallback(
			(val: string) => {
				if (!schema) return;

				const result = schema.safeParse(val);
				if (result.success) {
					setInternalError(null);
					onValidationChange?.(true);
				} else {
					setInternalError(result.error.issues[0]?.message || "Invalid input");
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

		const currentError = externalError !== undefined ? externalError : error || internalError;
		const currentTouched = externalTouched !== undefined ? externalTouched : isTouched;
		const hasError = currentTouched && currentError && !isValidating;
		const isSuccess =
			showSuccess && currentTouched && !currentError && !isValidating && String(value || "").length > 0;

		const inputClasses = [
			styles.input,
			hasError && styles.inputError,
			isSuccess && styles.inputSuccess,
			hasError && styles.shake,
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<FormField id={id} label={label} error={hasError ? currentError : null} required={required}>
				<div className={styles.inputWrapper}>
					<input
						{...props}
						id={id}
						ref={ref}
						value={value}
						onChange={handleChange}
						onBlur={handleBlur}
						className={inputClasses}
						aria-invalid={hasError || undefined}
						aria-describedby={hasError ? `${id}-error` : undefined}
					/>
					<AnimatePresence>
						{isSuccess && (
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
			</FormField>
		);
	},
);

Input.displayName = "Input";

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

interface TextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
	BaseFieldProps,
	ValidationProps { }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			label,
			error,
			required,
			schema,
			value,
			onChange,
			onValidationChange,
			debounceMs = 300,
			showSuccess = false,
			externalError,
			externalTouched,
			className = "",
			...props
		},
		ref,
	) => {
		const [internalError, setInternalError] = useState<string | null>(null);
		const [isTouched, setIsTouched] = useState(false);
		const [isValidating, setIsValidating] = useState(false);
		const internalId = useId();
		const id = props.id || internalId;

		const validate = useCallback(
			(val: string) => {
				if (!schema) return;

				const result = schema.safeParse(val);
				if (result.success) {
					setInternalError(null);
					onValidationChange?.(true);
				} else {
					setInternalError(result.error.issues[0]?.message || "Invalid input");
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

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setIsTouched(true);
			onChange?.(e);
		};

		const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
			setIsTouched(true);
			validate(String(value || ""));
			props.onBlur?.(e);
		};

		const currentError = externalError !== undefined ? externalError : error || internalError;
		const currentTouched = externalTouched !== undefined ? externalTouched : isTouched;
		const hasError = currentTouched && currentError && !isValidating;
		const isSuccess =
			showSuccess && currentTouched && !currentError && !isValidating && String(value || "").length > 0;

		const textareaClasses = [
			styles.textarea,
			hasError && styles.inputError,
			isSuccess && styles.inputSuccess,
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<FormField id={id} label={label} error={hasError ? currentError : null} required={required}>
				<textarea
					{...props}
					id={id}
					ref={ref}
					value={value}
					onChange={handleChange}
					onBlur={handleBlur}
					className={textareaClasses}
					aria-invalid={hasError || undefined}
					aria-describedby={hasError ? `${id}-error` : undefined}
				/>
			</FormField>
		);
	},
);

Textarea.displayName = "Textarea";

// ============================================================================
// SELECT COMPONENT
// ============================================================================

interface SelectOption {
	value: string | number;
	label: string;
	disabled?: boolean;
}

interface SelectProps
	extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">,
	BaseFieldProps {
	options?: SelectOption[];
	placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
	(
		{
			label,
			error,
			required,
			options = [],
			placeholder = "Choose an option",
			className = "",
			...props
		},
		ref,
	) => {
		const internalId = useId();
		const id = props.id || internalId;

		const selectClasses = [styles.select, error && styles.inputError, className]
			.filter(Boolean)
			.join(" ");

		return (
			<FormField id={id} label={label} error={error} required={required}>
				<select
					{...props}
					id={id}
					ref={ref}
					className={selectClasses}
					aria-invalid={!!error}
					aria-describedby={error ? `${id}-error` : undefined}
				>
					{placeholder && (
						<option value="" disabled>
							{placeholder}
						</option>
					)}
					{options.map((option) => (
						<option key={option.value} value={option.value} disabled={option.disabled}>
							{option.label}
						</option>
					))}
				</select>
			</FormField>
		);
	},
);

Select.displayName = "Select";

// ============================================================================
// FORM ACTIONS
// ============================================================================

interface FormActionsProps {
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
	children,
	align = "end",
	className = "",
}) => {
	const alignmentClass =
		align === "start" ? styles.actionsStart : align === "center" ? styles.actionsCenter : "";

	return <div className={`${styles.formActions} ${alignmentClass} ${className}`.trim()}>{children}</div>;
};

FormActions.displayName = "FormActions";
