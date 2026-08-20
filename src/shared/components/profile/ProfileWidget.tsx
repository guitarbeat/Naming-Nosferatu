import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";
import { hapticNavTap } from "@/shared/lib/browser/haptics";
import { TIMING } from "@/shared/lib/constants";

export function ProfileAvatar({ avatarSrc, onError }: { avatarSrc: string; onError: () => void }) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className="relative mb-1 group"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
			transition={{ duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
		>
			<div
				className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"
				aria-hidden="true"
			/>
			<motion.div
				className="relative size-24 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-card bg-muted shadow-lg"
				whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
				transition={{ type: "spring", stiffness: 400, damping: 25 }}
			>
				<img src={avatarSrc} alt="Profile" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" onError={onError} />
			</motion.div>
		</motion.div>
	);
}

export interface ProfileEditFormProps {
	editedName: string;
	setEditedName: (val: string) => void;
	saveError: string | null;
	setSaveError: (val: string | null) => void;
	isSaving: boolean;
	isLoggedIn: boolean;
	handleSave: () => void;
	handleCancel: () => void;
	nameInputRef: RefObject<HTMLInputElement | null>;
}

export function ProfileEditForm({
	editedName,
	setEditedName,
	saveError,
	setSaveError,
	isSaving,
	isLoggedIn,
	handleSave,
	handleCancel,
	nameInputRef,
}: ProfileEditFormProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className="w-full space-y-4"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
			transition={{ duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
		>
			<motion.div
				className="relative group"
				whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
				whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
				transition={{ type: "spring", stiffness: 400, damping: 25 }}
			>
				<User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none group-focus-within:text-primary transition-colors" />
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
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							hapticNavTap();
							handleSave();
						}
					}}
					className="w-full h-11 pl-10 pr-4 text-sm bg-foreground/5 hover:bg-foreground/10 focus:bg-background/80 transition-all duration-300"
				/>
			</motion.div>

			{saveError && (
				<motion.p
					initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
					animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
					role="alert"
					className="text-sm text-destructive"
				>
					{saveError}
				</motion.p>
			)}

			<div className="flex gap-2">
				{isLoggedIn && (
					<motion.div className="flex-1" whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
						<Button type="button" variant="ghost" onClick={() => {
							hapticNavTap();
							handleCancel();
						}} className="w-full h-full">
							Cancel
						</Button>
					</motion.div>
				)}
				<motion.div className={isLoggedIn ? "flex-[2]" : "w-full"} whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
					<Button
						type="submit"
						variant="glass"
						size="large"
						onClick={() => {
							hapticNavTap();
							handleSave();
						}}
						disabled={!editedName.trim() || isSaving}
						loading={isSaving}
						className="w-full"
					>
						{isLoggedIn ? "Save" : "Begin Journey"}
					</Button>
				</motion.div>
			</div>
		</motion.div>
	);
}

export interface ProfileViewProps {
	userName: string | undefined;
	isLoggingOut: boolean;
	handleEdit: () => void;
	handleLogout: () => void;
}

export function ProfileView({ userName, isLoggingOut, handleEdit, handleLogout }: ProfileViewProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className="w-full flex flex-col items-center gap-3"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
			transition={{ duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
		>
			<div className="flex items-center gap-2">
				<h3 className="text-xl font-bold text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">{userName}</h3>
				<motion.button
					type="button"
					onClick={() => {
						hapticNavTap();
						handleEdit();
					}}
					className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
					aria-label="Edit name"
					title="Edit name"
					whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 15 }}
					whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
				>
					<Pencil size={14} />
				</motion.button>
			</div>

			<p className="text-xs text-muted-foreground/80 text-center">Your preferences are saved for ranking.</p>

			<motion.button
				type="button"
				onClick={() => {
					hapticNavTap();
					handleLogout();
				}}
				disabled={isLoggingOut}
				className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
				whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
				whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
			>
				<LogOut size={13} />
				{isLoggingOut ? "Logging out..." : "Logout"}
			</motion.button>
		</motion.div>
	);
}
