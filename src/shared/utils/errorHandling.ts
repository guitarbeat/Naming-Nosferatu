import { ErrorManager } from "../services/errorManager";

// Enhanced API client with error handling and retry logic
export class ApiClient {
	private baseURL: string;
	private defaultHeaders: Record<string, string>;

	constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
		this.baseURL = baseURL;
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...defaultHeaders,
		};
	}

	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {},
		context: string = "API Request",
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const config: RequestInit = {
			...options,
			headers: {
				...this.defaultHeaders,
				...options.headers,
			},
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			// Let ErrorManager handle the error formatting and logging
			const formattedError = ErrorManager.handleError(error, context, {
				url,
				method: config.method || "GET",
				status: (error as { status?: number }).status,
			});

			throw formattedError;
		}
	}

	// Simple API methods without resilient wrapper for now
	async get<T>(endpoint: string, context?: string): Promise<T> {
		return this.makeRequest<T>(
			endpoint,
			{ method: "GET" },
			context || `GET ${endpoint}`,
		);
	}

	async post<T>(endpoint: string, data: unknown, context?: string): Promise<T> {
		return this.makeRequest<T>(
			endpoint,
			{
				method: "POST",
				body: JSON.stringify(data),
			},
			context || `POST ${endpoint}`,
		);
	}

	async put<T>(endpoint: string, data: unknown, context?: string): Promise<T> {
		return this.makeRequest<T>(
			endpoint,
			{
				method: "PUT",
				body: JSON.stringify(data),
			},
			context || `PUT ${endpoint}`,
		);
	}

	async delete<T>(endpoint: string, context?: string): Promise<T> {
		return this.makeRequest<T>(
			endpoint,
			{ method: "DELETE" },
			context || `DELETE ${endpoint}`,
		);
	}
}

// Validation utilities with error handling
export const validateInput = (
	value: unknown,
	rules: ValidationRule[],
): ValidationResult => {
	const errors: string[] = [];

	for (const rule of rules) {
		try {
			if (!rule.validator(value)) {
				errors.push(rule.message);
			}
		} catch (error) {
			ErrorManager.handleError(error, "Input Validation", {
				rule: rule.name,
				value: typeof value === "object" ? JSON.stringify(value) : value,
			});
			errors.push("Validation error occurred");
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

// Common validation rules
export const validationRules = {
	required: (message = "This field is required"): ValidationRule => ({
		name: "required",
		validator: (value) => value != null && value !== "" && value !== undefined,
		message,
	}),

	minLength: (min: number, message?: string): ValidationRule => ({
		name: "minLength",
		validator: (value) => typeof value === "string" && value.length >= min,
		message: message || `Must be at least ${min} characters`,
	}),

	maxLength: (max: number, message?: string): ValidationRule => ({
		name: "maxLength",
		validator: (value) => typeof value === "string" && value.length <= max,
		message: message || `Must be no more than ${max} characters`,
	}),

	email: (message = "Please enter a valid email address"): ValidationRule => ({
		name: "email",
		validator: (value) => {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return typeof value === "string" && emailRegex.test(value);
		},
		message,
	}),
};

// Types
interface ValidationRule {
	name: string;
	validator: (value: unknown) => boolean;
	message: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

// Graceful degradation utilities
export const gracefulDegradation = {
	// Fallback for when features aren't available
	withFallback: <T>(
		primaryFn: () => T,
		fallbackFn: () => T,
		context: string,
	): T => {
		try {
			return primaryFn();
		} catch (error) {
			ErrorManager.handleError(error, `${context} - Using Fallback`, {
				degraded: true,
			});
			return fallbackFn();
		}
	},

	// Check if a feature is supported
	isSupported: (feature: string): boolean => {
		try {
			switch (feature) {
				case "localStorage":
					return typeof Storage !== "undefined" && !!window.localStorage;
				case "serviceWorker":
					return "serviceWorker" in navigator;
				case "webGL":
					return !!window.WebGLRenderingContext;
				case "geolocation":
					return "geolocation" in navigator;
				default:
					return false;
			}
		} catch {
			return false;
		}
	},

	// Safe storage operations
	storage: {
		get: (key: string, fallback: unknown = null) =>
			gracefulDegradation.withFallback(
				() => JSON.parse(localStorage.getItem(key) || "null"),
				() => fallback,
				"LocalStorage Get",
			),

		set: (key: string, value: unknown) =>
			gracefulDegradation.withFallback(
				() => localStorage.setItem(key, JSON.stringify(value)),
				() => console.warn(`Could not save ${key} to localStorage`),
				"LocalStorage Set",
			),
	},
};
