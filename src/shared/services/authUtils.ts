import useAppStore from "@/store/appStore";

export function assertAdmin(message = "Admin privileges required"): void {
	const user = useAppStore.getState().user;
	if (!user?.isAdmin) {
		throw new Error(message);
	}
}
