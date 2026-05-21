import { User } from "lucide-react";
import { themeSurfaces, themeText } from "@/shared/lib/themeClasses";
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
						className={`size-16 rounded-full object-cover ${themeSurfaces.avatar}`}
					/>
				) : (
					<div
						className={`flex size-16 items-center justify-center rounded-full text-primary ${themeSurfaces.avatar}`}
					>
						<User size={22} />
					</div>
				)}
				<div className="min-w-0">
					<p className={themeText.eyebrowWide}>
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
