import { generateFunName, playSound } from "@utils";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { STORAGE_KEYS, VALIDATION } from "@/constants";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { isUserAdmin } from "./authService";

/* ==========================================================================
   HOOKS
   ========================================================================== */

const FALLBACK_CAT_FACT = "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

function useCatFact() {
	const [catFact, setCatFact] = useState<string | null>(null);

	useEffect(() => {
		const fetchCatFact = async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

			try {
				const response = await fetch(CAT_FACT_API_URL, { signal: controller.signal });
				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const catFactData = await response.json();
				if (catFactData && typeof catFactData.fact === "string") {
					setCatFact(catFactData.fact);
				}
			} catch (_error) {
				setCatFact(FALLBACK_CAT_FACT);
			}
		};
		fetchCatFact();
	}, []);

	return catFact;
}

const LoginFormSchema = z.object({
	name: z
		.string()
		.min(VALIDATION.MIN_USERNAME_LENGTH || 2, "Name must be at least 2 characters")
		.max(VALIDATION.MAX_USERNAME_LENGTH || 30, "Name must be under 30 characters")
		.regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ are allowed"),
});

export function useLoginController(onLogin: (name: string) => Promise<void> | void) {
	const [globalError, setGlobalError] = useState("");
	const catFact = useCatFact();

	const form = useValidatedForm<typeof LoginFormSchema.shape>({
		schema: LoginFormSchema,
		initialValues: { name: "" },
		onSubmit: async (values: z.infer<typeof LoginFormSchema>) => {
			try {
				setGlobalError("");
				await onLogin(values.name);
				playSound("level-up");
			} catch (err) {
				const error = err as Error;
				setGlobalError(error.message || "Unable to log in.");
				throw err;
			}
		},
	});

	const {
		values,
		errors,
		touched,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		setValues,
	} = form;

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleChange("name", e.target.value);
			if (globalError) {
				setGlobalError("");
			}
		},
		[handleChange, globalError],
	);

	// Auto-fill from storage
	useEffect(() => {
		try {
			const savedUser = localStorage.getItem(STORAGE_KEYS.USER_STORAGE);
			if (savedUser) {
				const parsed = JSON.parse(savedUser);
				const name = parsed?.state?.user?.name;
				if (name && !values.name) {
					setValues({ name });
				}
			}
		} catch {}
	}, [setValues, values.name]);

	const handleRandomName = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		const funName = generateFunName();
		setValues({ name: funName });
		if (globalError) {
			setGlobalError("");
		}
		playSound("surprise");
	}, [isSubmitting, globalError, setValues]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				void handleSubmit();
			}
		},
		[handleSubmit],
	);

	return {
		name: values.name,
		setName: (val: string) => setValues({ name: val }),
		isLoading: isSubmitting,
		error: errors.name || globalError,
		touched: touched.name,
		handleNameChange,
		handleBlur,
		handleSubmit,
		handleRandomName,
		handleKeyDown,
		clearError: () => setGlobalError(""),
		catFact,
	};
}

export function useAdminStatus(userName: string | null) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const check = async () => {
			if (!userName) {
				setIsAdmin(false);
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			try {
				const admin = await isUserAdmin(userName);
				setIsAdmin(admin);
			} catch {
				setIsAdmin(false);
			} finally {
				setIsLoading(false);
			}
		};
		check();
	}, [userName]);

	return { isAdmin, isLoading };
}
