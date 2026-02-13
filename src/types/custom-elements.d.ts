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
