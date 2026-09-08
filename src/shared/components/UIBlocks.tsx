import { motion } from "framer-motion";
import {
	Award,
	Check,
	Crown,
	Flame,
	LogOut,
	Pencil,
	Shield,
	Trophy,
	User,
} from "lucide-react";
import { memo, type ReactNode, useEffect, useRef, useState } from "react";
import { Button, Input, Loading } from "@/shared/components/LayoutBlocks";
import {
	CAT_IMAGES,
	FALLBACK_CAT_IMAGE,
	FALLBACK_CAT_SVG,
} from "@/shared/lib/constants";
import {
	cn,
	ErrorManager,
	handleImgError,
	hapticNavTap,
} from "@/shared/lib/utils";
import useAppStore from "@/store";

interface ProfileInnerProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
	onLogout: () => Promise<void>;
}

export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {
	const user = useAppStore((s) => s.user);
	const userActions = useAppStore((s) => s.userActions);
	const tournament = useAppStore((s) => s.tournament);
	const defaultAvatar = CAT_IMAGES[0] ?? FALLBACK_CAT_IMAGE;
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
						aria-expanded={showAvatarPicker}
						aria-controls="avatar-picker-tray"
					>
						<img
							src={avatarSrc}
							alt="Profile avatar"
							className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
							onError={() =>
								setAvatarSrc((prev) =>
									prev === defaultAvatar ? FALLBACK_CAT_SVG : defaultAvatar,
								)
							}
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
					aria-expanded={showAvatarPicker}
					aria-controls="avatar-picker-tray"
				>
					{showAvatarPicker ? "Hide Avatar Options" : "Choose Avatar"}
				</button>
			</div>

			{/* Avatar Selector Tray */}
			{showAvatarPicker && (
				<motion.div
					id="avatar-picker-tray"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="w-full bg-card/60 border border-primary/20 rounded-[2rem] p-4 backdrop-blur-md shadow-sm"
				>
					<p className="text-xs font-semibold text-muted-foreground tracking-wide text-center mb-3">
						Select Cat Persona
					</p>
					<div className="grid grid-cols-4 gap-3 sm:grid-cols-6 justify-items-center">
						{CAT_IMAGES.slice(0, 8).map((imgUrl, idx) => {
							const isSelected = avatarSrc === imgUrl;
							return (
								<button
									key={imgUrl || idx}
									type="button"
									onClick={() => handleSelectAvatar(imgUrl)}
									aria-pressed={isSelected}
									aria-label={`Select avatar ${idx + 1}`}
									className={cn(
										"relative size-12 rounded-full overflow-hidden border-2 transition-all duration-[300ms] ease-spring active:scale-95",
										isSelected
											? "border-primary ring-4 ring-primary/20 scale-105"
											: "border-border/60 opacity-70 hover:opacity-100 hover:scale-105",
									)}
								>
									<img
										src={imgUrl}
										alt={`Avatar option ${idx + 1}`}
										className="size-full object-cover"
										onError={handleImgError}
									/>
									{isSelected && (
										<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
											<Check
												size={14}
												className="text-primary-foreground stroke-[3]"
											/>
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
						<User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-primary/60 pointer-events-none transition-colors group-focus-within:text-primary" />
						<Input
							ref={nameInputRef}
							type="text"
							value={editedName}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="Enter your player handle..."
							aria-label="Player Handle"
							maxLength={32}
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							className="w-full h-12 pl-11 pr-4 text-sm rounded-full bg-card border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/20 shadow-inner transition-all duration-300"
						/>
					</div>
					{saveError && (
						<p
							role="alert"
							className="text-sm text-destructive text-center font-medium"
						>
							{saveError}
						</p>
					)}
					<div className="flex gap-3">
						{user.isLoggedIn && (
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsEditing(false)}
								className="flex-1 rounded-full"
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
							className={`${user.isLoggedIn ? "flex-[2]" : "w-full"} rounded-full shadow-lg font-semibold`}
						>
							{user.isLoggedIn ? "Save Changes" : "Begin Battle Journey"}
						</Button>
					</div>
				</div>
			) : (
				<div className="w-full flex flex-col items-center gap-4">
					<div className="flex items-center justify-center gap-3 bg-card py-3 px-6 rounded-[2rem] border border-primary/10 shadow-sm w-full max-w-sm">
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
							<div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-primary tracking-wide uppercase">
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
						<div className="bg-card/80 border border-primary/10 rounded-[2rem] p-4 text-center backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
							<div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground mb-1">
								<Trophy size={13} className="text-primary" />
								<span>Selected Names</span>
							</div>
							<span className="text-2xl font-black text-foreground tabular-nums">
								{selectedCount}
							</span>
						</div>
						<div className="bg-card/80 border border-primary/10 rounded-[2rem] p-4 text-center backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
							<div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground mb-1">
								<Flame size={13} className="text-accent" />
								<span>Active Ratings</span>
							</div>
							<span className="text-2xl font-black text-foreground tabular-nums">
								{ratingsCount}
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="mt-2 flex items-center justify-center gap-2 w-full max-w-sm py-3 rounded-full text-sm font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
					>
						<LogOut size={15} />
						{isLoggingOut ? "Logging out..." : "Log Out of Profile"}
					</button>
				</div>
			)}
		</div>
	);
}

interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
}

interface MagicToggleProps<T extends string> {
	options: readonly MagicToggleOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
	size?: "small" | "default";
}

export function MagicToggle<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
	size = "default",
}: MagicToggleProps<T>) {
	return (
		<div
			className={`relative inline-flex items-center w-full sm:w-auto ${size === "small" ? "p-1" : "p-1.5"} bg-card backdrop-blur-md rounded-full border border-border/60 shadow-sm`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${size === "small" ? "inset-y-1" : "inset-y-1.5"} rounded-full bg-primary/20 border border-primary/30 pointer-events-none`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (size === "small" ? 2 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${size === "small" ? 2 : 4}px)`,
				}}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 20,
					mass: 0.8,
				}}
			/>
			{options.map((option) => {
				const isSelected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => {
							hapticNavTap();
							onChange(option.value);
						}}
						className={`relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-bold tracking-wide transition-colors z-10 rounded-full ${
							isSelected
								? "text-primary"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/30"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							{option.icon && (
								<motion.span
									className="flex items-center justify-center"
									animate={{
										scale: isSelected ? [1, 1.15, 1] : 1,
									}}
									transition={{
										duration: 0.3,
										ease: "easeInOut",
									}}
								>
									{option.icon}
								</motion.span>
							)}
							<span>{option.label}</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

export const SectionHeading = memo(function SectionHeading({
	id,
	title,
	subtitle,
}: {
	id?: string;
	title: string;
	subtitle?: string;
}) {
	return (
		<div id={id} className="mb-6 flex flex-col items-center text-center">
			<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				{title}
			</h2>
			{subtitle && (
				<p className="mt-2 text-sm text-muted-foreground sm:text-base">
					{subtitle}
				</p>
			)}
		</div>
	);
});
