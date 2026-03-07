import { useEffect, useState } from "react";
import { IS_BROWSER } from "./shared";

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (!IS_BROWSER) {
			return;
		}

		const media = window.matchMedia(query);
		setMatches(media.matches);

		const listener = () => setMatches(media.matches);
		media.addEventListener("change", listener);

		return () => media.removeEventListener("change", listener);
	}, [query]);

	return matches;
}
