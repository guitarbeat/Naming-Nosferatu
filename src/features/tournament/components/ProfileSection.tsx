/**
 * @module ProfileSection
 * @description Dedicated page section for user profile management (Login, Name, Avatar)
 * Rendered as inline content so it sits directly on the page with the rest of the flow.
 */

import { useEffect, useState } from "react";
import { Button, Input, Section } from "@/shared/components/layout";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { LogOut, Pencil, User } from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

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
		<Section id="profile" variant="minimal" padding="comfortable" maxWidth="full">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-2 sm:px-6">
				{/* Section Header - Only show when editing/logging in */}
				{isEditing && !user.isLoggedIn && (
					<div className="animate-in slide-in-from-top-4 fade-in space-y-2 text-center duration-500">
						<h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
							Join the Council
						</h2>
						<p className="text-sm text-muted-foreground">Enter your name to track your rankings</p>
					</div>
				)}

				<div className="flex flex-col items-center gap-6 md:flex-row">
					{/* Avatar with glow */}
					<div className="relative shrink-0">
						<div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-xl" />
						<div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary/30 bg-muted shadow-lg shadow-primary/20 md:h-20 md:w-20">
							<img
								src={avatarSrc}
								alt="Profile"
								className="h-full w-full object-cover"
								onError={() => setAvatarSrc(CAT_IMAGES[0] ?? "")}
							/>
						</div>
					</div>

					{/* Content Section */}
					<div className="w-full flex-1">
						{isEditing ? (
							<div className="animate-in slide-in-from-right-4 fade-in space-y-4 duration-300">
								<div className="space-y-2">
									<label className="block text-sm font-medium text-foreground/80">Your Name</label>
									<div className="relative">
										<User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/50" />
										<Input
											type="text"
											value={editedName}
											onChange={(e) => setEditedName(e.target.value)}
											placeholder="Who are you?"
											onKeyDown={(e) => e.key === "Enter" && handleSave()}
											className="h-[50px] w-full pl-12 pr-4 font-medium backdrop-blur-sm"
											autoFocus={!user.isLoggedIn}
										/>
									</div>
								</div>
								<div className="flex gap-3">
									{user.isLoggedIn && (
										<Button
											type="button"
											variant="ghost"
											onClick={() => setIsEditing(false)}
											className="flex-1"
										>
											Cancel
										</Button>
									)}
									<Button
										type="submit"
										variant="glass"
										size="xl"
										onClick={handleSave}
										disabled={!editedName.trim() || isSaving}
										loading={isSaving}
										className="flex-[2]"
									>
										{user.isLoggedIn ? "Save" : "Begin Journey"}
									</Button>
								</div>
							</div>
						) : (
							<div className="animate-in slide-in-from-left-4 fade-in space-y-4 duration-300">
								<div className="flex items-center gap-3">
									<h3 className="text-2xl font-bold text-foreground md:text-3xl">{user.name}</h3>
									<button
										type="button"
										onClick={() => setIsEditing(true)}
										className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
										aria-label="Edit name"
									>
										<Pencil size={16} />
									</button>
								</div>
								<button
									type="button"
									onClick={handleLogout}
									className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
								>
									<LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
									Logout
								</button>
							</div>
						)}
					</div>
				</div>

				{!isEditing && (
					<p className="text-center text-sm font-medium text-muted-foreground">
						Your preferences are saved to track your cat name rankings.
					</p>
				)}
			</div>
		</Section>
	);
}
