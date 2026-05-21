/**
 * Shared Tailwind class groups aligned with design tokens in src/styles/tokens.css.
 * Prefer these over ad-hoc border-white/10 and bg-black/15 patterns.
 */
export const themeSurfaces = {
	panel:
		"rounded-2xl border border-border/45 bg-card/50 backdrop-blur-xl shadow-sm ring-1 ring-inset ring-[color-mix(in_srgb,var(--foreground)_6%,transparent)]",
	panelInset:
		"overflow-hidden rounded-2xl border border-border/40 bg-card/40 ring-1 ring-inset ring-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
	panelDense: "rounded-xl border border-border/40 bg-card/40",
	rowDivider: "border-b border-border/40 last:border-b-0",
	avatar: "border border-border/50 bg-foreground/[0.04]",
	statTile:
		"flex flex-col items-center justify-center gap-2 rounded-xl border border-border/35 bg-card/30 px-4 py-5 text-center",
	statIcon: "rounded-lg border border-border/35 bg-foreground/[0.03] text-muted-foreground/70",
	statIconAccent: "rounded-lg border border-primary/20 bg-primary/10 text-primary",
	badge:
		"inline-flex items-center rounded-full border border-border/35 bg-card/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60",
	badgeAccent:
		"inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/85",
} as const;

export const themeText = {
	eyebrow: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60",
	eyebrowWide: "text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/55",
	sectionLabel: "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/65",
	subtitle: "text-sm leading-relaxed text-muted-foreground/55",
	statValue: "text-2xl font-semibold leading-none text-foreground/90",
	heroDisplay: "font-black uppercase leading-[0.88] tracking-tighter text-foreground",
	heroPlaceholder: "text-muted-foreground/25",
} as const;
