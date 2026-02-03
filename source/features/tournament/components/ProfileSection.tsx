/**
 * @module ProfileSection
 * @description Dedicated page section for user profile management (Login, Name, Avatar)
 */

import { LogOut, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "@/layout/Button";
import { Card } from "@/layout/Card";
import { Input } from "@/layout/FormPrimitives";
import useAppStore from "@/store/appStore";
import { CAT_IMAGES } from "@/utils/constants";

interface ProfileSectionProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

export function ProfileSection({ onLogin }: ProfileSectionProps) {
	const { user, userActions } = useAppStore();
	const [editedName, setEditedName] = useState(user.name || "");
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || "https://placekitten.com/200/200");

	// Sync local state when user changes
	useEffect(() => {
		setEditedName(user.name || "");
		setAvatarSrc(user.avatarUrl || "https://placekitten.com/200/200");
		if (!user.isLoggedIn) {
			setIsEditing(true);
		}
	}, [user.name, user.isLoggedIn, user.avatarUrl]);

	const handleSave = async () => {
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		try {
			await onLogin(editedName.trim());
			setIsEditing(false);
		} catch (err) {
			console.error("Failed to update name:", err);
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = () => {
		userActions.logout();
		setIsEditing(true);
	};

	return (
		<section
			id="profile"
			className="min-h-[60vh] flex flex-col items-center justify-center p-4 py-20 scroll-mt-20 border-t border-white/5"
		>
			<div className="w-full max-w-2xl mx-auto">
				<Card
					background="glass"
					shadow="xl"
					padding="xl"
					className="overflow-visible relative border-white/10 bg-black/60 backdrop-blur-3xl rounded-3xl"
				>
					<div className="flex flex-col md:flex-row gap-8 items-center md:items-center py-2">
						{/* Avatar Section */}
						<div className="relative group shrink-0">
							<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 transition-all duration-300">
								<img
									src={avatarSrc}
									alt="Profile"
									className="w-full h-full object-cover"
									onError={() => setAvatarSrc(CAT_IMAGES[0] ?? "")}
								/>
							</div>
						</div>

						{/* Content Section */}
						<div className="flex-1 w-full space-y-8">
							{isEditing ? (
								<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
									<div className="space-y-3">
										<label className="text-sm font-medium text-white/70">Name</label>
										<Input
											type="text"
											value={editedName}
											onChange={(e) => setEditedName(e.target.value)}
											placeholder="Enter your name"
											onKeyDown={(e) => e.key === "Enter" && handleSave()}
											className="text-xl font-bold bg-white/5 border-white/10 focus:border-purple-500/50 h-14 rounded-2xl px-6"
											autoFocus={!user.isLoggedIn}
										/>
									</div>
									<div className="flex gap-4 pt-2">
										{user.isLoggedIn && (
											<Button
												variant="secondary"
												onClick={() => setIsEditing(false)}
												className="flex-1 h-12"
											>
												Cancel
											</Button>
										)}
										<Button
											variant="primary"
											onClick={handleSave}
											disabled={isSaving || !editedName.trim()}
											className="flex-[2] h-12 bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-xl shadow-purple-900/30 active:scale-95 transition-all font-bold tracking-tight rounded-xl"
										>
											{isSaving ? "Saving..." : "Save"}
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
									<div className="flex items-center gap-4">
										<h3 className="text-4xl font-black tracking-tight text-white">{user.name}</h3>
										<button
											onClick={() => setIsEditing(true)}
											className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-90"
											aria-label="Edit name"
										>
											<Pencil size={18} />
										</button>
									</div>

									<div className="pt-4 border-t border-white/5">
										<Button
											variant="ghost"
											onClick={handleLogout}
											className="text-red-400/60 hover:text-red-400 hover:bg-red-400/5 group transition-all"
										>
											<LogOut
												size={16}
												className="mr-2 group-hover:-translate-x-1 transition-transform"
											/>
											Logout
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				</Card>
			</div>
		</section>
	);
}
