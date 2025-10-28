/**
 * @module componentUtils
 * @description Consolidated component utilities for common patterns and behaviors.
 * Reduces code duplication across components and provides consistent implementations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UI } from '../../core/constants';

/**
 * * Creates a standardized form state manager
 * @param {Object} initialValues - Initial form values
 * @param {Object} validators - Validation functions for each field
 * @returns {Object} Form state and handlers
 */
export function useFormState(initialValues = {}, validators = {}) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setValue = useCallback((field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const setFieldError = useCallback((field, error) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const setFieldTouched = useCallback((field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const validateField = useCallback((field, value) => {
        const validator = validators[field];
        if (!validator) return { success: true };

        const result = validator(value);
        if (!result.success) {
            setFieldError(field, result.error);
        } else {
            setFieldError(field, '');
        }
        return result;
    }, [validators, setFieldError]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;

        for (const [field, value] of Object.entries(values)) {
            const validator = validators[field];
            if (validator) {
                const result = validator(value);
                if (!result.success) {
                    newErrors[field] = result.error;
                    isValid = false;
                }
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [values, validators]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (onSubmit) => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const isValid = validateForm();
            if (isValid) {
                await onSubmit(values);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, validateForm, values]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setValue,
        setFieldError,
        setFieldTouched,
        validateField,
        validateForm,
        resetForm,
        handleSubmit
    };
}

/**
 * * Creates a standardized loading state manager
 * @param {boolean} initialLoading - Initial loading state
 * @returns {Object} Loading state and handlers
 */
export function useLoadingState(initialLoading = false) {
    const [isLoading, setIsLoading] = useState(initialLoading);
    const [loadingMessage, setLoadingMessage] = useState('');

    const startLoading = useCallback((message = 'Loading...') => {
        setIsLoading(true);
        setLoadingMessage(message);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    const withLoading = useCallback(async (asyncFn, message) => {
        startLoading(message);
        try {
            const result = await asyncFn();
            return result;
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    return {
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        withLoading
    };
}

/**
 * * Creates a standardized error state manager
 * @param {Object} initialError - Initial error state
 * @returns {Object} Error state and handlers
 */
export function useErrorState(initialError = null) {
    const [error, setError] = useState(initialError);
    const [errors, setErrors] = useState([]);

    const setSingleError = useCallback((error) => {
        setError(error);
        setErrors([]);
    }, []);

    const setMultipleErrors = useCallback((errorList) => {
        setError(null);
        setErrors(Array.isArray(errorList) ? errorList : [errorList]);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
        setErrors([]);
    }, []);

    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    const hasError = useMemo(() => {
        return error !== null || errors.length > 0;
    }, [error, errors]);

    return {
        error,
        errors,
        hasError,
        setSingleError,
        setMultipleErrors,
        clearError,
        clearErrors
    };
}

/**
 * * Creates a standardized async operation manager
 * @param {Function} asyncFn - Async function to manage
 * @param {Object} options - Options for the operation
 * @returns {Object} Operation state and handlers
 */
export function useAsyncOperation(asyncFn, options = {}) {
    const {
        immediate = false,
        onSuccess,
        onError,
        onFinally
    } = options;

    const [state, setState] = useState({
        data: null,
        error: null,
        isLoading: false,
        isSuccess: false,
        isError: false
    });

    const execute = useCallback(async (...args) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const data = await asyncFn(...args);
            setState({
                data,
                error: null,
                isLoading: false,
                isSuccess: true,
                isError: false
            });

            if (onSuccess) {
                onSuccess(data);
            }

            return data;
        } catch (error) {
            setState(prev => ({
                ...prev,
                error,
                isLoading: false,
                isSuccess: false,
                isError: true
            }));

            if (onError) {
                onError(error);
            }

            throw error;
        } finally {
            if (onFinally) {
                onFinally();
            }
        }
    }, [asyncFn, onSuccess, onError, onFinally]);

    const reset = useCallback(() => {
        setState({
            data: null,
            error: null,
            isLoading: false,
            isSuccess: false,
            isError: false
        });
    }, []);

    // Execute immediately if requested
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return {
        ...state,
        execute,
        reset
    };
}

/**
 * * Creates a standardized debounced value
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = UI.DEBOUNCE_DELAY) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * * Creates a standardized throttled callback
 * @param {Function} callback - Callback to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled callback
 */
export function useThrottle(callback, delay = UI.THROTTLE_DELAY) {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]);
}

/**
 * * Creates a standardized click outside handler
 * @param {Function} handler - Handler to call when clicking outside
 * @returns {Object} Ref to attach to element
 */
export function useClickOutside(handler) {
    const ref = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handler]);

    return ref;
}

/**
 * * Creates a standardized keyboard handler
 * @param {Object} keyHandlers - Object mapping keys to handlers
 * @param {Array} dependencies - Dependencies for the effect
 * @returns {void}
 */
export function useKeyboardHandler(keyHandlers, dependencies = []) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const handler = keyHandlers[event.key];
            if (handler) {
                event.preventDefault();
                handler(event);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [keyHandlers, dependencies]);
}

/**
 * * Creates a standardized focus manager
 * @param {Object} options - Focus management options
 * @returns {Object} Focus state and handlers
 */
export function useFocusManager(options = {}) {
    const { initialFocus = false, restoreFocus = true } = options;

    const [isFocused, setIsFocused] = useState(initialFocus);
    const previousActiveElement = useRef(null);

    const focus = useCallback(() => {
        if (restoreFocus && previousActiveElement.current) {
            previousActiveElement.current.focus();
        }
        setIsFocused(true);
    }, [restoreFocus]);

    const blur = useCallback(() => {
        if (restoreFocus) {
            previousActiveElement.current = document.activeElement;
        }
        setIsFocused(false);
    }, [restoreFocus]);

    const toggleFocus = useCallback(() => {
        if (isFocused) {
            blur();
        } else {
            focus();
        }
    }, [isFocused, focus, blur]);

    return {
        isFocused,
        focus,
        blur,
        toggleFocus
    };
}

/**
 * * Creates a standardized visibility manager
 * @param {Object} options - Visibility options
 * @returns {Object} Visibility state and handlers
 */
export function useVisibilityManager(options = {}) {
    const {
        initialVisible = false,
        threshold = 0.1,
        rootMargin = '0px'
    } = options;

    const [isVisible, setIsVisible] = useState(initialVisible);
    const [hasBeenVisible, setHasBeenVisible] = useState(initialVisible);
    const ref = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setIsVisible(visible);

                if (visible && !hasBeenVisible) {
                    setHasBeenVisible(true);
                }
            },
            { threshold, rootMargin }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, hasBeenVisible, ref]);

    return {
        isVisible,
        hasBeenVisible,
        ref
    };
}

/**
 * * Creates a standardized media query hook
 * @param {string} query - Media query string
 * @returns {boolean} Whether the query matches
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        const handleChange = (event) => setMatches(event.matches);

        mediaQuery.addEventListener('change', handleChange);
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [query]);

    return matches;
}

/**
 * * Creates a standardized previous value hook
 * @param {any} value - Value to track
 * @returns {any} Previous value
 */
export function usePrevious(value) {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * * Creates a standardized force update hook
 * @returns {Function} Force update function
 */
export function useForceUpdate() {
    const [, setTick] = useState(0);

    return useCallback(() => {
        setTick(tick => tick + 1);
    }, []);
}

export default {
    useFormState,
    useLoadingState,
    useErrorState,
    useAsyncOperation,
    useDebounce,
    useThrottle,
    useClickOutside,
    useKeyboardHandler,
    useFocusManager,
    useVisibilityManager,
    useLocalStorage,
    useMediaQuery,
    usePrevious,
    useForceUpdate
};
