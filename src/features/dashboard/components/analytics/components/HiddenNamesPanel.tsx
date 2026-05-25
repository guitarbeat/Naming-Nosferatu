import { Eye, EyeOff } from "lucide-react";
import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { ListPanel, ListPanelRow, Panel, SectionHeader } from "./DashboardPrimitives";

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
				<ListPanel>
					{hiddenNames.length > 0 ? (
						hiddenNames.map((name, index) => (
							<ListPanelRow
								key={name.id}
								divided={index < hiddenNames.length - 1}
								className="justify-between"
							>
								<span className="text-sm font-medium text-foreground">{name.name}</span>
								<Button variant="ghost" size="small" onClick={() => handleUnhideName(name.id)}>
									<Eye size={14} />
									Unhide
								</Button>
							</ListPanelRow>
						))
					) : (
						<EmptyState variant="inline" title="No hidden names." />
					)}
				</ListPanel>
			) : (
				<EmptyState
					variant="box"
					title="Open the list to review and restore hidden names."
					className="border-dashed bg-muted/20"
				/>
			)}
		</Panel>
	);
}
