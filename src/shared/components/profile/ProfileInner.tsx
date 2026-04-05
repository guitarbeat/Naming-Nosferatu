import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/layout";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { LogOut, Pencil, User } from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

interface ProfileInnerProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

export function ProfileInner({ onLogin }: ProfileInnerProps) {
	const { user, userActions } = useAppStore();
	const defaultAvatar = CAT_IMAGES[0] ?? "";
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const [editedName, setEditedName] = useState(user.name || "");
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || defaultAvatar);
	const previousLoginStateRef = useRef(user.isLoggedIn);
	const previousEditingStateRef = useRef(isEditing);

	useEffect(() => {
		setEditedName(user.name || "");
		setAvatarSrc(user.avatarUrl || defaultAvatar);
	}, [defaultAvatar, user.name, user.avatarUrl]);

	useEffect(() => {
		const wasLoggedIn = previousLoginStateRef.current;
		if (!user.isLoggedIn) {
			setIsEditing(true);
		} else if (!wasLoggedIn) {
			setIsEditing(false);
		}
		previousLoginStateRef.current = user.isLoggedIn;
	}, [user.isLoggedIn]);

	useEffect(() => {
		const enteredEditingWhileLoggedIn =
			user.isLoggedIn && !previousEditingStateRef.current && isEditing;
		if (enteredEditingWhileLoggedIn) {
			nameInputRef.current?.focus();
		}
		previousEditingStateRef.current = isEditing;
	}, [isEditing, user.isLoggedIn]);

	const handleSave = async () => {
		if (!editedName.trim()) return;
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
		<div className="flex flex-col items-center gap-6 w-full">
			{/* Avatar */}
			<div className="relative">
				<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-60" aria-hidden="true" />
				<div className="relative size-20 sm:size-24 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-card bg-muted">
					<img
						src={avatarSrc}
						alt="Profile"
						className="size-full object-cover"
						onError={() => setAvatarSrc(defaultAvatar)}
					/>
				</div>
			</div>

			{isEditing ? (
				<div className="w-full space-y-5 animate-in fade-in duration-200">
					{/* Welcome text for new users */}
					{!user.isLoggedIn && (
						<div className="text-center space-y-1">
							<h3 className="text-lg font-semibold text-foreground">Join the Council</h3>
							<p className="text-sm text-muted-foreground">Enter your name to track rankings</p>
						</div>
					)}

					{/* Name input */}
					<div className="relative">
						<User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
						<Input
							ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => setEditedName(e.target.value)}
							placeholder="Your name"
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							className="w-full h-12 pl-10 pr-4 text-base"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-2.5">
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
							size="large"
							onClick={handleSave}
							disabled={!editedName.trim() || isSaving}
							loading={isSaving}
							className={user.isLoggedIn ? "flex-[2]" : "w-full"}
						>
							{user.isLoggedIn ? "Save" : "Begin Journey"}
						</Button>
					</div>
				</div>
			) : (
				<div className="w-full flex flex-col items-center gap-4 animate-in fade-in duration-200">
					{/* Name display */}
					<div className="flex items-center gap-2">
						<h3 className="text-xl sm:text-2xl font-bold text-foreground">{user.name}</h3>
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
							aria-label="Edit name"
						>
							<Pencil size={14} />
						</button>
					</div>

					{/* Status */}
					<p className="text-xs text-muted-foreground">
						Your preferences are saved for ranking.
					</p>

					{/* Logout */}
					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
					>
						<LogOut size={13} />
						Logout
					</button>
				</div>
			)}
		</div>
	);
}
