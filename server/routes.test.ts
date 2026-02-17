import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock Supabase
vi.mock("./db", () => {
	const mockBuilder = {
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		upsert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: { id: "1", name: "Test" }, error: null }),
		maybeSingle: vi.fn().mockResolvedValue({ data: { role: "user" }, error: null }),
		then: (resolve: any) => resolve({ data: {}, error: null }),
	};

	const mockSupabase = {
		from: vi.fn().mockReturnValue(mockBuilder),
	};

	return { supabase: mockSupabase };
});

// Import router after mocking
import { router } from "./routes";

const app = express();
app.use(express.json());
app.use(router);

describe("API Validation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/names", () => {
		it("should accept valid payload", async () => {
			const res = await request(app)
				.post("/api/names")
				.send({ name: "Valid Name", description: "Desc", status: "candidate" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("should reject empty name", async () => {
			const res = await request(app)
				.post("/api/names")
				.send({ name: "", description: "Desc" });

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toBeDefined();
		});

		it("should reject long name", async () => {
			const res = await request(app)
				.post("/api/names")
				.send({ name: "a".repeat(51), description: "Desc" });

			expect(res.status).toBe(400);
		});

		it("should reject long description", async () => {
			const res = await request(app)
				.post("/api/names")
				.send({ name: "Valid", description: "a".repeat(501) });

			expect(res.status).toBe(400);
		});

		it("should reject invalid status", async () => {
			const res = await request(app)
				.post("/api/names")
				.send({ name: "Valid", status: "invalid_status" });

			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/users", () => {
		it("should accept valid payload", async () => {
			const res = await request(app)
				.post("/api/users")
				.send({ userName: "ValidUser" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("should reject empty userName", async () => {
			const res = await request(app)
				.post("/api/users")
				.send({ userName: "" });

			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
		});

		it("should reject long userName", async () => {
			const res = await request(app)
				.post("/api/users")
				.send({ userName: "a".repeat(51) });

			expect(res.status).toBe(400);
		});
	});

	describe("POST /api/users/create", () => {
		it("should accept valid payload", async () => {
			const res = await request(app)
				.post("/api/users/create")
				.send({ userName: "ValidUserCreate" });

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("should reject invalid payload", async () => {
			const res = await request(app)
				.post("/api/users/create")
				.send({ userName: "" });

			expect(res.status).toBe(400);
		});
	});
});
