import type React from "react";
import { memo } from "react";
import { cn } from "@/shared/lib/utils";

const LOADING_ASSET = "/assets/images/cat.gif";

interface LoadingProps {
	variant?: "spinner" | "skeleton" | "card-skeleton" | "cat-gif";
	text?: string;
	className?: string;
	height?: string | number;
}

export function SpinnerCircle({
	size = "medium",
	className,
}: {
	size?: "small" | "medium";
	className?: string;
}) {
	const dimensions = size === "small" ? "h-6 w-6 border-2" : "h-8 w-8 border-4";

	return (
		<div
			className={cn(
				"animate-spin rounded-full border-white/10 border-t-primary border-r-primary/60",
				dimensions,
				className,
			)}
			aria-hidden={true}
		/>
	);
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12),rgba(255,255,255,0.04))] bg-[length:200%_100%]",
				className,
			)}
			style={style}
			aria-hidden={true}
		/>
	);
}

export const Loading: React.FC<LoadingProps> = memo(
	({ variant = "spinner", text, className = "", height = 20 }) => {
		const containerClasses = cn("flex flex-col items-center justify-center gap-3 p-4", className);

		if (variant === "skeleton") {
			return (
				<SkeletonBlock
					className={cn("rounded-lg", className)}
					style={{
						width: "100%",
						height: typeof height === "number" ? `${height}px` : height,
					}}
				/>
			);
		}

		if (variant === "card-skeleton") {
			return (
				<div
					className={cn(
						"flex flex-col gap-3 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm",
						className,
					)}
					style={{
						width: "100%",
						height: typeof height === "number" ? `${height}px` : height,
						minHeight: typeof height === "number" ? `${height}px` : "200px",
					}}
				>
					<div className="flex items-center gap-3">
						<SkeletonBlock className="h-10 w-10 rounded-full" />
						<div className="flex flex-1 flex-col gap-2">
							<SkeletonBlock className="h-4 w-3/4" />
							<SkeletonBlock className="h-3 w-1/2" />
						</div>
					</div>
					<SkeletonBlock className="min-h-[100px] w-full flex-1" />
					<div className="flex justify-end pt-2">
						<SkeletonBlock className="h-8 w-20" />
					</div>
					{text && <div className="pt-2 text-center text-xs text-white/50">{text}</div>}
				</div>
			);
		}

		if (variant === "cat-gif") {
			return (
				<div className={containerClasses} role="status" aria-label="Loading" aria-busy="true">
					<img
						src={LOADING_ASSET}
						alt=""
						aria-hidden="true"
						className="h-44 w-auto select-none object-contain opacity-95"
					/>
					{text && (
						<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">
							{text}
						</p>
					)}
				</div>
			);
		}

		return (
			<div className={containerClasses} role="status" aria-label="Loading" aria-busy="true">
				<SpinnerCircle />
				{text ? (
					<p className="mt-2 text-sm font-medium text-white/70">{text}</p>
				) : (
					<span className="sr-only">Loading...</span>
				)}
			</div>
		);
	},
);

Loading.displayName = "Loading";
