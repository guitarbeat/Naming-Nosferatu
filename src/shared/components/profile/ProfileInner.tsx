import { useEffect, useRef, useState } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { LogOut, Pencil } from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

interface ProfileInnerProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onLogout: () => Promise<void>;
}

export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {
	const { user } = useAppStore();
	const defaultAvatar = CAT_IMAGES[0] ?? "";
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const [editedName, setEditedName] = useState(user.name || "");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
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
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		setSaveError(null);
		try {
			const didLogin = await onLogin(editedName.trim());
			if (didLogin === false) {
				setSaveError("We couldn't log you in with that name. Try again.");
				return;
			}
			setIsEditing(false);
		} catch (_err) {
			setSaveError("We couldn't save your name right now. Try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await onLogout();
			setIsEditing(true);
		} catch (_err) {
			// Error handled silently, user remains in editing state
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-6 w-full pt-2">
			{/* Avatar */}
			<div className="size-20 rounded-full overflow-hidden border border-white/10 bg-muted shadow-md flex-shrink-0">
				<img
					src={avatarSrc}
					alt="Profile"
					className="size-full object-cover"
					onError={() => setAvatarSrc(defaultAvatar)}
				/>
			</div>

			{isEditing ? (
				<div className="w-full space-y-4 animate-in fade-in duration-200">
					<div className="space-y-1.5">
						<label className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60">
							Your name
						</label>
						<Input
							ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => {
								setEditedName(e.target.value);
								if (saveError) {
									setSaveError(null);
								}
							}}
							placeholder="Who are you?"
							className="w-full h-11 px-4 text-sm"
						/>
					</div>

					{saveError && (
						<p role="alert" className="text-sm text-destructive/90">
							{saveError}
						</p>
					)}

					<div className="flex gap-2 pt-1">
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
							variant="primary"
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
					<div className="flex flex-col items-center gap-1">
						<div className="flex items-center gap-2">
							<h3 className="text-xl font-bold text-foreground tracking-tight">{user.name}</h3>
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="p-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
								aria-label="Edit name"
							>
								<Pencil size={13} />
							</button>
						</div>
						<p className="text-xs text-muted-foreground/60">Rankings saved to your profile.</p>
					</div>

					<button
						type="button"
						onClick={() => void handleLogout()}
						disabled={isLoggingOut}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
					>
						<LogOut size={12} />
						{isLoggingOut ? "Logging out…" : "Log out"}
					</button>
				</div>
			)}
		</div>
	);
}
