interface AdminTabNavProps<TTab extends string> {
	activeTab: TTab;
	tabs: readonly { id: TTab; label: string }[];
	onTabChange: (tab: TTab) => void;
}

export function AdminTabNav<TTab extends string>({
	activeTab,
	tabs,
	onTabChange,
}: AdminTabNavProps<TTab>) {
	return (
		<div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border/10 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onTabChange(tab.id)}
					className={`px-3 sm:px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
						activeTab === tab.id
							? "text-foreground border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
