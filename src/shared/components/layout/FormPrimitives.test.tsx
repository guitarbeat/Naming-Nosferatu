import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./FormPrimitives";

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
