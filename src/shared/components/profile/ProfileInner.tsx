import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "@/shared/components/layout/Button";
import { MagicActionGroup } from "@/shared/components/ui/MagicActionGroup";
import { MagicAvatar } from "@/shared/components/ui/MagicAvatar";
import { MagicInput } from "@/shared/components/ui/MagicInput";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { ErrorManager } from "@/shared/services/errorManager";
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
	}, [user.name, user.avatarUrl, defaultAvatar]);

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
		} catch (err) {
			ErrorManager.handleError(err, "ProfileInner.handleSave");
			setSaveError("We couldn't log you in right now. Try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await onLogout();
			setIsEditing(true);
		} catch (err) {
			ErrorManager.handleError(err, "ProfileInner.handleLogout");
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-6 w-full px-2 py-4">
			<MagicAvatar
				avatarSrc={avatarSrc}
				onError={() => setAvatarSrc(defaultAvatar)}
			/>

			{isEditing ? (
				<div className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-300">
					<MagicInput
						inputRef={nameInputRef}
						value={editedName}
						onChange={(val) => {
							setEditedName(val);
							if (saveError) setSaveError(null);
						}}
						placeholder="Who are you?"
						icon={<User size={18} />}
						onKeyDown={(e) => e.key === "Enter" && handleSave()}
					/>

					{saveError && (
						<p
							role="alert"
							className="text-sm text-destructive text-center font-medium"
						>
							{saveError}
						</p>
					)}

					<div className="flex gap-3 pt-2">
						{user.isLoggedIn && (
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsEditing(false)}
								className="flex-1 rounded-xl"
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
							className={
								user.isLoggedIn ? "flex-[2] rounded-xl" : "w-full rounded-xl"
							}
						>
							{user.isLoggedIn ? "Save" : "Begin Journey"}
						</Button>
					</div>
				</div>
			) : (
				<div className="w-full flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
					<div className="text-center space-y-1.5">
						<h3 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
							{user.name}
						</h3>
						<p className="text-sm text-muted-foreground/80 font-medium">
							Your preferences are saved for ranking.
						</p>
					</div>

					<div className="pt-2">
						<MagicActionGroup
							onEdit={() => setIsEditing(true)}
							onLogout={() => void handleLogout()}
							isLoggingOut={isLoggingOut}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
