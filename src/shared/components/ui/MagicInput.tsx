import { motion } from "framer-motion";
import type { ReactNode, RefObject } from "react";
import { Input } from "@/shared/components/layout/FormPrimitives";

interface MagicInputProps {
	value: string;
	onChange: (val: string) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	placeholder?: string;
	icon?: ReactNode;
	inputRef?: RefObject<HTMLInputElement | null>;
}

export function MagicInput({
	value,
	onChange,
	onKeyDown,
	placeholder,
	icon,
	inputRef,
}: MagicInputProps) {
	return (
		<motion.div
			className="relative group w-full"
			whileFocus={{ scale: 1.02 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
		>
			<div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/50 to-accent/50 opacity-0 group-focus-within:opacity-100 blur transition duration-300" />
			<div className="relative flex items-center bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
				{icon && (
					<div className="pl-3 pr-2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
						{icon}
					</div>
				)}
				<Input
					ref={inputRef}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					onKeyDown={onKeyDown}
					className="w-full h-12 bg-transparent border-none focus:ring-0 px-3 text-base shadow-none"
				/>
			</div>
		</motion.div>
	);
}
