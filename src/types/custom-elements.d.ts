// biome-ignore lint/style/noNamespace: React definitions require this namespace pattern
declare namespace JSX {
	interface IntrinsicElements {
		"lightbox-image": React.DetailedHTMLProps<
			React.HTMLAttributes<HTMLElement> & {
				"dialog-id": string;
			},
			HTMLElement
		>;
	}
}
