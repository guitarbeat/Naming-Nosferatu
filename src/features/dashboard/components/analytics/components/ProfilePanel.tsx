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
				<div className="relative">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt={userName}
							className={`size-16 rounded-full object-cover ring-2 ring-primary/20 ${themeSurfaces.avatar}`}
						/>
					) : (
						<div
							className={`flex size-16 items-center justify-center rounded-full ring-2 ring-primary/20 text-primary ${themeSurfaces.avatar}`}
						>
							<User size={22} />
						</div>
					)}
					{isAdmin && (
						<div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 p-1">
							<div className="rounded-full bg-card p-0.5">
								<span className="text-xs font-bold">👑</span>
							</div>
						</div>
					)}
				</div>
				<div className="min-w-0">
					<p className={themeText.eyebrowWide}>Profile</p>
					<h2 className="mt-2 truncate text-2xl font-semibold text-foreground">{userName}</h2>
					<p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground/75">
						<span>{isAdmin ? "👤 Administrator" : "🎮 Tournament participant"}</span>
					</p>
				</div>
			</div>
		</Panel>
	);
}
