import { useState } from "react";

export function useForm<T>({ initialValues, onSubmit }: { initialValues: T, onSubmit: (values: T) => Promise<void> }) {
    const [values, setValues] = useState<T>(initialValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleChange = (key: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setGlobalError(null);
        setSuccessMessage(null);
        try {
            await onSubmit(values);
            setSuccessMessage("Success!");
        } catch (err: any) {
            setGlobalError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => setValues(initialValues);

    return { values, handleChange, handleSubmit, isSubmitting, globalError, successMessage, reset };
}
