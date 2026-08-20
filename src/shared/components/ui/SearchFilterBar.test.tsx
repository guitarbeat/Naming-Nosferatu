import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterBar } from "./SearchFilterBar";
import "@testing-library/jest-dom";

describe("SearchFilterBar", () => {
	it("renders clear button when searchTerm is not empty and clears it when clicked", () => {
		const onSearchTermChange = vi.fn();
		render(
			<SearchFilterBar
				searchTerm="Whiskers"
				onSearchTermChange={onSearchTermChange}
				filterStatus="all"
				filterOptions={[{ value: "all", label: "All" }]}
				onFilterChange={() => {}}
				onRefresh={() => {}}
			/>,
		);

		const clearButton = screen.getByRole("button", { name: "Clear search" });
		expect(clearButton).toBeInTheDocument();

		fireEvent.click(clearButton);
		expect(onSearchTermChange).toHaveBeenCalledWith("");
	});

	it("does not render clear button when searchTerm is empty", () => {
		render(
			<SearchFilterBar
				searchTerm=""
				onSearchTermChange={() => {}}
				filterStatus="all"
				filterOptions={[{ value: "all", label: "All" }]}
				onFilterChange={() => {}}
				onRefresh={() => {}}
			/>,
		);

		const clearButton = screen.queryByRole("button", { name: "Clear search" });
		expect(clearButton).not.toBeInTheDocument();
	});
});
