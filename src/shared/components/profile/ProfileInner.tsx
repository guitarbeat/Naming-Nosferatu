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
                <div className="flex flex-col items-center gap-8 w-full">
                        {/* Avatar with Glow */}
                        <div className="relative">
                                <div
                                        className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-xl opacity-60 animate-pulse"
                                        aria-hidden="true"
                                />
                                <div className="relative size-32 rounded-full overflow-hidden ring-4 ring-primary/60 ring-offset-6 ring-offset-card bg-gradient-to-br from-primary/20 to-accent/10 shadow-2xl">
                                        <img
                                                src={avatarSrc}
                                                alt="Your profile photo"
                                                className="size-full object-cover"
                                                onError={() => setAvatarSrc(defaultAvatar)}
                                        />
                                </div>
                        </div>

                        {isEditing ? (
                                <div className="w-full max-w-sm space-y-5 animate-in fade-in duration-250">
                                        <div className="text-center space-y-2">
                                                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Who are you?</h2>
                                                <p className="text-sm text-muted-foreground/80">Your name helps us track your preferences.</p>
                                        </div>

                                        <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary/50 pointer-events-none transition-colors group-focus-within:text-primary" />
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
                                                        placeholder="Enter your name"
                                                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                                        className="w-full h-14 pl-14 pr-4 text-base font-medium rounded-2xl bg-background/80 border border-primary/30 focus:border-primary/70 focus:bg-background/95 focus:outline-none transition-all"
                                                        autoFocus
                                                />
                                        </div>

                                        {saveError && (
                                                <div role="alert" className="p-4 rounded-xl bg-destructive/15 border border-destructive/40 text-sm text-destructive font-medium">
                                                        {saveError}
                                                </div>
                                        )}

                                        <div className="flex gap-3 pt-3">
                                                {user.isLoggedIn && (
                                                        <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="large"
                                                                onClick={() => setIsEditing(false)}
                                                                className="flex-1"
                                                        >
                                                                Cancel
                                                        </Button>
                                                )}
                                                <Button
                                                        type="submit"
                                                        variant="gradient"
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
                                <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-in fade-in duration-250">
                                        <div className="text-center space-y-2">
                                                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">{user.name}</h2>
                                                <p className="text-sm text-muted-foreground/70">
                                                        Your preferences are saved.
                                                </p>
                                        </div>

                                        <div className="flex flex-col gap-2 w-full">
                                                <button
                                                        type="button"
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-primary hover:text-primary hover:bg-primary/15 transition-colors"
                                                        aria-label="Edit name"
                                                >
                                                        <Pencil size={16} />
                                                        Edit
                                                </button>

                                                <button
                                                        type="button"
                                                        onClick={() => void handleLogout()}
                                                        disabled={isLoggingOut}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-destructive/70 hover:text-destructive hover:bg-destructive/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                        <LogOut size={16} />
                                                        {isLoggingOut ? "Logging out..." : "Logout"}
                                                </button>
                                        </div>
                                </div>
                        )}
                </div>
        );
}
