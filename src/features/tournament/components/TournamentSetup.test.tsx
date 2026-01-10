import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TournamentSetup from "./TournamentSetup";

// --- Mocks ---

// Mock Framer Motion
interface MotionProps {
	children?: React.ReactNode;
	[key: string]: any;
}

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: MotionProps) => <div {...props}>{children}</div>,
		h1: ({ children, ...props }: MotionProps) => <h1 {...props}>{children}</h1>,
		p: ({ children, ...props }: MotionProps) => <p {...props}>{children}</p>,
		button: ({ children, ...props }: MotionProps) => <button {...props}>{children}</button>,
	},
	AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock Hooks
const mockLoginController = {
	name: "",
	isLoading: false,
	error: null,
	handleNameChange: vi.fn(),
	handleSubmit: vi.fn(),
	handleRandomName: vi.fn(),
	handleKeyDown: vi.fn(),
	handleBlur: vi.fn(),
	catFact: "Cats are great",
	nameSchema: {},
	touched: {},
};

vi.mock("../../auth/hooks/authHooks", () => ({
	useLoginController: () => mockLoginController,
	useEyeTracking: () => ({ x: 0, y: 0 }),
	useCatFact: () => "Cats rule",
}));

const mockTournamentController = {
	currentView: "setup",
	isEditingName: false,
	tempName: "",
	setTempName: vi.fn(),
	showAllPhotos: false,
	setShowAllPhotos: vi.fn(),
	galleryImages: [],
	isAdmin: false,
	activeUser: "User",
	stats: {},
	selectionStats: {},
	handleNameSubmit: vi.fn(),
	toggleEditingName: vi.fn(),
	handleImageOpen: vi.fn(),
	handleImagesUploaded: vi.fn(),
	handleLightboxNavigate: vi.fn(),
	handleLightboxClose: vi.fn(),
	fetchSelectionStats: vi.fn(),
	showSuccess: vi.fn(),
	showError: vi.fn(),
	showToast: vi.fn(),
	handlersRef: { current: {} },
	ToastContainer: () => <div>ToastContainer</div>,
};

vi.mock("../hooks/useTournamentController", () => ({
	useTournamentController: () => mockTournamentController,
}));

// Mock Child Components
interface NameManagementViewProps {
	onStartTournament?: (names: any[]) => void;
	[key: string]: any;
}

interface ValidatedInputProps {
	[key: string]: any;
}

vi.mock("../../../shared/components/NameManagementView/NameManagementView", () => ({
	NameManagementView: ({ onStartTournament }: NameManagementViewProps) => (
		<button onClick={() => onStartTournament?.([])}>Start Tournament Utils</button>
	),
}));

vi.mock("../../../shared/components/ValidatedInput/ValidatedInput", () => ({
	ValidatedInput: (props: ValidatedInputProps) => (
		<input data-testid="validated-input" {...props} />
	),
}));

describe("TournamentSetup", () => {
	const defaultProps = {
		onLogin: vi.fn(),
		onStart: vi.fn(),
		userName: "TestUser",
		isLoggedIn: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockTournamentController.currentView = "setup";
	});

	it("renders login screen when not logged in", () => {
		render(<TournamentSetup {...defaultProps} isLoggedIn={false} />);
		expect(screen.getByText("Welcome, Purr-spective Judge!")).toBeTruthy();
		expect(screen.getByText("STEP INSIDE")).toBeTruthy();
	});

	it("renders setup screen when logged in", () => {
		render(<TournamentSetup {...defaultProps} isLoggedIn={true} />);
		expect(screen.getByText("TestUser")).toBeTruthy();
		expect(screen.getByText("Start Tournament Utils")).toBeTruthy();
	});

	it("triggers onLogin when login button is clicked", () => {
		// We mock the handleSubmit of the hook to call the passed onLogin prop in real code,
		// but here we are testing the COMPONENT's integration with the hook.
		// The component calls `handleLoginSubmit` from the hook.

		render(<TournamentSetup {...defaultProps} isLoggedIn={false} />);
		const loginBtn = screen.getByText("STEP INSIDE");
		fireEvent.click(loginBtn);

		expect(mockLoginController.handleSubmit).toHaveBeenCalled();
	});

	it("triggers onStart when NameManagementView starts tournament", () => {
		render(<TournamentSetup {...defaultProps} isLoggedIn={true} />);
		const startBtn = screen.getByText("Start Tournament Utils");
		fireEvent.click(startBtn);

		expect(defaultProps.onStart).toHaveBeenCalled();
	});

	it("displays cat facts correctly", () => {
		render(<TournamentSetup {...defaultProps} isLoggedIn={true} />);
		expect(screen.getByText("CATS RULE")).toBeTruthy(); // Hook returns "Cats rule", component uppercases it
	});
});
