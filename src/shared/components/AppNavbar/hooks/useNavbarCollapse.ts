import { STORAGE_KEYS } from "../../../../core/constants";
import { useCollapsible } from "../../../../core/hooks/useStorage";

export function useNavbarCollapse(defaultCollapsed = false) {
	const { isCollapsed, toggleCollapsed } = useCollapsible(
		STORAGE_KEYS.NAVBAR_COLLAPSED,
		defaultCollapsed,
	);
	return { isCollapsed, toggle: toggleCollapsed };
}
