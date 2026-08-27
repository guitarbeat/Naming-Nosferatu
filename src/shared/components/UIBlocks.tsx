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
import useAppStore from "@/store";

export * from "./FloatingNav";
export * from "./MagicToggle";
export * from "./ProfileWidget";

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

export * from "./SearchFilterBar";

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
