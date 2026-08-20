import { useQuery } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNameAdminActions } from "@/shared/api/names/hooks/useNameAdminActions";
import useAppStore from "@/store/appStore";
import { useAdminDashboard } from "./useAdminDashboard";

// Mock dependencies
vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useQuery: vi.fn(),
	};
});

vi.mock("@/shared/api/names/hooks/useNameAdminActions", () => ({
	useNameAdminActions: vi.fn(),
}));

vi.mock("@/store/appStore", () => ({
	default: vi.fn(),
}));

vi.mock("@/shared/services/supabase/statsService", () => ({
	statsAPI: {
		getSiteStats: vi.fn(),
	},
}));

describe("useAdminDashboard", () => {
	const mockAdminActions = {
		batchUpdateLocked: vi.fn(),
		batchUpdateVisibility: vi.fn(),
		deleteName: vi.fn(),
		toggleHidden: vi.fn(),
		toggleLocked: vi.fn(),
		uploadImage: vi.fn(),
	};

	const mockUser = {
		name: "Test Admin",
		role: "admin",
	};

	beforeEach(() => {
		vi.clearAllMocks();

		(useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
			(selector) => selector({ user: mockUser }),
		);

		(useNameAdminActions as ReturnType<typeof vi.fn>).mockReturnValue(
			mockAdminActions,
		);

		(useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
			data: null,
			isPending: false,
			refetch: vi.fn(),
		});

		window.confirm = vi.fn(() => true);
	});

	it("initializes with default state", () => {
		const { result } = renderHook(() => useAdminDashboard());

		expect(result.current.activeTab).toBe("overview");
		expect(result.current.searchTerm).toBe("");
		expect(result.current.filterStatus).toBe("all");
		expect(result.current.selectedNames).toBeInstanceOf(Set);
		expect(result.current.selectedNames.size).toBe(0);
		expect(result.current.isLoading).toBe(false);
	});

	it("handles selection changes", () => {
		const { result } = renderHook(() => useAdminDashboard());

		act(() => {
			result.current.handleSelectionChange("id1", true);
		});
		expect(result.current.selectedNames.has("id1")).toBe(true);

		act(() => {
			result.current.handleSelectionChange("id2", true);
		});
		expect(result.current.selectedNames.has("id1")).toBe(true);
		expect(result.current.selectedNames.has("id2")).toBe(true);

		act(() => {
			result.current.handleSelectionChange("id1", false);
		});
		expect(result.current.selectedNames.has("id1")).toBe(false);
		expect(result.current.selectedNames.has("id2")).toBe(true);
	});

	it("clears selection", () => {
		const { result } = renderHook(() => useAdminDashboard());

		act(() => {
			result.current.handleSelectionChange("id1", true);
			result.current.handleSelectionChange("id2", true);
		});
		expect(result.current.selectedNames.size).toBe(2);

		act(() => {
			result.current.handleClearSelection();
		});
		expect(result.current.selectedNames.size).toBe(0);
	});

	it("handles bulk actions correctly", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		// No selection -> should not call API
		await act(async () => {
			await result.current.handleBulkAction("hide");
		});
		expect(mockAdminActions.batchUpdateVisibility).not.toHaveBeenCalled();

		// Make selections
		act(() => {
			result.current.handleSelectionChange("id1", true);
			result.current.handleSelectionChange("id2", true);
		});

		// Hide action
		await act(async () => {
			await result.current.handleBulkAction("hide");
		});
		expect(mockAdminActions.batchUpdateVisibility).toHaveBeenCalledWith({
			nameIds: ["id1", "id2"],
			isHidden: true,
		});
		expect(result.current.selectedNames.size).toBe(0); // Should clear selection

		// Unhide action
		act(() => {
			result.current.handleSelectionChange("id3", true);
		});
		await act(async () => {
			await result.current.handleBulkAction("unhide");
		});
		expect(mockAdminActions.batchUpdateVisibility).toHaveBeenCalledWith({
			nameIds: ["id3"],
			isHidden: false,
		});

		// Lock action
		act(() => {
			result.current.handleSelectionChange("id4", true);
		});
		await act(async () => {
			await result.current.handleBulkAction("lock");
		});
		expect(mockAdminActions.batchUpdateLocked).toHaveBeenCalledWith({
			nameIds: ["id4"],
			isLocked: true,
		});

		// Unlock action
		act(() => {
			result.current.handleSelectionChange("id5", true);
		});
		await act(async () => {
			await result.current.handleBulkAction("unlock");
		});
		expect(mockAdminActions.batchUpdateLocked).toHaveBeenCalledWith({
			nameIds: ["id5"],
			isLocked: false,
		});
	});

	it("handles toggle hidden", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		await act(async () => {
			await result.current.handleToggleHidden("id1", true);
		});

		expect(mockAdminActions.toggleHidden).toHaveBeenCalledWith({
			nameId: "id1",
			isCurrentlyHidden: true,
		});
	});

	it("handles toggle locked", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		await act(async () => {
			await result.current.handleToggleLocked("id1", true);
		});

		expect(mockAdminActions.toggleLocked).toHaveBeenCalledWith({
			nameId: "id1",
			isCurrentlyLocked: true,
		});
	});

	it("handles soft delete with confirmation", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		await act(async () => {
			await result.current.handleSoftDelete("id1");
		});

		expect(window.confirm).toHaveBeenCalled();
		expect(mockAdminActions.deleteName).toHaveBeenCalledWith({ nameId: "id1" });
	});

	it("does not soft delete if confirmation is cancelled", async () => {
		window.confirm = vi.fn(() => false);
		const { result } = renderHook(() => useAdminDashboard());

		await act(async () => {
			await result.current.handleSoftDelete("id1");
		});

		expect(window.confirm).toHaveBeenCalled();
		expect(mockAdminActions.deleteName).not.toHaveBeenCalled();
	});

	it("handles filter changes correctly", () => {
		const { result } = renderHook(() => useAdminDashboard());

		// Assuming FILTER_OPTIONS has 'hidden'
		act(() => {
			result.current.handleFilterChange({
				target: { value: "hidden" },
			} as unknown as React.ChangeEvent<HTMLSelectElement>);
		});

		expect(result.current.filterStatus).toBe("hidden");
	});

	it("handles refresh correctly", async () => {
		const refetch = vi.fn().mockResolvedValue(true);
		(useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
			data: null,
			isPending: false,
			refetch,
		});

		const { result } = renderHook(() => useAdminDashboard());

		act(() => {
			result.current.handleRefresh();
		});

		// Check that refetch was called
		expect(refetch).toHaveBeenCalledTimes(2);
	});

	it("handles image upload", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		const file = new File(["dummy content"], "test.png", { type: "image/png" });
		const event = {
			target: {
				files: [file],
			},
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		await act(async () => {
			await result.current.handleImageUpload(event);
		});

		expect(mockAdminActions.uploadImage).toHaveBeenCalledWith(file);
	});

	it("ignores image upload if no file is selected", async () => {
		const { result } = renderHook(() => useAdminDashboard());

		const event = {
			target: {
				files: [],
			},
		} as unknown as React.ChangeEvent<HTMLInputElement>;

		await act(async () => {
			await result.current.handleImageUpload(event);
		});

		expect(mockAdminActions.uploadImage).not.toHaveBeenCalled();
	});
});
