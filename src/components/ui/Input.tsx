import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import React, { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
	label?: string;
	error?: string | null;
	required?: boolean;
	className?: string;
}

const inputBaseStyles =
	"flex h-12 w-full rounded-full border border-white/30 dark:border-white/15 bg-white/50 dark:bg-black/40 backdrop-blur-md px-5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),0_2px_8px_rgba(31,38,135,0.04)] transition-[background-color,border-color,box-shadow,transform] duration-[300ms] ease-spring relative z-10 hover:border-primary/40 hover:bg-white/65 dark:hover:bg-black/50";

const errorStyles = "border-destructive focus-visible:ring-destructive";

export interface FormFieldProps extends BaseFieldProps {
	children: React.ReactNode;
	id?: string;
	name?: string;
	disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
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
						"text-sm font-medium leading-none text-foreground ml-1 transition-opacity",
						disabled && "cursor-not-allowed opacity-50",
					)}
				>
					{label}
					{required ? <span className="text-destructive ml-1">*</span> : null}
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

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">,
		BaseFieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, required, className = "", ...props }, ref) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);
		const [_isFocused, setIsFocused] = useState(false);

		// We extract onDrag and other conflicting drag props since Framer Motion's types conflict with React's native types.
		const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...restProps } = props;

		return (
			<FormField id={id} label={label} error={error} required={required} disabled={props.disabled}>
				<motion.div
					className="relative isolate group"
					whileTap={props.disabled ? undefined : { scale: 0.98 }}
				>
					<motion.input
						{...restProps}
						id={id}
						ref={ref}
						onFocus={(e) => {
							setIsFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setIsFocused(false);
							props.onBlur?.(e);
						}}
						onDragCapture={onDrag as any} // Fallback to avoid dropping the handler completely
						onDragStartCapture={onDragStart as any}
						onDragEndCapture={onDragEnd as any}
						onAnimationStartCapture={onAnimationStart as any}
						className={cn(inputBaseStyles, hasError && errorStyles, className)}
						aria-invalid={hasError || undefined}
						aria-describedby={hasError ? `${id}-error` : undefined}
						whileFocus={props.disabled ? undefined : { scale: 1.02 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
					/>
					{hasError && (
						<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-destructive pointer-events-none motion-safe:animate-[fadeIn_160ms_ease-out] z-20">
							<XCircle size={16} />
						</span>
					)}
				</motion.div>
			</FormField>
		);
	},
);

Input.displayName = "Input";

export interface TextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">,
		BaseFieldProps {
	showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ label, error, required, value, showCount = false, className = "", ...props }, ref) => {
		const internalId = useId();
		const id = props.id || internalId;
		const hasError = Boolean(error);
		const [_isFocused, setIsFocused] = useState(false);

		const currentLength = String(value || "").length;
		const maxLength = props.maxLength;
		const countId = `${id}-count`;

		const describedBy = [
			hasError ? `${id}-error` : undefined,
			showCount && maxLength ? countId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...restProps } = props;

		return (
			<FormField id={id} label={label} error={error} required={required} disabled={props.disabled}>
				<motion.div
					className="relative isolate group"
					whileTap={props.disabled ? undefined : { scale: 0.98 }}
				>
					<motion.textarea
						{...restProps}
						id={id}
						ref={ref}
						value={value}
						onFocus={(e) => {
							setIsFocused(true);
							props.onFocus?.(e);
						}}
						onBlur={(e) => {
							setIsFocused(false);
							props.onBlur?.(e);
						}}
						onDragCapture={onDrag as any}
						onDragStartCapture={onDragStart as any}
						onDragEndCapture={onDragEnd as any}
						onAnimationStartCapture={onAnimationStart as any}
						className={cn(
							inputBaseStyles,
							"min-h-[80px] py-4 rounded-3xl",
							hasError && errorStyles,
							className,
						)}
						aria-invalid={hasError || undefined}
						aria-describedby={describedBy || undefined}
						whileFocus={props.disabled ? undefined : { scale: 1.02 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
					/>
					{hasError && (
						<span className="absolute right-3.5 top-3 text-destructive pointer-events-none motion-safe:animate-[fadeIn_160ms_ease-out] z-20">
							<XCircle size={16} />
						</span>
					)}
					{showCount && maxLength && (
						<div
							id={countId}
							className={cn(
								"absolute bottom-3 right-3 text-xs z-20 transition-colors",
								currentLength >= maxLength
									? "text-destructive font-medium"
									: "text-muted-foreground",
							)}
						>
							{currentLength}/{maxLength}
						</div>
					)}
				</motion.div>
			</FormField>
		);
	},
);

Textarea.displayName = "Textarea";
