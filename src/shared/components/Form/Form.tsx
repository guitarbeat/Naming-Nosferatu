/**
 * @module Form
 * @description Unified form components with built-in error states and validation.
 * Combines Input, Select, and FormField functionality.
 */

import React from "react";
import styles from "./Form.module.css";

/**
 * FormField wrapper component that provides consistent structure for form inputs
 * @param {Object} props - Component props
 * @param {string} props.id - Field ID (auto-generated if not provided)
 * @param {string} props.name - Field name (required for ID generation)
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.ariaDescribedBy - Additional aria-describedby IDs
 * @param {React.ReactNode} props.children - The input/select element
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} FormField wrapper
 */
interface FormFieldProps {
	id?: string;
	name?: string;
	label?: string;
	error?: string;
	required?: boolean;
	ariaDescribedBy?: string;
	children: React.ReactElement;
	className?: string;
}

const FormField = ({
	id,
	name,
	label,
	error = "",
	required = false,
	ariaDescribedBy = "",
	children,
	className = "",
}: FormFieldProps) => {
	const generatedId = React.useId();
	const fieldId = id || `${name ? `${name}-field` : `field-${generatedId}`}`;
	const errorId = error ? `${fieldId}-error` : null;
	const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

	return (
		<div className={`${styles.inputGroup} ${className}`.trim()}>
			{label && (
				<label htmlFor={fieldId} className={styles.label}>
					{label}
					{required && <span className={styles.required}>*</span>}
				</label>
			)}
			{React.cloneElement(
				children as React.ReactElement<{
					id?: string;
					"aria-invalid"?: boolean;
					"aria-describedby"?: string;
				}>,
				{
					id: fieldId,
					"aria-invalid": !!error,
					"aria-describedby": describedBy,
				},
			)}
			{error && errorId && (
				<div id={errorId} className={styles.errorText} role="alert">
					{error}
				</div>
			)}
		</div>
	);
};

FormField.displayName = "FormField";

/**
 * Input component with built-in error handling
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {string} props.error - Error message
 * @param {string} props.label - Input label
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaDescribedBy - Space separated IDs for aria-describedby
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} Input component
 */
interface InputProps {
	type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
	name?: string;
	value?: string | number | null;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	error?: string;
	label?: string;
	className?: string;
	ariaDescribedBy?: string;
}

const Input = ({
	type = "text",
	name,
	value,
	onChange,
	onBlur,
	placeholder,
	disabled = false,
	required = false,
	error = "",
	label,
	className = "",
	ariaDescribedBy = "",
	...rest
}: InputProps) => {
	const inputClasses = [
		styles.input,
		error && styles["input--error"],
		disabled && styles["input--disabled"],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<FormField
			id={name}
			name={name}
			label={label}
			error={error}
			required={required}
			ariaDescribedBy={ariaDescribedBy}
		>
			<input
				type={type}
				name={name}
				value={value ?? ""}
				onChange={onChange}
				onBlur={onBlur}
				placeholder={placeholder}
				disabled={disabled}
				required={required}
				className={inputClasses}
				{...rest}
			/>
		</FormField>
	);
};

Input.displayName = "Input";

/**
 * Select component with built-in error handling
 * @param {Object} props - Component props
 * @param {string} props.name - Select name
 * @param {string} props.value - Select value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Array} props.options - Select options
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.required - Whether select is required
 * @param {string} props.error - Error message
 * @param {string} props.label - Select label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaDescribedBy - Space separated IDs for aria-describedby
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} Select component
 */
interface SelectOption {
	value: string | number;
	label: string;
	disabled?: boolean;
}

interface SelectProps {
	name?: string;
	value?: string | number | null;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
	options?: SelectOption[];
	disabled?: boolean;
	required?: boolean;
	error?: string;
	label?: string;
	placeholder?: string;
	className?: string;
	ariaDescribedBy?: string;
}

const Select = ({
	name,
	value,
	onChange,
	onBlur,
	options = [],
	disabled = false,
	required = false,
	error = "",
	label,
	placeholder = "Choose an option",
	className = "",
	ariaDescribedBy = "",
	...rest
}: SelectProps) => {
	const selectClasses = [
		styles.select,
		error && styles["select--error"],
		disabled && styles["select--disabled"],
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<FormField
			id={name}
			name={name}
			label={label}
			error={error}
			required={required}
			ariaDescribedBy={ariaDescribedBy}
		>
			<select
				name={name}
				value={value ?? ""}
				onChange={onChange}
				onBlur={onBlur}
				disabled={disabled}
				required={required}
				className={selectClasses}
				{...rest}
			>
				{placeholder && (
					<option value="" disabled={true}>
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
};

Select.displayName = "Select";

export { Select };
