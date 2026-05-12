import useAppStore from "@/store/appStore";

interface AppBootScreenProps {
	message?: string;
	visible?: boolean;
}

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible,
}: AppBootScreenProps) {
	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);
	const shouldRender = visible ?? isBootLoading;

	if (!shouldRender) {
		return null;
	}

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(39,135,153,0.18),transparent_40%),linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.94))]">
			<div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-8 py-7 text-center shadow-[0_24px_70px_rgba(2,8,18,0.35)] backdrop-blur-xl">
				<div className="relative h-12 w-12">
					<div className="absolute inset-0 rounded-full border-4 border-white/10" />
					<div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/60" />
				</div>
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
						Naming Nosferatu
					</p>
					<p className="text-sm font-medium text-white/75">{message}</p>
				</div>
			</div>
		</div>
	);
}
