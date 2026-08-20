import { motion } from "framer-motion";
import { Check, CheckCircle, Eye, ZoomIn } from "lucide-react";
import { memo } from "react";
import CatImage from "@/shared/components/layout/CatImage";
import { isNameHidden, isNameLocked } from "@/shared/lib/names/nameFilters";
import type { IdType, NameItem } from "@/shared/types";

const getCardStyles = (isSelected: boolean, isLocked: boolean) =>
	[
		"mobile-readable-card relative group overflow-hidden rounded-[1.35rem] border cursor-pointer transition-[transform,box-shadow,background-color,border-color,opacity] duration-300 active:scale-[0.96]",
		isSelected
			? "z-10 border-primary/45 bg-gradient-to-br from-primary/14 to-white/[0.04] shadow-[0_20px_45px_rgba(39,135,153,0.2)] ring-1 ring-primary/25"
			: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_16px_40px_rgba(6,12,24,0.18)]",
		isLocked ? "cursor-not-allowed opacity-55 saturate-50" : "",
	].join(" ");

const nameOverlayClasses =
	"absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 sm:p-5 text-center";

const NameContent = memo(function NameContent({ nameItem }: { nameItem: NameItem }) {
	return (
		<>
			<span className="w-full break-words font-whimsical text-2xl leading-[0.92] tracking-tight text-white sm:text-[2rem] drop-shadow-lg">
				{nameItem.name}
			</span>
			{nameItem.pronunciation ? (
				<span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
					[{nameItem.pronunciation}]
				</span>
			) : null}
			{nameItem.description ? (
				<p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/72 sm:text-sm">
					{nameItem.description}
				</p>
			) : null}
		</>
	);
});

const AdminActionButton = memo(function AdminActionButton({
	nameItem,
	actionType,
	isProcessing,
	onClick,
	prefersReducedMotion,
}: {
	nameItem: NameItem;
	actionType: "toggle-hidden" | "toggle-locked";
	isProcessing: boolean;
	onClick: () => void;
	prefersReducedMotion: boolean;
}) {
	const isHidden = actionType === "toggle-hidden";
	const isEnabled = isHidden ? isNameHidden(nameItem) : isNameLocked(nameItem);
	const buttonClasses = `flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
		isHidden
			? isEnabled
				? "bg-success hover:bg-success/80 text-success-foreground shadow-success/25"
				: "bg-destructive hover:bg-destructive/80 text-destructive-foreground shadow-destructive/25"
			: isEnabled
				? "bg-muted hover:bg-muted/80 text-muted-foreground shadow-muted/25"
				: "bg-warning hover:bg-warning/80 text-warning-foreground shadow-warning/25"
	} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} shadow-lg`;

	return (
		<motion.button
			type="button"
			onClick={onClick}
			disabled={isProcessing}
			whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
			whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			className={buttonClasses}
		>
			{isProcessing ? (
				<div className="flex items-center justify-center gap-1">
					<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
					<span>Processing...</span>
				</div>
			) : isHidden ? (
				<>
					<Eye size={12} className="mr-1" />
					{isEnabled ? "Unhide" : "Hide"}
				</>
			) : (
				<>
					<CheckCircle size={12} className="mr-1" />
					{isEnabled ? "Unlock" : "Lock"}
				</>
			)}
		</motion.button>
	);
});

const SelectionBadge = ({ prefersReducedMotion }: { prefersReducedMotion: boolean }) => (
	<motion.div
		initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
		animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
		className="absolute top-3 right-3 z-20"
	>
		<div className="relative">
			<div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
			<div className="relative size-6 sm:size-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-primary/50">
				<Check size={14} className="text-primary-foreground" strokeWidth={3} />
			</div>
		</div>
	</motion.div>
);

function ZoomButton({ nameId, onClick }: { nameId: IdType; onClick: (id: IdType) => void }) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick(nameId);
			}}
			className="absolute top-3 right-3 p-2 sm:p-2.5 rounded-full bg-foreground/70 backdrop-blur-md text-background opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none transition-all duration-300 hover:bg-foreground/90 hover:scale-110 z-10"
			aria-label="View full size"
			title="View full size"
		>
			<ZoomIn size={14} />
		</button>
	);
}

export type PendingAdminAction = {
	type: "toggle-hidden" | "toggle-locked";
	nameId: IdType;
	isCurrentlyEnabled: boolean;
};

interface NameCardProps {
	nameItem: NameItem;
	isSelected: boolean;
	catImage: string;
	prefersReducedMotion: boolean;
	isAdmin: boolean;
	isTogglingHidden: boolean;
	isTogglingLocked: boolean;
	onToggleName: (id: IdType) => void;
	onOpenLightbox: (id: IdType) => void;
	onRequestAdminAction: (action: PendingAdminAction) => void;
}

export const NameCard = memo(function NameCard({
	nameItem,
	isSelected,
	catImage,
	prefersReducedMotion,
	isAdmin,
	isTogglingHidden,
	isTogglingLocked,
	onToggleName,
	onOpenLightbox,
	onRequestAdminAction,
}: NameCardProps) {
	return (
		<motion.div
			role="button"
			tabIndex={0}
			onClick={() => onToggleName(nameItem.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggleName(nameItem.id);
				}
			}}
			aria-pressed={isSelected}
			aria-label={`${isSelected ? "Deselect" : "Select"} name: ${nameItem.name}`}
			whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -2 }}
			whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			className={getCardStyles(isSelected, isNameLocked(nameItem))}
		>
			<div className="w-full relative aspect-[5/4] sm:aspect-[4/3] group/img overflow-hidden">
				<CatImage
					src={catImage}
					alt={nameItem.name}
					containerClassName="w-full h-full"
					imageClassName="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
				/>
				{isSelected && <SelectionBadge prefersReducedMotion={prefersReducedMotion} />}
				<div className={nameOverlayClasses}>
					<div className="flex flex-col items-center gap-1.5 max-w-full">
						<NameContent nameItem={nameItem} />
					</div>
				</div>
				<ZoomButton nameId={nameItem.id} onClick={onOpenLightbox} />
			</div>
			{isAdmin && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="px-3 pb-3 flex gap-2"
				>
					<AdminActionButton
						nameItem={nameItem}
						actionType="toggle-hidden"
						isProcessing={isTogglingHidden}
						prefersReducedMotion={prefersReducedMotion}
						onClick={() =>
							onRequestAdminAction({
								type: "toggle-hidden",
								nameId: nameItem.id,
								isCurrentlyEnabled: isNameHidden(nameItem),
							})
						}
					/>
					<AdminActionButton
						nameItem={nameItem}
						actionType="toggle-locked"
						isProcessing={isTogglingLocked}
						prefersReducedMotion={prefersReducedMotion}
						onClick={() =>
							onRequestAdminAction({
								type: "toggle-locked",
								nameId: nameItem.id,
								isCurrentlyEnabled: isNameLocked(nameItem),
							})
						}
					/>
				</motion.div>
			)}
		</motion.div>
	);
});
