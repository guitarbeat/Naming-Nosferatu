import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Lock, Unlock, ZoomIn } from "lucide-react";
import { memo } from "react";
import type { IdType } from "@/shared/types/core";
import type { NameItem } from "@/shared/types/name";
import { isNameHidden, isNameLocked } from "@/shared/lib/names/nameFilters";

const NameContentBase = ({ nameItem }: { nameItem: NameItem }) => (
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

export const NameContent = memo(NameContentBase);

const AdminActionButtonBase = ({
	nameItem,
	actionType,
	isProcessing,
	onClick,
}: {
	nameItem: NameItem;
	actionType: "toggle-hidden" | "toggle-locked";
	isProcessing: boolean;
	onClick: () => void;
}) => {
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
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			className={buttonClasses}
		>
			{isProcessing ? (
				<span className="flex items-center justify-center gap-1.5">
					<div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
					<span>Saving...</span>
				</span>
			) : (
				<span className="flex items-center justify-center gap-1.5">
					{isHidden ? (
						isEnabled ? (
							<>
								<Eye size={14} /> Unhide
							</>
						) : (
							<>
								<EyeOff size={14} /> Hide
							</>
						)
					) : isEnabled ? (
						<>
							<Unlock size={14} /> Unlock
						</>
					) : (
						<>
							<Lock size={14} /> Lock
						</>
					)}
				</span>
			)}
		</motion.button>
	);
};

export const AdminActionButton = memo(AdminActionButtonBase);

const SelectionBadgeBase = () => (
	<motion.div
		initial={{ scale: 0, opacity: 0 }}
		animate={{ scale: 1, opacity: 1 }}
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

export const SelectionBadge = memo(SelectionBadgeBase);

const ZoomButtonBase = ({
	nameId,
	onClick,
}: {
	nameId: IdType;
	onClick: (id: IdType) => void;
}) => {
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
};

export const ZoomButton = memo(ZoomButtonBase);
