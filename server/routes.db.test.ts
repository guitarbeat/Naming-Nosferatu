// @vitest-environment node
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock requireAdmin to allow access
vi.mock("./auth", () => ({
	requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Hoist mocks to be available in vi.mock
const { dbMocks } = vi.hoisted(() => {
	// Chainable mocks for SELECT
	const limitMock = vi.fn().mockResolvedValue([]);
	const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
	const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock, limit: limitMock }); // where() can be followed by orderBy() or just await
	const fromMock = vi
		.fn()
		.mockReturnValue({ where: whereMock, orderBy: orderByMock, limit: limitMock });
	const selectMock = vi.fn().mockReturnValue({ from: fromMock });

	// Chainable mocks for INSERT
	const returningMock = vi.fn().mockResolvedValue([{ id: "123", name: "Test Cat" }]);
	const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
	const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

	// Chainable mocks for DELETE
	const deleteWhereMock = vi.fn().mockResolvedValue([]);
	const deleteMock = vi.fn().mockReturnValue({ where: deleteWhereMock });

	// Chainable mocks for UPDATE
	const updateWhereMock = vi.fn().mockResolvedValue([]);
	const updateSetMock = vi.fn().mockReturnValue({ where: updateWhereMock });
	const updateMock = vi.fn().mockReturnValue({ set: updateSetMock });

	return {
		dbMocks: {
			select: selectMock,
			from: fromMock,
			where: whereMock,
			orderBy: orderByMock,
			limit: limitMock,
			insert: insertMock,
			values: valuesMock,
			returning: returningMock,
			delete: deleteMock,
			deleteWhere: deleteWhereMock,
			update: updateMock,
			updateSet: updateSetMock,
			updateWhere: updateWhereMock,
		},
	};
});

vi.mock("./db", () => ({
	db: {
		select: dbMocks.select,
		insert: dbMocks.insert,
		delete: dbMocks.delete,
		update: dbMocks.update,
	},
}));

// Import router AFTER mocking
import { router } from "./routes";

const app = express();
app.use(express.json());
app.use(router);

describe("Server Routes (DB Mode)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset default behaviors
		dbMocks.limit.mockResolvedValue([]);
		dbMocks.returning.mockResolvedValue([]);
		dbMocks.deleteWhere.mockResolvedValue([]);
		dbMocks.updateWhere.mockResolvedValue([]);
	});

	describe("GET /api/names", () => {
		it("should fetch names from DB with correct chaining", async () => {
			const mockNames = [
				{ id: "1", name: "Cat 1", isActive: true, avgRating: 1600 },
				{ id: "2", name: "Cat 2", isActive: true, avgRating: 1500 },
			];
			dbMocks.limit.mockResolvedValue(mockNames);

			const res = await request(app).get("/api/names");

			expect(res.status).toBe(200);
			expect(res.body).toEqual(mockNames);

			expect(dbMocks.select).toHaveBeenCalled();
			expect(dbMocks.from).toHaveBeenCalled();
			expect(dbMocks.where).toHaveBeenCalled();
			expect(dbMocks.orderBy).toHaveBeenCalled();
			expect(dbMocks.limit).toHaveBeenCalledWith(1000);
		});
	});

	describe("POST /api/names", () => {
		it("should insert a new name into DB", async () => {
			const newName = { name: "New Cat", description: "Desc" };
			const insertedCat = { ...newName, id: "123", status: "candidate" };
			dbMocks.returning.mockResolvedValue([insertedCat]);

			const res = await request(app).post("/api/names").send(newName);

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data).toEqual(insertedCat);

			expect(dbMocks.insert).toHaveBeenCalled();
			expect(dbMocks.values).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "New Cat",
					description: "Desc",
				}),
			);
			expect(dbMocks.returning).toHaveBeenCalled();
		});

		it("should handle validation errors", async () => {
			const res = await request(app).post("/api/names").send({}); // Missing name
			expect(res.status).toBe(400);
			expect(dbMocks.insert).not.toHaveBeenCalled();
		});
	});

	describe("DELETE /api/names/:id", () => {
		it("should delete name from DB", async () => {
			const res = await request(app).delete("/api/names/123");

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);

			expect(dbMocks.delete).toHaveBeenCalled();
			expect(dbMocks.deleteWhere).toHaveBeenCalled();
		});
	});

	describe("POST /api/ratings", () => {
		it("should insert ratings in a single batch", async () => {
			const ratings = [
				{ name: "id1", rating: 1500, wins: 1 },
				{ name: "id2", rating: 1600, wins: 0 },
			];

			// We need to mock values() to return a promise-like or void for this case because
			// in routes.ts: await db.insert(catNameRatings).values(records);
			// It doesn't use .returning() or anything else.
			// But wait, my mock setup has `values()` returning an object with `returning()`.
			// And `values()` itself is not a promise.
			// Drizzle's `.values()` returns a QueryBuilder that is also a Promise (thenable).
			// So I need `valuesMock` to be awaitable OR return something awaitable.
			// In the previous test, it was:
			// const valuesMock = vi.fn().mockResolvedValue([]);
			// This means `await values(...)` works.
			// But if I want to support `.returning()`, I need it to return an object that HAS `.returning`.
			// AND is also awaitable?
			// Drizzle's types are complex.
			// Let's adjust the mock to handle both.

			// Actually, in `server/routes.ts`: `await db.insert(catNameRatings).values(records);`
			// It awaits the result of `values()`.
			// So `valuesMock` must return a Promise (or be a Promise).
			// BUT `POST /api/names` uses `.values(...).returning()`.
			// So `valuesMock` must return an object that has `.returning()` AND is awaitable?
			// Or I can make `.returning` a property of the Promise?

			// Simpler approach: Make `valuesMock` return an object that has a `then` method (Promise-like)
			// AND a `returning` method.

			const mockQuery = Promise.resolve([]) as any;
			mockQuery.returning = dbMocks.returning;
			dbMocks.values.mockReturnValue(mockQuery);

			const res = await request(app).post("/api/ratings").send({
				userName: "testuser",
				ratings,
			});

			expect(res.status).toBe(200);
			expect(dbMocks.insert).toHaveBeenCalledTimes(1);

			const firstCallArg = dbMocks.values.mock.calls[0][0];
			expect(Array.isArray(firstCallArg)).toBe(true);
			expect(firstCallArg.length).toBe(ratings.length);
		});
	});
});
