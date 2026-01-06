import { useCallback, useMemo, useState } from "react";
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
	const [values, setValues] = useState<z.infer<z.ZodObject<T>>>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateField = useCallback(
		(name: keyof T, value: unknown) => {
			const fieldSchema = schema.shape[name] as unknown as z.ZodTypeAny;
			if (!fieldSchema) return;

			const result = fieldSchema.safeParse(value);
			if (result.success) {
				setErrors((prev) => {
					const next = { ...prev };
					delete next[name];
					return next;
				});
				return true;
			} else {
				setErrors((prev) => ({
					...prev,
					[name]: result.error.issues[0]?.message || "Invalid input",
				}));
				return false;
			}
		},
		[schema],
	);

	const handleChange = useCallback(
		(name: keyof T, value: unknown) => {
			setValues((prev) => ({ ...prev, [name]: value }));
			if (touched[name]) {
				validateField(name, value);
			}
		},
		[touched, validateField],
	);

	const handleBlur = useCallback(
		(name: keyof T) => {
			setTouched((prev) => ({ ...prev, [name]: true }));
			validateField(name, (values as Record<string, unknown>)[name as string]);
		},
		[values, validateField],
	);

	const isValid = useMemo(() => {
		const result = schema.safeParse(values);
		return result.success;
	}, [schema, values]);

	const handleSubmit = useCallback(
		async (e?: React.FormEvent) => {
			e?.preventDefault();

			// Mark all as touched
			const allTouched = Object.keys(schema.shape).reduce(
				(acc, key) => {
					acc[key as keyof T] = true;
					return acc;
				},
				{} as Partial<Record<keyof T, boolean>>,
			);
			setTouched(allTouched);

			const result = schema.safeParse(values);
			if (!result.success) {
				const newErrors: Partial<Record<keyof T, string>> = {};
				result.error.issues.forEach((err) => {
					if (err.path[0]) {
						newErrors[err.path[0] as keyof T] = err.message;
					}
				});
				setErrors(newErrors);
				return;
			}

			try {
				setIsSubmitting(true);
				await onSubmit(result.data);
			} finally {
				setIsSubmitting(false);
			}
		},
		[schema, values, onSubmit],
	);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
		setIsSubmitting(false);
	}, [initialValues]);

	return {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		setValues,
	};
}
