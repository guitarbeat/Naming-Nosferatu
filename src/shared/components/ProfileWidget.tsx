import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store";

export interface MagicProfileWidgetProps {
	avatarSrc: string;
	onAvatarError: () => void;
	isEditing: boolean;
	editedName: string;
	onNameChange: (val: string) => void;
	saveError: string | null;
	isSaving: boolean;
	isLoggedIn: boolean;
	userName?: string;
	isLoggingOut: boolean;
	onSave: () => void;
	onCancel: () => void;
	onEdit: () => void;
	onLogout: () => void;
	nameInputRef: RefObject<HTMLInputElement | null>;
}

export function MagicProfileWidget({
	avatarSrc,
	onAvatarError,
	isEditing,
	editedName,
	onNameChange,
	saveError,
	isSaving,
	isLoggedIn,
	userName,
	isLoggingOut,
	onSave,
	onCancel,
	onEdit,
	onLogout,
	nameInputRef,
}: MagicProfileWidgetProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			layout={!prefersReducedMotion}
			initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="flex flex-col items-center gap-5 w-full p-2"
		>
			<motion.div layout={!prefersReducedMotion} className="relative mb-1 group">
				<motion.div
					layout={!prefersReducedMotion}
					className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"
					aria-hidden="true"
				/>
				<motion.div
					layout={!prefersReducedMotion}
					whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
					whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
					className="relative size-24 rounded-full overflow-hidden ring-4 ring-primary/30 ring-offset-4 ring-offset-background bg-muted shadow-lg"
				>
					<img
						src={avatarSrc}
						alt="Profile"
						className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
						onError={onAvatarError}
					/>
				</motion.div>
			</motion.div>

			<AnimatePresence mode="wait">
				{isEditing ? (
					<motion.div
						key="edit"
						initial={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: "blur(4px)" }
						}
						animate={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }
						}
						exit={
							prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }
						}
						transition={{ duration: 0.3 }}
						className="w-full space-y-4"
					>
						<div className="relative group">
							<User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none transition-colors group-focus-within:text-primary" />
							<Input
								ref={nameInputRef}
								type="text"
								value={editedName}
								onChange={(e) => onNameChange(e.target.value)}
								placeholder="Who are you?"
								aria-label="Name"
								onKeyDown={(e) => e.key === "Enter" && onSave()}
								className="w-full h-12 pl-10 pr-4 text-sm rounded-2xl bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/30 shadow-inner transition-all duration-300"
							/>
						</div>

						{saveError && (
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								role="alert"
								className="text-sm text-destructive text-center font-medium"
							>
								{saveError}
							</motion.p>
						)}

						<div className="flex gap-3">
							{isLoggedIn && (
								<Button
									type="button"
									variant="ghost"
									onClick={onCancel}
									className="flex-1 rounded-xl"
								>
									Cancel
								</Button>
							)}
							<Button
								type="submit"
								variant="glass"
								size="large"
								onClick={onSave}
								disabled={!editedName.trim() || isSaving}
								loading={isSaving}
								className={`${isLoggedIn ? "flex-[2]" : "w-full"} rounded-xl shadow-lg shadow-primary/20`}
							>
								{isLoggedIn ? "Save" : "Begin Journey"}
							</Button>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="view"
						initial={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: "blur(4px)" }
						}
						animate={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }
						}
						exit={
							prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }
						}
						transition={{ duration: 0.3 }}
						className="w-full flex flex-col items-center gap-4"
					>
						<div className="flex items-center justify-center gap-3 bg-foreground/5 py-2 px-4 rounded-2xl border border-foreground/10">
							<h3 className="text-2xl font-black tracking-tight text-foreground">
								{userName}
							</h3>
							<motion.button
								whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 10 }}
								whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
								type="button"
								onClick={onEdit}
								className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
								aria-label="Edit name"
								title="Edit name"
							>
								<Pencil size={16} />
							</motion.button>
						</div>

						<p className="text-sm text-muted-foreground font-medium text-center">
							Your preferences are saved for ranking.
						</p>

						<motion.button
							whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
							whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
							type="button"
							onClick={onLogout}
							disabled={isLoggingOut}
							className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-destructive hover:text-destructive-foreground hover:bg-destructive shadow-sm transition-all duration-300"
						>
							<LogOut size={16} />
							{isLoggingOut ? "Logging out..." : "Logout"}
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export interface ProfileInnerProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onLogout: () => Promise<void>;
}

export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {
	const user = useAppStore((s) => s.user);
	const userActions = useAppStore((s) => s.userActions);
	const tournament = useAppStore((s) => s.tournament);
	const defaultAvatar = CAT_IMAGES[0] ?? "";
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const [editedName, setEditedName] = useState(user.name || "");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || defaultAvatar);
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);
	const previousLoginStateRef = useRef(user.isLoggedIn);
	const previousEditingStateRef = useRef(isEditing);

	const ratingsCount = Object.keys(tournament.ratings || {}).length;
	const selectedCount = tournament.selectedNames?.length || 0;

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

	const handleSelectAvatar = (url: string) => {
		setAvatarSrc(url);
		userActions.setUser({ avatarUrl: url });
		setShowAvatarPicker(false);
	};

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

	const handleNameChange = (val: string) => {
		setEditedName(val);
		if (saveError) {
			setSaveError(null);
		}
	};

	return (
		<div className="flex flex-col items-center gap-5 w-full p-2">
			{/* Avatar Showcase with interactive picker toggle */}
			<div className="flex flex-col items-center gap-2">
				<div className="relative group">
					<div
						className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"
						aria-hidden="true"
					/>
					<button
						type="button"
						onClick={() => setShowAvatarPicker((prev) => !prev)}
						className="relative size-24 rounded-full overflow-hidden ring-4 ring-primary/30 ring-offset-4 ring-offset-background bg-muted shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
						title="Click to choose avatar"
						aria-label="Change profile avatar"
					>
						<img
							src={avatarSrc}
							alt="Profile avatar"
							className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
							onError={() => setAvatarSrc(defaultAvatar)}
						/>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold tracking-wider uppercase">
							Change
						</div>
					</button>

					{user.isAdmin && (
						<div
							className="absolute -bottom-1 -right-1 size-7 rounded-full bg-chart-4 text-black flex items-center justify-center shadow-md ring-2 ring-background font-bold"
							title="Tournament Master Admin"
						>
							<Crown size={14} />
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={() => setShowAvatarPicker((prev) => !prev)}
					className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
				>
					{showAvatarPicker ? "Hide Avatar Options" : "Choose Avatar"}
				</button>
			</div>

			{/* Avatar Selector Tray */}
			{showAvatarPicker && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="w-full bg-card/60 border border-border/40 rounded-2xl p-3 backdrop-blur-md"
				>
					<p className="text-xs font-semibold text-muted-foreground tracking-wide text-center mb-2.5">
						Select Cat Persona
					</p>
					<div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 justify-items-center">
						{CAT_IMAGES.slice(0, 8).map((imgUrl, idx) => {
							const isSelected = avatarSrc === imgUrl;
							return (
								<button
									key={imgUrl || idx}
									type="button"
									onClick={() => handleSelectAvatar(imgUrl)}
									className={cn(
										"relative size-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110",
										isSelected
											? "border-primary ring-2 ring-primary/40 scale-105"
											: "border-border/60 opacity-70 hover:opacity-100",
									)}
								>
									<img
										src={imgUrl}
										alt={`Avatar option ${idx + 1}`}
										className="size-full object-cover"
									/>
									{isSelected && (
										<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
											<Check size={14} className="text-primary-foreground stroke-[3]" />
										</div>
									)}
								</button>
							);
						})}
					</div>
				</motion.div>
			)}

			{isEditing ? (
				<div className="w-full space-y-4">
					<div className="relative group">
						<User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none transition-colors group-focus-within:text-primary" />
						<Input
							ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Enter your player handle..."
							aria-label="Player Handle"
							maxLength={32}
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							className="w-full h-12 pl-10 pr-4 text-sm rounded-2xl bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/30 shadow-inner transition-all duration-300"
						/>
					</div>
					{saveError && (
						<p role="alert" className="text-sm text-destructive text-center font-medium">
							{saveError}
						</p>
					)}
					<div className="flex gap-3">
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
							className={`${user.isLoggedIn ? "flex-[2]" : "w-full"} rounded-xl shadow-lg shadow-primary/20 font-semibold`}
						>
							{user.isLoggedIn ? "Save Changes" : "Begin Battle Journey"}
						</Button>
					</div>
				</div>
			) : (
				<div className="w-full flex flex-col items-center gap-4">
					<div className="flex items-center justify-center gap-3 bg-foreground/5 py-2.5 px-5 rounded-2xl border border-foreground/10 w-full max-w-sm">
						<div className="flex flex-col items-center">
							<div className="flex items-center gap-2">
								<h3 className="text-2xl font-black tracking-tight text-foreground">
									{user.name}
								</h3>
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors"
									aria-label="Edit name"
									title="Edit name"
								>
									<Pencil size={15} />
								</button>
							</div>
							<div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-primary tracking-wide">
								{user.isAdmin ? (
									<>
										<Shield size={12} className="text-chart-4" />
										<span className="text-chart-4">Arena Master</span>
									</>
								) : (
									<>
										<Award size={12} />
										<span>Feline Judge</span>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Player Stats Snapshot */}
					<div className="grid grid-cols-2 gap-3 w-full max-w-sm">
						<div className="bg-card/40 border border-border/40 rounded-xl p-3 text-center backdrop-blur-sm">
							<div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
								<Trophy size={13} className="text-primary" />
								<span>Selected Names</span>
							</div>
							<span className="text-lg font-bold text-foreground tabular-nums">
								{selectedCount}
							</span>
						</div>
						<div className="bg-card/40 border border-border/40 rounded-xl p-3 text-center backdrop-blur-sm">
							<div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
								<Flame size={13} className="text-accent" />
								<span>Active Ratings</span>
							</div>
							<span className="text-lg font-bold text-foreground tabular-nums">{ratingsCount}</span>
						</div>
					</div>

					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="mt-1 flex items-center justify-center gap-2 w-full max-w-sm py-2.5 rounded-xl text-sm font-semibold text-destructive hover:text-destructive-foreground hover:bg-destructive shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
					>
						<LogOut size={15} />
						{isLoggingOut ? "Logging out..." : "Log Out of Profile"}
					</button>
				</div>
			)}
		</div>
	);
}
