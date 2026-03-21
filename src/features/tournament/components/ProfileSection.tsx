/**
 * @module ProfileSection
 * @description User profile management for guest and account-backed sessions.
 */

import { useEffect, useRef, useState } from "react";
import type { LoginCredentials, RegisterData } from "@/app/providers/Providers";
import { Button, Input, Section } from "@/shared/components/layout";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { LogOut, Mail, Pencil, ShieldCheck, User } from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

type AuthMode = "guest" | "signin" | "register";

interface ProfileSectionProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onAccountLogin?: (credentials: LoginCredentials) => Promise<boolean | undefined>;
	onRegister?: (data: RegisterData) => Promise<void>;
	onLogout?: () => Promise<void>;
}

function AuthModeButton({
	active,
	children,
	onClick,
}: {
	active: boolean;
	children: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<Button
			type="button"
			variant={active ? "secondary" : "ghost"}
			presentation="chip"
			shape="pill"
			onClick={onClick}
			className={active ? "bg-primary/12 text-foreground" : "text-muted-foreground"}
		>
			{children}
		</Button>
	);
}

export function ProfileInner({
	onLogin,
	onAccountLogin,
	onRegister,
	onLogout,
}: ProfileSectionProps) {
	const { user, userActions } = useAppStore();
	const defaultAvatar = CAT_IMAGES[0] ?? "";
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const [editedName, setEditedName] = useState(user.name || "");
	const [accountName, setAccountName] = useState(user.name || "");
	const [accountEmail, setAccountEmail] = useState(user.email || "");
	const [accountPassword, setAccountPassword] = useState("");
	const [authMode, setAuthMode] = useState<AuthMode>("guest");
	const [authError, setAuthError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || defaultAvatar);
	const previousLoginStateRef = useRef(user.isLoggedIn);
	const previousEditingStateRef = useRef(isEditing);

	useEffect(() => {
		setEditedName(user.name || "");
		setAccountName(user.name || "");
		setAccountEmail(user.email || "");
		setAvatarSrc(user.avatarUrl || defaultAvatar);
	}, [defaultAvatar, user.avatarUrl, user.email, user.name]);

	useEffect(() => {
		const wasLoggedIn = previousLoginStateRef.current;
		if (!user.isLoggedIn) {
			setIsEditing(true);
		} else if (!wasLoggedIn) {
			setIsEditing(false);
			setAccountPassword("");
			setAuthError(null);
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

	const handleGuestSave = async () => {
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		setAuthError(null);
		try {
			await onLogin(editedName.trim());
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update name:", error);
			setAuthError("Could not save your display name.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleAccountSignIn = async () => {
		if (!onAccountLogin || !accountEmail.trim() || !accountPassword) {
			return;
		}

		setIsSaving(true);
		setAuthError(null);
		try {
			const success = await onAccountLogin({
				email: accountEmail.trim(),
				password: accountPassword,
				name: accountName.trim() || undefined,
			});

			if (!success) {
				setAuthError("Sign in failed. Check your email and password.");
				return;
			}

			setIsEditing(false);
			setAccountPassword("");
		} catch (error) {
			console.error("Failed to sign in:", error);
			setAuthError("Sign in failed. Check your email and password.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleAccountRegister = async () => {
		if (!onRegister || !accountName.trim() || !accountEmail.trim() || !accountPassword) {
			return;
		}

		setIsSaving(true);
		setAuthError(null);
		try {
			await onRegister({
				name: accountName.trim(),
				email: accountEmail.trim(),
				password: accountPassword,
			});

			if (onAccountLogin) {
				const signedIn = await onAccountLogin({
					email: accountEmail.trim(),
					password: accountPassword,
					name: accountName.trim(),
				});

				if (signedIn) {
					setIsEditing(false);
					setAccountPassword("");
					return;
				}
			}

			setAuthMode("signin");
			setAccountPassword("");
			setAuthError("Account created. Sign in with your new credentials.");
		} catch (error) {
			console.error("Failed to create account:", error);
			setAuthError("Could not create your account. Please try a different email.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		try {
			if (onLogout) {
				await onLogout();
			}
		} catch (error) {
			console.error("Failed to log out:", error);
		} finally {
			userActions.logout();
			setIsEditing(true);
			setAccountPassword("");
			setAuthError(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full">
			{isEditing && !user.isLoggedIn && (
				<div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
					<h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
						Join the Council
					</h2>
					<p className="text-sm text-muted-foreground">
						Continue locally, or sign in to sync ratings and tournament history.
					</p>
				</div>
			)}

			<div className="flex flex-col md:flex-row gap-6 items-center">
				<div className="relative shrink-0">
					<div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-xl animate-pulse" />
					<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 bg-muted">
						<img
							src={avatarSrc}
							alt="Profile"
							className="w-full h-full object-cover"
							onError={() => setAvatarSrc(defaultAvatar)}
						/>
					</div>
				</div>

				<div className="flex-1 w-full">
					{isEditing ? (
						<div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
							{!user.isLoggedIn && (
								<div className="flex flex-wrap gap-2">
									<AuthModeButton
										active={authMode === "guest"}
										onClick={() => setAuthMode("guest")}
									>
										Guest
									</AuthModeButton>
									<AuthModeButton
										active={authMode === "signin"}
										onClick={() => setAuthMode("signin")}
									>
										Sign In
									</AuthModeButton>
									<AuthModeButton
										active={authMode === "register"}
										onClick={() => setAuthMode("register")}
									>
										Create Account
									</AuthModeButton>
								</div>
							)}

							{authError && <p className="text-sm text-destructive">{authError}</p>}

							{user.isLoggedIn || authMode === "guest" ? (
								<>
									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground/80 block">
											Your Name
										</label>
										<div className="relative">
											<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
											<Input
												ref={nameInputRef}
												type="text"
												value={editedName}
												onChange={(event) => setEditedName(event.target.value)}
												placeholder="Who are you?"
												onKeyDown={(event) => event.key === "Enter" && handleGuestSave()}
												className="w-full h-[50px] pl-12 pr-4 font-medium backdrop-blur-sm"
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
											variant="primary"
											size="xl"
											shape="pill"
											onClick={handleGuestSave}
											disabled={!editedName.trim() || isSaving}
											loading={isSaving}
											className="flex-[2]"
										>
											{user.isLoggedIn ? "Save" : "Continue as Guest"}
										</Button>
									</div>
								</>
							) : (
								<>
									{authMode === "register" && (
										<div className="space-y-2">
											<label className="text-sm font-medium text-foreground/80 block">
												Display Name
											</label>
											<div className="relative">
												<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
												<Input
													type="text"
													value={accountName}
													onChange={(event) => setAccountName(event.target.value)}
													placeholder="How should we label your rankings?"
													className="w-full h-[50px] pl-12 pr-4 font-medium backdrop-blur-sm"
												/>
											</div>
										</div>
									)}

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground/80 block">Email</label>
										<div className="relative">
											<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
											<Input
												type="email"
												value={accountEmail}
												onChange={(event) => setAccountEmail(event.target.value)}
												placeholder="you@example.com"
												className="w-full h-[50px] pl-12 pr-4 font-medium backdrop-blur-sm"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground/80 block">Password</label>
										<div className="relative">
											<ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
											<Input
												type="password"
												value={accountPassword}
												onChange={(event) => setAccountPassword(event.target.value)}
												placeholder="Use at least 8 characters"
												onKeyDown={(event) => {
													if (event.key !== "Enter") {
														return;
													}
													if (authMode === "register") {
														void handleAccountRegister();
													} else {
														void handleAccountSignIn();
													}
												}}
												className="w-full h-[50px] pl-12 pr-4 font-medium backdrop-blur-sm"
											/>
										</div>
									</div>

									<div className="flex gap-3">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setAuthMode("guest")}
											className="flex-1"
										>
											Back
										</Button>
										<Button
											type="button"
											variant="primary"
											size="xl"
											shape="pill"
											onClick={() =>
												authMode === "register"
													? void handleAccountRegister()
													: void handleAccountSignIn()
											}
											disabled={
												isSaving ||
												!accountEmail.trim() ||
												!accountPassword ||
												(authMode === "register" && !accountName.trim())
											}
											loading={isSaving}
											className="flex-[2]"
										>
											{authMode === "register" ? "Create Account" : "Sign In"}
										</Button>
									</div>
								</>
							)}
						</div>
					) : (
						<div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
							<div className="flex items-center gap-3">
								<h3 className="text-2xl md:text-3xl font-bold text-foreground">{user.name}</h3>
								<Button
									type="button"
									onClick={() => setIsEditing(true)}
									variant="ghost"
									size="icon"
									iconOnly={true}
									shape="pill"
									className="size-8 bg-transparent text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
									aria-label="Edit name"
								>
									<Pencil size={16} />
								</Button>
							</div>
							{user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
							<Button
								type="button"
								onClick={() => void handleLogout()}
								variant="ghost"
								shape="pill"
								className="group w-fit bg-transparent text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
								startIcon={
									<LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
								}
							>
								Logout
							</Button>
						</div>
					)}
				</div>
			</div>

			{!isEditing && (
				<p className="text-center text-sm text-muted-foreground font-medium">
					Account sessions sync ratings and tournament history. Guest sessions stay on this device.
				</p>
			)}
		</div>
	);
}

export function ProfileSection(props: ProfileSectionProps) {
	return (
		<Section id="profile" variant="minimal" padding="comfortable" maxWidth="full">
			<div className="mx-auto w-full max-w-3xl">
				<ProfileInner {...props} />
			</div>
		</Section>
	);
}
