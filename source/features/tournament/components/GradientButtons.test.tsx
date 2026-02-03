import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NameSuggestion } from "./NameSuggestion";
import { ProfileSection } from "./ProfileSection";

// Hoist user mock so we can modify it
const mocks = vi.hoisted(() => ({
	user: { name: "TestUser", isLoggedIn: true, avatarUrl: "test.jpg" },
}));

// Mock dependencies
vi.mock("@/store/appStore", () => ({
	default: () => ({
		user: mocks.user,
		userActions: { logout: vi.fn() },
	}),
}));

vi.mock("@/hooks/useNames", () => ({
	useNameSuggestion: () => ({
		values: { name: "", description: "" },
		isSubmitting: false,
		handleChange: vi.fn(),
		handleSubmit: vi.fn(),
		globalError: "",
		successMessage: "",
		errors: {},
		touched: {},
		isValid: true,
		handleBlur: vi.fn(),
		reset: vi.fn(),
		setGlobalError: vi.fn(),
	}),
}));

vi.mock("@/utils/constants", () => ({
	CAT_IMAGES: ["cat.jpg"],
	VALIDATION: {
		MIN_CAT_NAME_LENGTH: 2,
		MAX_CAT_NAME_LENGTH: 50,
		MAX_DESCRIPTION_LENGTH: 500,
	},
}));

vi.mock("@/layout/LiquidGlass", () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/layout/Button", () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default: (props: any) => (
		<button
			data-testid="gradient-button"
			data-variant={props.variant}
			data-size={props.size}
			className={props.className}
		>
			{props.children}
		</button>
	),
}));

vi.mock("@/layout/FormPrimitives", () => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Input: (props: any) => <input {...props} />,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("lucide-react", () => ({
	LogOut: () => <svg />,
	Pencil: () => <svg />,
	User: () => <svg />,
	Loader2: () => <svg />,
}));

vi.mock("@/providers/ToastProvider", () => ({
	useToast: () => ({
		showSuccess: vi.fn(),
		showError: vi.fn(),
	}),
}));

describe("Gradient Buttons Consistency", () => {
	it("ProfileSection renders gradient button with consistent styling", () => {
		// Set user to logged out so the form with the button is rendered
		mocks.user.isLoggedIn = false;
		mocks.user.name = "";

		const html = renderToStaticMarkup(<ProfileSection onLogin={async () => true} />);

		// Check variant
		expect(html).toContain('data-variant="gradient"');

		// Check size - expecting 'xl'
		expect(html).toContain('data-size="xl"');
	});

	it("NameSuggestion (inline) renders gradient button with consistent styling", () => {
		const html = renderToStaticMarkup(<NameSuggestion variant="inline" />);

		// Check variant
		expect(html).toContain('data-variant="gradient"');

		// Check size - expecting 'xl' to match ProfileSection
		expect(html).toContain('data-size="xl"');
	});
});
