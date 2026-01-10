import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import TournamentMatch from "../TournamentMatch";

// Mock dependencies
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, className, onClick, ...props }: any) => (
			<div className={className} onClick={onClick} {...props}>
				{children}
			</div>
		),
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("../../../../shared/utils/soundManager", () => ({
	playSound: vi.fn(),
}));

vi.mock("../../hooks/tournamentComponentHooks", () => ({
	default: vi.fn(), // useMagneticPull
}));

vi.mock("../RippleContainer", () => ({
	RippleContainer: React.forwardRef(({ className }: any, ref: any) => {
		React.useImperativeHandle(ref, () => ({
			addRipple: () => {
				const el = document.createElement("div");
				el.setAttribute("data-testid", "ripple-effect");
				document.body.appendChild(el);
			},
		}));
		return <div data-testid="ripple-container" className={className} />;
	}),
}));

describe("TournamentMatch", () => {
	const defaultProps = {
		currentMatch: {
			left: { id: "1", name: "Cat 1" },
			right: { id: "2", name: "Cat 2" },
		},
		selectedOption: null,
		isProcessing: false,
		isTransitioning: false,
		onNameCardClick: vi.fn(),
		onVoteWithAnimation: vi.fn(),
		onVoteRetry: vi.fn(),
		onDismissError: vi.fn(),
		showCatPictures: false,
	};

	it("triggers ripple on click", async () => {
		render(<TournamentMatch {...defaultProps} />);

		const leftOrb = screen.getByRole("button", { name: "Select Cat 1" });
		expect(leftOrb).toBeTruthy(); // Removed toBeInTheDocument

		fireEvent.click(leftOrb); // Used fireEvent instead of userEvent

        // Check if our mocked RippleContainer was rendered
        // Note: getAllByTestId because it's rendered twice (once for left, once for right)
        const containers = screen.getAllByTestId("ripple-container");
        expect(containers.length).toBe(2);

		// In our mock, addRipple appends an element to body to verify imperative handle call
		expect(document.querySelector('[data-testid="ripple-effect"]')).toBeTruthy();
	});
});
