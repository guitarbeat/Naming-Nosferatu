/**
 * @module ProfileSection
 * @description Dedicated page section for user profile management (Login, Name, Avatar)
 */

import { LogOut, Pencil, User } from "lucide-react";
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
			<div className="w-full max-w-2xl mx-auto space-y-6">
				{/* Section Header - Only show when editing/logging in */}
				{isEditing && !user.isLoggedIn && (
					<div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
						<h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
							Consult the Spirits
						</h2>
						<p className="text-sm text-slate-400 max-w-md mx-auto">
							Enter your name to track your rankings and join the feline naming council
						</p>
					</div>
				)}

				<Card
					background="glass"
					shadow="xl"
					padding="xl"
					className="overflow-visible relative border-white/10 bg-black/60 backdrop-blur-3xl rounded-3xl"
				>
					{/* Subtle glow effect behind the card */}
					<div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 rounded-3xl blur-xl" />

					<div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center py-2">
						{/* Avatar Section with Glow */}
						<div className="relative group shrink-0">
							{/* Avatar glow effect */}
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full blur-xl animate-pulse" />
							<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-900/30 bg-neutral-900 transition-all duration-300">
								<img
									src={avatarSrc}
									alt="Profile"
									className="w-full h-full object-cover"
									onError={() => setAvatarSrc(CAT_IMAGES[0] ?? "")}
								/>
							</div>
						</div>

						{/* Content Section */}
						<div className="flex-1 w-full space-y-6">
							{isEditing ? (
								<div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
									<div className="space-y-2">
										<label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80 block">
											Designation
										</label>
										<div className="relative">
											<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
											<Input
												type="text"
												value={editedName}
												onChange={(e) => setEditedName(e.target.value)}
												placeholder="Who are you?"
												onKeyDown={(e) => e.key === "Enter" && handleSave()}
												className="text-lg font-semibold bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 h-14 rounded-2xl pl-12 pr-6 w-full transition-all duration-200"
												autoFocus={!user.isLoggedIn}
											/>
										</div>
									</div>
									<div className="flex gap-3 pt-1">
										{user.isLoggedIn && (
											<Button
												variant="secondary"
												onClick={() => setIsEditing(false)}
												className="flex-1 h-12 rounded-xl"
											>
												Cancel
											</Button>
										)}
										<Button
											variant="login"
											onClick={handleSave}
											disabled={isSaving || !editedName.trim()}
											loading={isSaving}
											className="flex-[2] h-12 bg-gradient-to-r from-purple-600 to-indigo-600 border-none shadow-xl shadow-purple-900/30 active:scale-[0.98] transition-all font-bold tracking-tight rounded-xl hover:shadow-2xl hover:shadow-purple-900/40"
										>
											{user.isLoggedIn ? "Save" : "Begin Journey"}
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
									<div className="flex items-center gap-4">
										<h3 className="text-3xl md:text-4xl font-black tracking-tight text-white">{user.name}</h3>
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="p-2.5 rounded-full bg-white/5 hover:bg-purple-500/20 text-white/50 hover:text-purple-300 transition-all duration-200 active:scale-90"
											aria-label="Edit name"
										>
											<Pencil size={16} />
										</button>
									</div>

									<div className="pt-4 border-t border-white/5">
										<Button
											variant="ghost"
											onClick={handleLogout}
											className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 group transition-all rounded-xl"
										>
											<LogOut
												size={16}
												className="mr-2 group-hover:-translate-x-1 transition-transform duration-200"
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
