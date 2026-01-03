import { useCallback, useEffect, useState } from "react";

const ANALYSIS_QUERY_PARAM = "analysis";

export const useAnalysisMode = () => {
	const [isAnalysisMode, setIsAnalysisMode] = useState(false);

	const checkAnalysisModeFromUrl = useCallback(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const isAnalysis = params.get(ANALYSIS_QUERY_PARAM) === "true";
		if (isAnalysis !== isAnalysisMode) {
			setIsAnalysisMode(isAnalysis);
		}
	}, [isAnalysisMode]);

	useEffect(() => {
		checkAnalysisModeFromUrl();
		window.addEventListener("popstate", checkAnalysisModeFromUrl);
		return () =>
			window.removeEventListener("popstate", checkAnalysisModeFromUrl);
	}, [checkAnalysisModeFromUrl]);

	return { isAnalysisMode, setIsAnalysisMode };
};

export const useToggleAnalysis = (
	isAnalysisMode: boolean,
	setIsAnalysisMode: (val: boolean) => void,
) => {
	const toggleAnalysis = useCallback(() => {
		const newMode = !isAnalysisMode;
		setIsAnalysisMode(newMode);

		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			if (newMode) {
				url.searchParams.set(ANALYSIS_QUERY_PARAM, "true");
			} else {
				url.searchParams.delete(ANALYSIS_QUERY_PARAM);
			}
			window.history.pushState({}, "", url.toString());
		}
	}, [isAnalysisMode, setIsAnalysisMode]);

	return toggleAnalysis;
};
