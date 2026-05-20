import { User } from "lucide-react";
import { Panel } from "./DashboardPrimitives";

interface ProfilePanelProps {
	userName: string;
	isAdmin: boolean;
	avatarUrl?: string;
}

export function ProfilePanel({ userName, isAdmin, avatarUrl }: ProfilePanelProps) {
	return (
		<Panel>
			<div className="flex items-center gap-4">
				{avatarUrl ? (
					<img
						src={avatarUrl}
						alt={userName}
						className="size-16 rounded-full border border-white/10 object-cover"
					/>
				) : (
					<div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary">
						<User size={22} />
					</div>
				)}
				<div className="min-w-0">
					<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65">
						Profile
					</p>
					<h2 className="mt-2 truncate text-2xl font-semibold text-foreground">{userName}</h2>
					<p className="mt-1 text-sm text-muted-foreground/75">
						{isAdmin ? "Administrator" : "Tournament participant"}
					</p>
				</div>
			</div>
		</Panel>
	);
}
