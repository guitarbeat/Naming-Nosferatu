import { ChevronDown, Search, X } from "lucide-react";
import { type ChangeEvent, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SelectComboboxOption {
	value: string;
	label: string;
}

interface SelectComboboxProps {
	options: readonly SelectComboboxOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	ariaLabel?: string;
	size?: "small" | "medium";
}

export function SelectCombobox({
	options,
	value,
	onChange,
	placeholder = "Select option...",
	disabled = false,
	ariaLabel,
	size = "medium",
}: SelectComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const selectedOption = options.find((o) => o.value === value);
	const filteredOptions = options.filter((o) =>
		o.label.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleSelect = useCallback(
		(optionValue: string) => {
			onChange(optionValue);
			setIsOpen(false);
			setSearchTerm("");
		},
		[onChange],
	);

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		setSearchTerm("");
	};

	const sizeStyles = size === "small" ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm";

	return (
		<div className="relative w-full max-w-xs" aria-label={ariaLabel}>
			{/* Trigger button */}
			<motion.button
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className={`w-full flex items-center justify-between gap-2 rounded-lg border border-border/20 bg-background ${sizeStyles} text-foreground transition-all ${
					isOpen ? "border-primary/40 ring-2 ring-primary/10" : "hover:border-border/40"
				} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
				whileHover={!disabled && !isOpen ? { borderColor: "var(--color-border)" } : {}}
				whileTap={!disabled ? { scale: 0.98 } : {}}
			>
				<span className="truncate text-foreground/80">
					{selectedOption?.label || placeholder}
				</span>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
					className="flex-shrink-0"
				>
					<ChevronDown size={size === "small" ? 14 : 16} className="text-foreground/40" />
				</motion.div>
			</motion.button>

			{/* Dropdown menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 w-full mt-2 bg-background border border-border/30 rounded-lg shadow-lg overflow-hidden"
						onMouseLeave={() => setIsOpen(false)}
					>
						{/* Search input */}
						{options.length > 4 && (
							<div className="border-b border-border/20 p-2">
								<div className="relative flex items-center">
									<Search size={14} className="absolute left-2.5 text-foreground/40" />
									<input
										autoFocus
										type="text"
										placeholder="Search..."
										value={searchTerm}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setSearchTerm(e.target.value)
										}
										onClick={(e) => e.stopPropagation()}
										className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted border border-border/20 rounded text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
										aria-label="Search options"
									/>
									{searchTerm && (
										<motion.button
											onClick={handleClear}
											initial={{ opacity: 0, scale: 0 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0 }}
											className="absolute right-2.5 text-foreground/40 hover:text-foreground/60 transition-colors"
										>
											<X size={14} />
										</motion.button>
									)}
								</div>
							</div>
						)}

						{/* Options list */}
						<motion.div className="max-h-64 overflow-y-auto">
							{filteredOptions.length > 0 ? (
								filteredOptions.map((option, index) => (
									<motion.button
										key={option.value}
										onClick={() => handleSelect(option.value)}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.02 }}
										className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
											value === option.value
												? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
												: "text-foreground/80 hover:bg-muted/50 border-l-2 border-transparent"
										}`}
										whileHover={{ paddingLeft: 16 }}
									>
										{option.label}
									</motion.button>
								))
							) : (
								<div className="px-3 py-4 text-center text-sm text-foreground/40">
									No options found
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
