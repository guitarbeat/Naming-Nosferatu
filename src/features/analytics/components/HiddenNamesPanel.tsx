import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { Eye, EyeOff } from "@/shared/lib/icons";
import { Panel, SectionHeader } from "./DashboardPrimitives";

interface HiddenName {
	id: string;
	name: string;
}

interface HiddenNamesPanelProps {
	isAdmin: boolean;
	showHiddenNames: boolean;
	toggleHiddenNames: () => void;
	hiddenNames: HiddenName[];
	handleUnhideName: (id: string) => void;
}

export function HiddenNamesPanel({
	isAdmin,
	showHiddenNames,
	toggleHiddenNames,
	hiddenNames,
	handleUnhideName,
}: HiddenNamesPanelProps) {
	if (!isAdmin) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={EyeOff}
				title="Hidden Names"
				subtitle="Hidden from the pool."
				action={
					<Button variant="outline" size="small" onClick={toggleHiddenNames}>
						{showHiddenNames ? "Hide List" : "Show List"}
					</Button>
				}
			/>
			{showHiddenNames ? (
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
					{hiddenNames.length > 0 ? (
						hiddenNames.map((name, index) => (
							<div
								key={name.id}
								className={`flex items-center justify-between gap-3 px-4 py-3 ${
									index < hiddenNames.length - 1 ? "border-b border-white/10" : ""
								}`}
							>
								<span className="text-sm font-medium text-foreground">{name.name}</span>
								<Button variant="ghost" size="small" onClick={() => handleUnhideName(name.id)}>
									<Eye size={14} />
									Unhide
								</Button>
							</div>
						))
					) : (
						<EmptyState variant="inline" title="No hidden names." />
					)}
				</div>
			) : (
				<EmptyState
					variant="box"
					title="Open the list to review and restore hidden names."
					className="border-dashed bg-black/10"
				/>
			)}
		</Panel>
	);
}
