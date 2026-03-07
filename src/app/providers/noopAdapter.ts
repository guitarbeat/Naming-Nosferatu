import type { AuthAdapter } from "./providerTypes";

export const noopAdapter: AuthAdapter = {
	getCurrentUser: async () => null,
	login: async () => false,
	logout: async () => {
		/* No-op: Auth not implemented */
	},
	register: async () => {
		/* No-op: Auth not implemented */
	},
	checkAdminStatus: async () => false,
};
