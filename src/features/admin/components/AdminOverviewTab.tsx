import type { ChangeEvent } from "react";

interface AdminOverviewTabProps {
	onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function AdminOverviewTab({ onImageUpload }: AdminOverviewTabProps) {
	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h3 className="text-lg font-semibold mb-2">Image Upload</h3>
					<input
						type="file"
						accept="image/*"
						onChange={onImageUpload}
						className="w-full p-2 bg-foreground/10 border border-border/20 rounded"
					/>
				</div>
				<div>
					<h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
					<p className="text-muted-foreground">Activity tracking coming soon...</p>
				</div>
			</div>
		</div>
	);
}
