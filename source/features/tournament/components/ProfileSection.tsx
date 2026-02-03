/**
 * @module ProfileSection
 * @description Dedicated page section for user profile management (Login, Name, Avatar)
 */

import { Camera, LogOut, Pencil } from "lucide-react";
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
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter mb-4">
						{user.isLoggedIn ? "Your Identity" : "Consult the Spirits"}
					</h2>
					<p className="text-slate-400">
						{user.isLoggedIn
							? "Manage your presence in the eternal tournament"
							: "Enter your name to track your rankings across the multiverses"}
					</p>
				</div>

				<Card
					background="glass"
					shadow="xl"
					padding="xl"
					className="overflow-visible relative border-white/10 bg-black/60 backdrop-blur-3xl rounded-3xl"
				>
					<div className="flex flex-col md:flex-row gap-8 items-center md:items-center py-2">
						{/* Avatar Section */}
						<div className="relative group shrink-0">
							<div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
							<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 group-hover:border-purple-500/50 transition-all duration-300">
								<img
									src={avatarSrc}
									alt="Profile"
									className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
									onError={() => setAvatarSrc(CAT_IMAGES[0] ?? "")}
								/>
								<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
									<Camera className="text-white w-8 h-8" />
								</div>
							</div>
							{user.isLoggedIn && (
								<div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-black animate-pulse shadow-lg shadow-green-500/20" />
							)}
						</div>

						{/* Content Section */}
						<div className="flex-1 w-full space-y-8">
							{isEditing ? (
								<div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
									<div className="space-y-3">
										<label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80 ml-1">
											Designation
										</label>
										<Input
											type="text"
											value={editedName}
											onChange={(e) => setEditedName(e.target.value)}
											placeholder="Who are you?"
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
											{isSaving
												? "Syncing..."
												: user.isLoggedIn
													? "Commit Changes"
													: "Begin Journey"}
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
