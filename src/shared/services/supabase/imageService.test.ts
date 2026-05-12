import { beforeEach, describe, expect, it, vi } from "vitest";
import { imagesAPI } from "./imageService";
import { withSupabase } from "./runtime";

vi.mock("./runtime", () => ({
	withSupabase: vi.fn(),
}));

describe("imagesAPI", () => {
	const mockedWithSupabase = vi.mocked(withSupabase);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("list", () => {
		it("calls client.storage.from('cat-images').list() and returns mapped names", async () => {
			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						list: vi.fn().mockResolvedValue({
							data: [{ name: "cat1.jpg" }, { name: "cat2.png" }],
							error: null,
						}),
					}),
				},
			};

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.list();

			expect(mockStorageClient.storage.from).toHaveBeenCalledWith("cat-images");
			expect(result).toEqual(["cat1.jpg", "cat2.png"]);
		});

		it("returns empty array and logs error if list fails", async () => {
			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						list: vi.fn().mockResolvedValue({
							data: null,
							error: new Error("List failed"),
						}),
					}),
				},
			};
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
				/* mock */
			});

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.list();

			expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to list images:", expect.any(Error));
			expect(result).toEqual([]);

			consoleErrorSpy.mockRestore();
		});

		it("returns fallback if withSupabase returns fallback", async () => {
			mockedWithSupabase.mockImplementation(async (_callback, fallback) => {
				return fallback;
			});

			const result = await imagesAPI.list();

			expect(result).toEqual([]);
		});
	});

	describe("upload", () => {
		it("uploads file and returns public URL", async () => {
			const mockFile = new File(["dummy content"], "my-cat.png", { type: "image/png" });
			Object.defineProperty(mockFile, "size", { value: 1024 });

			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						upload: vi.fn().mockResolvedValue({
							data: { path: "some-path" },
							error: null,
						}),
						getPublicUrl: vi.fn().mockReturnValue({
							data: { publicUrl: "https://example.com/cat-images/some-path" },
						}),
					}),
				},
			};

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.upload(mockFile, "testuser");

			expect(mockStorageClient.storage.from).toHaveBeenCalledWith("cat-images");
			expect(result).toEqual({
				path: "https://example.com/cat-images/some-path",
				error: null,
				success: true,
			});
		});

		it("fails if file size exceeds 5MB", async () => {
			const mockFile = new File([""], "large-cat.jpg", { type: "image/jpeg" });
			Object.defineProperty(mockFile, "size", { value: 6 * 1024 * 1024 }); // 6MB

			const result = await imagesAPI.upload(mockFile, "testuser");

			expect(result).toEqual({
				path: null,
				error: "File size exceeds 5MB limit",
				success: false,
			});
			expect(mockedWithSupabase).not.toHaveBeenCalled();
		});

		it("fails if file type is not allowed", async () => {
			const mockFile = new File([""], "cat.txt", { type: "text/plain" });
			Object.defineProperty(mockFile, "size", { value: 1024 });

			const result = await imagesAPI.upload(mockFile, "testuser");

			expect(result).toEqual({
				path: null,
				error: "Only JPEG, PNG, GIF, and WebP images are allowed",
				success: false,
			});
			expect(mockedWithSupabase).not.toHaveBeenCalled();
		});

		it("returns error if upload fails", async () => {
			const mockFile = new File(["dummy content"], "my-cat.png", { type: "image/png" });
			Object.defineProperty(mockFile, "size", { value: 1024 });

			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						upload: vi.fn().mockResolvedValue({
							data: null,
							error: new Error("Upload failed"),
						}),
					}),
				},
			};
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
				/* mock */
			});

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.upload(mockFile, "testuser");

			expect(consoleErrorSpy).toHaveBeenCalledWith("Upload failed:", expect.any(Error));
			expect(result).toEqual({
				path: null,
				error: "Upload failed",
				success: false,
			});

			consoleErrorSpy.mockRestore();
		});
	});

	describe("delete", () => {
		it("removes file and returns success", async () => {
			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						remove: vi.fn().mockResolvedValue({
							data: [{ name: "cat1.jpg" }],
							error: null,
						}),
					}),
				},
			};

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.delete("cat1.jpg");

			expect(mockStorageClient.storage.from).toHaveBeenCalledWith("cat-images");
			expect(result).toEqual({ success: true, error: null });
		});

		it("returns error if remove fails", async () => {
			const mockStorageClient = {
				storage: {
					from: vi.fn().mockReturnValue({
						remove: vi.fn().mockResolvedValue({
							data: null,
							error: new Error("Delete failed"),
						}),
					}),
				},
			};
			const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
				/* mock */
			});

			mockedWithSupabase.mockImplementation(async (callback, _fallback) => {
				return callback(mockStorageClient as any);
			});

			const result = await imagesAPI.delete("cat1.jpg");

			expect(consoleErrorSpy).toHaveBeenCalledWith("Delete failed:", expect.any(Error));
			expect(result).toEqual({ success: false, error: "Delete failed" });

			consoleErrorSpy.mockRestore();
		});
	});
});
