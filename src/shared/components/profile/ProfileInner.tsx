import { useEffect, useRef, useState } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { LogOut, Pencil, User } from "@/shared/lib/icons";
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
                } catch (err) {
                        console.error("Failed to update name:", err);
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
                } catch (err) {
                        console.error("Failed to logout:", err);
                } finally {
                        setIsLoggingOut(false);
                }
        };

        return (
                <div className="flex flex-col items-center gap-6 w-full">
                        {/* Avatar with Glow */}
                        <div className="relative">
                                <div
                                        className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-xl opacity-60 animate-pulse"
                                        aria-hidden="true"
                                />
                                <div className="relative size-28 rounded-full overflow-hidden ring-3 ring-primary/50 ring-offset-4 ring-offset-card bg-gradient-to-br from-primary/20 to-accent/10 shadow-2xl">
                                        <img
                                                src={avatarSrc}
                                                alt="Your profile photo"
                                                className="size-full object-cover"
                                                onError={() => setAvatarSrc(defaultAvatar)}
                                        />
                                </div>
                        </div>

                        {isEditing ? (
                                <div className="w-full space-y-4 animate-in fade-in duration-250">
                                        <div className="text-center">
                                                <h2 className="text-2xl font-bold text-foreground mb-1">Who are you?</h2>
                                                <p className="text-xs text-muted-foreground">Your name helps track your preferences.</p>
                                        </div>

                                        <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none transition-colors group-focus-within:text-primary" />
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
                                                        className="w-full h-12 pl-12 pr-4 text-base rounded-xl bg-background/60 border border-primary/30 focus:border-primary/60 transition-colors"
                                                        autoFocus
                                                />
                                        </div>

                                        {saveError && (
                                                <div role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                                                        {saveError}
                                                </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
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
                                <div className="w-full flex flex-col items-center gap-4 animate-in fade-in duration-250">
                                        <div className="text-center">
                                                <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                                                <p className="text-xs text-muted-foreground/70 mt-1">
                                                        Your preferences are saved.
                                                </p>
                                        </div>

                                        <button
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors"
                                                aria-label="Edit name"
                                        >
                                                <Pencil size={14} />
                                                Edit
                                        </button>

                                        <button
                                                type="button"
                                                onClick={() => void handleLogout()}
                                                disabled={isLoggingOut}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                                <LogOut size={13} />
                                                {isLoggingOut ? "Logging out..." : "Logout"}
                                        </button>
                                </div>
                        )}
                </div>
        );
}
