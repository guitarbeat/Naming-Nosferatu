import { useNavbarContext } from "../context/NavbarContext";
import { NavbarToggle } from "./NavbarToggle";

export const ModeToggles = ({ isMobile = false }: { isMobile?: boolean }) => {
	const { isAnalysisMode, toggleAnalysis, isCollapsed } = useNavbarContext();

	if (isCollapsed && !isMobile) return null;

	return (
		<div className="mode-toggles">
			<NavbarToggle
				isActive={isAnalysisMode}
				onToggle={toggleAnalysis}
				leftLabel="PLAY"
				rightLabel="ANALYSIS"
				ariaLabel="Toggle between Play and Analysis modes"
			/>
		</div>
	);
};
