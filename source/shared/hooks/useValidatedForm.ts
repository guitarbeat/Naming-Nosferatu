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
	type FormValues = z.infer<z.ZodObject<T>>;

	const {
		handleSubmit: rshHandleSubmit,
		formState: { errors, touchedFields, isSubmitting, isValid },
		setValue,
		trigger,
		watch,
		reset,
	} = useForm<FormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: zodResolver type mismatch with react-hook-form generics
		resolver: zodResolver(schema) as any,
		// biome-ignore lint/suspicious/noExplicitAny: defaultValues type mismatch with react-hook-form generics
		defaultValues: initialValues as any,
		mode: "onChange",
	});

	const values = watch();

	// Backward compatibility wrapper for handleChange
	const handleChange = useCallback(
		(name: keyof T, value: unknown) => {
			// biome-ignore lint/suspicious/noExplicitAny: setValue requires complex path types from react-hook-form
			setValue(name as any, value as any, {
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
			// biome-ignore lint/suspicious/noExplicitAny: trigger requires complex path types from react-hook-form
			trigger(name as any);
		},
		[trigger],
	);

	// Wrapped onSubmit to match expected signature
	const handleFormSubmit = rshHandleSubmit(async (data) => {
		await onSubmit(data as FormValues);
	});

	const setValues = useCallback(
		(newValues: Partial<FormValues>) => {
			Object.entries(newValues).forEach(([key, val]) => {
				// biome-ignore lint/suspicious/noExplicitAny: setValue requires complex path types from react-hook-form
				setValue(key as any, val as any);
			});
		},
		[setValue],
	);

	// Map RHF errors to simple string map for backward compatibility
	const formattedErrors = Object.keys(errors).reduce(
		(acc, key) => {
			const error = errors[key as keyof typeof errors];
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
