import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	Award,
	Check,
	Crown,
	Flame,
	Loader2,
	LogOut,
	Pencil,
	Search,
	Shield,
	Trophy,
	User,
} from "lucide-react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { Button, Input, Loading } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn, hapticNavTap } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";

export type NavItem = {
	id: string;
	label: string;
	icon: ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	badgeContent?: ReactNode;
	onClick: () => void;
};

export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {
	const shouldReduceMotion = useReducedMotion();
	const visibleItems = items.slice(0, 5);

	return (
		<motion.nav
			aria-label="Main Navigation"
			initial={shouldReduceMotion ? false : { y: 30, opacity: 0, scale: 0.95 }}
			animate={{ y: 0, opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 400, damping: 30 }}
			className="floating-navbar-frame"
		>
			<div className="floating-navbar-shell relative flex items-center gap-1 p-1.5 sm:gap-2 sm:p-2 rounded-full overflow-hidden">
				<div className="nav-menu relative flex items-center justify-center gap-1 sm:gap-2 z-10 w-full">
					{visibleItems.map((item) => {
						const isActive = Boolean(item.isActive);
						const isAccent = Boolean(item.isAccent);

						return (
							<motion.button
								key={item.id}
								layout={!shouldReduceMotion}
								type="button"
								onClick={() => {
									hapticNavTap();
									item.onClick();
								}}
								whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
								whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
								className={cn(
									"group relative flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full overflow-hidden text-[13px] sm:text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer floating-nav-button",
									isActive
										? "floating-nav-button--active"
										: isAccent
											? "floating-nav-button--accent"
											: "",
								)}
								aria-label={item.label}
								aria-current={isActive ? "page" : undefined}
							>
								{isActive && (
									<motion.div
										layoutId="floating-nav-active-bubble"
										className="absolute inset-0 rounded-full floating-nav-active-bubble"
										transition={{
											type: "spring",
											stiffness: 400,
											damping: 32,
										}}
									/>
								)}
								<motion.span
									layout={shouldReduceMotion ? false : "position"}
									className={cn(
										"relative z-10 flex items-center justify-center shrink-0 transition-colors duration-300 floating-nav-icon",
										isActive && "text-primary-foreground",
									)}
								>
									{item.icon}
								</motion.span>
								<motion.span
									layout={shouldReduceMotion ? false : "position"}
									className={cn(
										"relative z-10 whitespace-nowrap tracking-tight transition-colors duration-300 floating-nav-label",
										isActive ? "block text-primary-foreground" : "hidden md:block",
									)}
								>
									{item.label}
								</motion.span>
							</motion.button>
						);
					})}
				</div>
			</div>
		</motion.nav>
	);
});

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
							<h3 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
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

						<p className="text-sm text-muted-foreground/80 font-medium text-center">
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

export interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
}

export interface MagicToggleProps<T extends string> {
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
			className={`relative inline-flex items-center w-full sm:w-auto ${size === "small" ? "p-1" : "p-1.5"} bg-white/5 dark:bg-black/40 backdrop-blur-xl ${size === "small" ? "rounded-xl" : "rounded-2xl"} border border-white/10 shadow-xl`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${size === "small" ? "inset-y-1 rounded-md" : "inset-y-1.5 rounded-lg"} bg-primary/20 border border-primary/30 pointer-events-none`}
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
						className={`relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-semibold tracking-wide transition-colors z-10 ${size === "small" ? "rounded-md" : "rounded-lg"} ${
							isSelected
								? "text-primary-foreground font-bold"
								: "text-muted-foreground hover:text-foreground"
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

interface ProfileInnerProps {
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
						aria-expanded={showAvatarPicker}
						aria-controls="avatar-picker"
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
					aria-expanded={showAvatarPicker}
					aria-controls="avatar-picker"
				>
					{showAvatarPicker ? "Hide Avatar Options" : "Choose Avatar"}
				</button>
			</div>

			{/* Avatar Selector Tray */}
			{showAvatarPicker && (
				<motion.div
					id="avatar-picker"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="w-full bg-card/60 border border-border/40 rounded-2xl p-3 backdrop-blur-md"
				>
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2.5">
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
								<h3 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
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
							<div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
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
						className="mt-1 flex items-center justify-center gap-2 w-full max-w-sm py-2.5 rounded-xl text-sm font-semibold text-destructive hover:text-destructive-foreground hover:bg-destructive shadow-sm transition-all duration-200"
					>
						<LogOut size={15} />
						{isLoggingOut ? "Logging out..." : "Log Out of Profile"}
					</button>
				</div>
			)}
		</div>
	);
}

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

interface SearchFilterBarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
}

function SearchInput({
	searchTerm,
	onChange,
}: {
	searchTerm: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="flex-1 w-full relative">
			<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
				<Search size={16} />
			</div>
			<input
				type="text"
				placeholder="Search names..."
				value={searchTerm}
				onChange={onChange}
				aria-label="Search names"
				className="w-full h-11 bg-background/40 hover:bg-background/60 focus:bg-background/80 transition-colors rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 border-none outline-none ring-0 focus:ring-2 focus:ring-primary/40"
			/>
		</div>
	);
}

function FilterSelect({
	filterStatus,
	filterOptions,
	onChange,
}: {
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
	return (
		<div className="relative w-full sm:w-40 h-11 bg-background/40 hover:bg-background/60 focus-within:bg-background/80 transition-colors rounded-xl flex items-center px-3 border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
			<select
				value={filterStatus}
				onChange={onChange}
				aria-label="Filter names by status"
				className="w-full bg-transparent text-sm text-foreground appearance-none outline-none cursor-pointer"
			>
				{filterOptions.map((option) => (
					<option key={option.value} value={option.value} className="bg-background text-foreground">
						{option.label}
					</option>
				))}
			</select>
			<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
				<svg
					className="h-4 w-4 fill-current"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
				</svg>
			</div>
		</div>
	);
}

export function SearchFilterBar({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
}: SearchFilterBarProps) {
	const prefersReducedMotion = useReducedMotion();

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
		onSearchTermChange(event.target.value);
	};

	const handleRefresh = () => {
		hapticNavTap();
		onRefresh();
	};

	return (
		<motion.div
			className="flex flex-col sm:flex-row items-center gap-3 w-full bg-foreground/5 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-border/10 shadow-inner group transition-all duration-300 hover:border-border/30 hover:shadow-md mb-6"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			transition={{
				duration: 0.3,
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
		>
			<SearchInput searchTerm={searchTerm} onChange={handleSearchChange} />
			<div className="flex items-center gap-2 w-full sm:w-auto">
				<FilterSelect
					filterStatus={filterStatus}
					filterOptions={filterOptions}
					onChange={onFilterChange}
				/>
				<Button
					onClick={handleRefresh}
					variant="primary"
					className="h-11 w-11 sm:w-11 p-0 shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
					aria-label="Refresh list"
					title="Refresh list"
				>
					<Loader2 size={18} />
				</Button>
			</div>
		</motion.div>
	);
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
		<div className="mx-auto mb-6 flex w-full max-w-2xl flex-col items-center text-center sm:mb-8">
			<h2
				id={id}
				className="font-display font-bold leading-[0.96] tracking-[-0.03em] text-foreground"
			>
				{title}
			</h2>
			{subtitle && (
				<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
					{subtitle}
				</p>
			)}
		</div>
	);
});
