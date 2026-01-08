import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

interface FormOptions<T extends z.ZodRawShape> {
	schema: z.ZodObject<T>;
	initialValues: z.infer<z.ZodObject<T>>;
	onSubmit: (values: z.infer<z.ZodObject<T>>) => Promise<void> | void;
}

export function useValidatedForm<T extends z.ZodRawShape>({
	schema,
	initialValues,
	onSubmit,
}: FormOptions<T>) {
	const {
		handleSubmit: rshHandleSubmit,
		formState: { errors, touchedFields, isSubmitting, isValid },
		setValue,
		trigger,
		watch,
		reset,
	} = useForm({
		resolver: zodResolver(schema),
		defaultValues: initialValues as any,
		mode: "onChange",
	});

	const values = watch();

	// Backward compatibility wrapper for handleChange
	const handleChange = useCallback(
		(name: keyof T, value: unknown) => {
			setValue(name as any, value, {
				shouldValidate: true,
				shouldDirty: true,
				shouldTouch: true,
			});
		},
		[setValue],
	);

	// Backward compatibility wrapper for handleBlur
	const handleBlur = useCallback(
		(name: keyof T) => {
			trigger(name as any);
		},
		[trigger],
	);

	// Wrapped onSubmit to match expected signature
	const handleFormSubmit = rshHandleSubmit(async (data) => {
		await onSubmit(data);
	});

	const setValues = useCallback(
		(newValues: Partial<z.infer<z.ZodObject<T>>>) => {
			Object.entries(newValues).forEach(([key, val]) => {
				setValue(key as any, val);
			});
		},
		[setValue],
	);

	// Map RHF errors to simple string map for backward compatibility
	const formattedErrors = Object.keys(errors).reduce(
		(acc, key) => {
			const error = errors[key as keyof T];
			if (error && typeof error === "object" && "message" in error) {
				acc[key as keyof T] = error.message as string;
			}
			return acc;
		},
		{} as Partial<Record<keyof T, string>>,
	);

	return {
		values,
		errors: formattedErrors,
		touched: touchedFields as Partial<Record<keyof T, boolean>>,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit: (e?: React.FormEvent) => {
			if (e) {
				e.preventDefault();
			}
			return handleFormSubmit(e);
		},
		reset,
		setValues,
	};
}
