import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { Toast, type ToastProps } from "../components/Toast";

interface ToastContextValue {
	showToast: (props: Omit<ToastProps, "onClose">) => void;
	hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
};

interface ToastProviderProps {
	children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [currentToast, setCurrentToast] = useState<Omit<
		ToastProps,
		"onClose"
	> | null>(null);

	const showToast = useCallback((props: Omit<ToastProps, "onClose">) => {
		setCurrentToast(props);
	}, []);

	const hideToast = useCallback(() => {
		setCurrentToast(null);
	}, []);

	return (
		<ToastContext.Provider value={{ showToast, hideToast }}>
			{children}
			{currentToast && <Toast {...currentToast} onDismiss={hideToast} />}
		</ToastContext.Provider>
	);
};
