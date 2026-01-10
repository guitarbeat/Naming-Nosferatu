import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProgressMilestone, TournamentFooter, TournamentHeader } from "./TournamentUI";

// Mock Framer Motion
// Framer Motion specific props that should not be passed to DOM
const FRAMER_MOTION_PROPS = new Set([
	"layout",
	"dragConstraints",
	"dragElastic",
	"whileHover",
	"whileTap",
	"initial",
	"animate",
	"exit",
	"variants",
	"transition",
	"drag",
	"dragDirectionLock",
	"dragMomentum",
	"dragPropagation",
	"dragSnapToOrigin",
	"layoutId",
	"layoutDependency",
	"onDrag",
	"onDragStart",
	"onDragEnd",
	"onHoverStart",
	"onHoverEnd",
	"onTap",
	"onTapStart",
	"onTapCancel",
]);

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	layout?: any;
	whileHover?: any;
	whileTap?: any;
	[key: string]: any;
}

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: MotionProps) => {
			// Filter out framer-motion specific props
			const domProps = Object.fromEntries(
				Object.entries(props).filter(([key]) => !FRAMER_MOTION_PROPS.has(key)),
			);
			return <div {...domProps}>{children}</div>;
		},
	},
	AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./KeyboardHelp", () => ({
	KeyboardHelp: () => <div>Keyboard Help Info</div>,
}));

vi.mock("../../../shared/components/Bracket", () => ({
	default: () => <div>Bracket Component</div>,
}));

describe("TournamentUI", () => {
	describe("TournamentHeader", () => {
		it("displays round and match info", () => {
			render(
				<TournamentHeader roundNumber={1} currentMatchNumber={5} totalMatches={10} progress={50} />,
			);
			expect(screen.getByText("Round 1")).toBeTruthy();
			expect(screen.getByText("Match 5 of 10")).toBeTruthy();
			expect(screen.getByText("50% Complete")).toBeTruthy();
		});
	});

	describe("ProgressMilestone", () => {
		it("shows milestone at 50%", () => {
			render(<ProgressMilestone progress={50} onDismiss={vi.fn()} />);
			expect(screen.getByText("Halfway there! 🎉")).toBeTruthy();
		});

		it("shows milestone at 80%", () => {
			render(<ProgressMilestone progress={80} onDismiss={vi.fn()} />);
			expect(screen.getByText("Almost done! 🚀")).toBeTruthy();
		});
	});

	describe("TournamentFooter", () => {
		const defaultProps = {
			showBracket: false,
			showKeyboardHelp: false,
			transformedMatches: [],
			onToggleBracket: vi.fn(),
			onToggleKeyboardHelp: vi.fn(),
		};

		it("toggles bracket view", () => {
			render(<TournamentFooter {...defaultProps} />);
			const btn = screen.getByText("Show Tournament History");
			fireEvent.click(btn);
			expect(defaultProps.onToggleBracket).toHaveBeenCalled();
		});

		it("shows bracket when active", () => {
			render(<TournamentFooter {...defaultProps} showBracket={true} />);
			expect(screen.getByText("Hide Tournament History")).toBeTruthy();
			expect(screen.getByText("Bracket Component")).toBeTruthy();
		});
	});
});
