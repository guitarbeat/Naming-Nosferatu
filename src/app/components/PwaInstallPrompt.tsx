import "@khmyznikov/pwa-install";
import { useEffect, useRef } from "react";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";

const INSTALL_DESCRIPTION =
	"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";

const PWA_TINT = "hsl(190, 58%, 38%)";

/**
 * Cross-browser PWA install dialog (Chromium prompt + Apple share instructions).
 * @see https://github.com/khmyznikov/pwa-install
 */
export function PwaInstallPrompt() {
	const installRef = useRef<PWAInstallElement | null>(null);

	useEffect(() => {
		const element = installRef.current;
		if (!element) {
			return;
		}

		element.manifestUrl = "/manifest.json";
		element.useLocalStorage = true;
		element.installDescription = INSTALL_DESCRIPTION;
		element.styles = { "--tint-color": PWA_TINT };

		const deferred = window.__deferredPwaPrompt;
		if (deferred) {
			element.externalPromptEvent = deferred;
		}
	}, []);

	return <pwa-install ref={installRef} />;
}
