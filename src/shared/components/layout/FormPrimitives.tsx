import { XCircle } from "lucide-react";
import type React from "react";
import { forwardRef, useId } from "react";
import { cn } from "@/shared/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface BaseFieldProps {
	label?: string;
	error?: string | null;
	required?: boolean;
	className?: string;
}

// ============================================================================
// STYLES
// ============================================================================

const inputBaseStyles =
	"flex h-12 w-full rounded-xl border border-border/10 bg-background/20 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:scale-[1.02] focus-visible:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out text-foreground backdrop-blur-sm hover:border-primary/40 hover:bg-background/30 shadow-sm focus-visible:shadow-lg focus-visible:shadow-primary/20";

const errorStyles = "border-destructive/50 focus-visible:ring-destructive/50 animate-pulse";

// ============================================================================
// FORM FIELD WRAPPER
// ============================================================================

interface FormFieldProps extends BaseFieldProps {
	children: React.ReactNode;
	id?: string;
	name?: string;
	disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
	id,
	name,
	label,
	error,
	required = false,
	disabled = false,
	children,
	className = "",
}) => {
	const generatedId = useId();
	const fieldId = id || (name ? `${name}-field` : `field-${generatedId}`);
	const errorId = error ? `${fieldId}-error` : undefined;

	return (
		<div className={cn("flex flex-col gap-2 w-full", className)}>
			{label && (
				<label
					htmlFor={fieldId}
					className={cn(
						"text-sm font-medium leading-none text-foreground/80 ml-1 transition-opacity",
						disabled && "cursor-not-allowed opacity-50",
					)}
				>
					{label}
					{required && <span className="text-destructive ml-1">*</span>}
				</label>
			)}
			{children}
			{error && errorId && (
				<div
					id={errorId}
					className="ml-1 text-xs font-medium text-destructive motion-safe:animate-[fadeIn_140ms_ease-out]"
					role="alert"
				>
					{error}
				</div>
			)}
		</div>
	);
};

FormField.displayName = "FormField";

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
		BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			error,
			required,
			className = "",
			...props
		},
		ref,
	) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);

		return (
			<FormField
				id={id}
				label={label}
				error={error}
				required={required}
				disabled={props.disabled}
			>
				<div className="relative">
					<input
						{...props}
						id={id}
						ref={ref}
						className={cn(inputBaseStyles, hasError && errorStyles, className)}
						aria-invalid={hasError || undefined}
						aria-describedby={hasError ? `${id}-error` : undefined}
					/>
					{hasError && (
						<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-destructive pointer-events-none motion-safe:animate-[fadeIn_160ms_ease-out]">
							<XCircle size={16} />
						</span>
					)}
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
		BaseFieldProps {
	showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			label,
			error,
			required,
			value,
			showCount = false,
			className = "",
			...props
		},
		ref,
	) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);

		const currentLength = String(value || "").length;
		const maxLength = props.maxLength;
		const countId = `${id}-count`;

		const describedBy = [
			hasError ? `${id}-error` : undefined,
			showCount && maxLength ? countId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<FormField
				id={id}
				label={label}
				error={error}
				required={required}
				disabled={props.disabled}
			>
				<textarea
					{...props}
					id={id}
					ref={ref}
					value={value}
					className={cn(
						inputBaseStyles,
						"min-h-[80px] py-3",
						hasError && errorStyles,
						className,
					)}
					aria-invalid={hasError || undefined}
					aria-describedby={describedBy || undefined}
				/>
				{showCount && maxLength && (
					<div
						id={countId}
						className="text-xs text-muted-foreground/50 text-right font-medium tabular-nums px-1"
					>
						{currentLength}/{maxLength}
					</div>
				)}
			</FormField>
		);
	},
);

Textarea.displayName = "Textarea";
