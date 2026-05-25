import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Input, Textarea } from "./FormPrimitives";

describe("Input", () => {
	it("renders successfully with label", () => {
		render(<Input label="Name" placeholder="Enter name" />);
		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
	});

	it("applies disabled classes to label when disabled is true", () => {
		render(<Input label="Username" disabled={true} />);
		const label = screen.getByText("Username");
		expect(label).toHaveClass("cursor-not-allowed", "opacity-50");
	});

	it("renders validation success icon when showSuccess is true and input is valid", () => {
		const { container } = render(
			<Input
				label="Email"
				value="test@example.com"
				showSuccess={true}
				externalTouched={true}
				externalError={null}
				onChange={() => {}}
			/>
		);
		// Lucide SVG wrapper check
		const successIcon = container.querySelector(".text-chart-2 svg");
		expect(successIcon).toBeInTheDocument();
	});

	it("renders error state icon when error is present", () => {
		const { container } = render(
			<Input
				label="Password"
				value="short"
				externalTouched={true}
				externalError="Too short"
				onChange={() => {}}
			/>
		);
		// Lucide SVG wrapper check
		const errorIcon = container.querySelector(".text-destructive svg");
		expect(errorIcon).toBeInTheDocument();
		expect(screen.getByText("Too short")).toBeInTheDocument();
	});
});

describe("Textarea", () => {
	it("renders character count when showCount and maxLength are provided", () => {
		const TestComponent = () => {
			const [value, setValue] = React.useState("");
			return (
				<Textarea
					placeholder="test"
					maxLength={100}
					showCount={true}
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
			);
		};

		render(<TestComponent />);
		const textarea = screen.getByPlaceholderText("test");
		expect(textarea).toBeInTheDocument();

		// Check initial count
		expect(screen.getByText("0/100")).toBeInTheDocument();

		// Type some text
		fireEvent.change(textarea, { target: { value: "hello" } });
		expect(screen.getByText("5/100")).toBeInTheDocument();
	});

	it("does not render character count when showCount is false", () => {
		render(<Textarea placeholder="test" maxLength={100} />);
		const textarea = screen.getByPlaceholderText("test");
		expect(textarea).toBeInTheDocument();
		expect(screen.queryByText("0/100")).not.toBeInTheDocument();
	});

	it("does not render character count when maxLength is missing", () => {
		render(<Textarea placeholder="test" showCount={true} />);
		const textarea = screen.getByPlaceholderText("test");
		expect(textarea).toBeInTheDocument();
		// Check for absence of count pattern
		const countText = screen.queryByText(/\d+\/\d+/);
		expect(countText).not.toBeInTheDocument();
	});
});
