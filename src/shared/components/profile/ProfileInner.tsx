import { useEffect, useRef, useState } from "react";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfileView } from "./ProfileView";

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
		<div className="flex flex-col items-center gap-5 w-full">
			<ProfileAvatar avatarSrc={avatarSrc} onError={() => setAvatarSrc(defaultAvatar)} />

			{isEditing ? (
				<ProfileEditForm
					editedName={editedName}
					setEditedName={setEditedName}
					saveError={saveError}
					setSaveError={setSaveError}
					isSaving={isSaving}
					isLoggedIn={user.isLoggedIn}
					handleSave={handleSave}
					handleCancel={() => setIsEditing(false)}
					nameInputRef={nameInputRef}
				/>
			) : (
				<ProfileView
					userName={user.name}
					isLoggingOut={isLoggingOut}
					handleEdit={() => setIsEditing(true)}
					handleLogout={() => void handleLogout()}
				/>
			)}
		</div>
	);
}
