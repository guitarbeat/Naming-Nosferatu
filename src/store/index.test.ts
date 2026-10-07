import { beforeEach, describe, expect, it } from "vitest";
import useAppStore from "./index";

describe("User Store Actions", () => {
	beforeEach(() => {
		useAppStore.getState().userActions.logout();
	});

	it("generates a secure user ID using UUID format upon login", () => {
		useAppStore.getState().userActions.login("TestUser");
		const user = useAppStore.getState().user;

		expect(user.isLoggedIn).toBe(true);
		expect(user.name).toBe("TestUser");
		expect(user.id).toMatch(
			/^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});
});
