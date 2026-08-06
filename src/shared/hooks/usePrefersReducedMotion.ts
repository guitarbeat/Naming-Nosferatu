import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		setMatches(media.matches);
		const handleChange = () => setMatches(media.matches);
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);

	return matches;
}
