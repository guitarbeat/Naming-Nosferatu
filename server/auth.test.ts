import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./auth";

describe("requireAdmin middleware", () => {
	const mockReq = (headers: Record<string, string> = {}) =>
		({
			headers,
		}) as any;

	const mockRes = () => {
		const res: any = {};
		res.status = vi.fn().mockReturnValue(res);
		res.json = vi.fn().mockReturnValue(res);
		return res;
	};

	const mockNext = vi.fn();

	beforeEach(() => {
		vi.resetModules();
		process.env.ADMIN_API_KEY = "test-secret-key";
	});

	afterEach(() => {
		vi.clearAllMocks();
		delete process.env.ADMIN_API_KEY;
	});

	it("should call next() if x-admin-key matches ADMIN_API_KEY", () => {
		const req = mockReq({ "x-admin-key": "test-secret-key" });
		const res = mockRes();

		requireAdmin(req, res, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should return 401 if x-admin-key is missing", () => {
		const req = mockReq({});
		const res = mockRes();

		requireAdmin(req, res, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
	});

	it("should return 401 if x-admin-key is incorrect", () => {
		const req = mockReq({ "x-admin-key": "wrong-key" });
		const res = mockRes();

		requireAdmin(req, res, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
	});

	it("should return 500 if ADMIN_API_KEY is not set", () => {
		delete process.env.ADMIN_API_KEY;
		const req = mockReq({ "x-admin-key": "some-key" });
		const res = mockRes();

		requireAdmin(req, res, mockNext);

		expect(mockNext).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Server configuration error" });
	});
});
