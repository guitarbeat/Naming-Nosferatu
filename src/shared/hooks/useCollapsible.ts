import { useCallback, useRef, useState } from "react";
import { IS_BROWSER } from "./shared";

interface CollapsibleReturn {
	isCollapsed: boolean;
	toggle: () => void;
	collapse: () => void;
	expand: () => void;
	set: (value: boolean) => void;
}

export function useCollapsible(defaultValue = false, storageKey?: string): CollapsibleReturn {
	const [value, setValueRaw] = useState<boolean>(() => {
		if (storageKey && IS_BROWSER) {
			try {
				const raw = localStorage.getItem(storageKey);
				if (raw !== null) {
					return JSON.parse(raw) as boolean;
				}
			} catch {
				/* fall through */
			}
		}
		return defaultValue;
	});

	const valueRef = useRef(value);
	valueRef.current = value;

	const set = useCallback(
		(next: boolean) => {
			setValueRaw(next);
			if (storageKey && IS_BROWSER) {
				try {
					localStorage.setItem(storageKey, JSON.stringify(next));
				} catch {
					/* quota errors */
				}
			}
		},
		[storageKey],
	);

	const toggle = useCallback(() => set(!valueRef.current), [set]);
	const collapse = useCallback(() => set(true), [set]);
	const expand = useCallback(() => set(false), [set]);

	return { isCollapsed: value, toggle, collapse, expand, set };
}
