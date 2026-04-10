import { useCallback, useRef, useState } from "react";
import { readStorageJson, writeStorageJson } from "@/shared/lib/storage";

const IS_BROWSER = typeof window !== "undefined";

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
			return readStorageJson<boolean>(storageKey, defaultValue);
		}

		return defaultValue;
	});

	const valueRef = useRef(value);
	valueRef.current = value;

	const set = useCallback(
		(next: boolean) => {
			setValueRaw(next);

			if (storageKey && IS_BROWSER) {
				writeStorageJson(storageKey, next);
			}
		},
		[storageKey],
	);

	const toggle = useCallback(() => set(!valueRef.current), [set]);
	const collapse = useCallback(() => set(true), [set]);
	const expand = useCallback(() => set(false), [set]);

	return { isCollapsed: value, toggle, collapse, expand, set };
}
