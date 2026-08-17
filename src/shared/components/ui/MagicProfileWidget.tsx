import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";

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
	return (
		<motion.div
			layout={true}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="flex flex-col items-center gap-5 w-full p-2"
		>
			<motion.div layout={true} className="relative mb-1 group">
				<motion.div
					layout={true}
					className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"
					aria-hidden="true"
				/>
				<motion.div
					layout={true}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
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
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
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
						initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
						transition={{ duration: 0.3 }}
						className="w-full flex flex-col items-center gap-4"
					>
						<div className="flex items-center justify-center gap-3 bg-foreground/5 py-2 px-4 rounded-2xl border border-foreground/10">
							<h3 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
								{userName}
							</h3>
							<motion.button
								whileHover={{ scale: 1.1, rotate: 10 }}
								whileTap={{ scale: 0.9 }}
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
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
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
