import { useEffect, useState } from "react";
import { SpinnerCircle } from "@/shared/components/layout/Feedback/Loading";
import { TIMING } from "@/shared/lib/constants";
import { themeText } from "@/shared/lib/themeClasses";
import useAppStore from "@/store/appStore";

const LOADING_PREVIEW = "/assets/images/loading-preview.png";

const CAT_NAMES = ["NOSFERATU", "SMEEMO", "ORBIT", "NOVA", "NEDJEM", "WOODS", "LUNA"];

interface AppBootScreenProps {
	message?: string;
	visible?: boolean;
}

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible,
}: AppBootScreenProps) {
	const isBootLoading = useAppStore(
		(state: { ui: { isBootLoading: boolean } }) => state.ui.isBootLoading,
	);
	const shouldRender = visible ?? isBootLoading;

	const [nameIdx, setNameIdx] = useState(0);
	const [nameVisible, setNameVisible] = useState(true);

	useEffect(() => {
		if (!shouldRender) {
			return;
		}
		const id = setInterval(() => {
			setNameVisible(false);
			setTimeout(() => {
				setNameIdx((i) => (i + 1) % CAT_NAMES.length);
				setNameVisible(true);
			}, TIMING.MOTION_FAST * 1000);
		}, TIMING.MOTION_CYCLE);
		return () => clearInterval(id);
	}, [shouldRender]);

	if (!shouldRender) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[var(--app-boot-bg)] px-6"
			role="status"
			aria-label="Loading application"
		>
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `
						radial-gradient(ellipse 70% 50% at 20% 15%, hsl(var(--pw-sage-hsl) / 0.22) 0%, transparent 60%),
						radial-gradient(ellipse 55% 45% at 85% 80%, hsl(var(--pw-coral-hsl) / 0.16) 0%, transparent 55%)
                                        `,
				}}
			/>

			<div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
				<img
					src={LOADING_PREVIEW}
					alt="Loading screen preview"
					className="mb-8 w-full max-w-[22rem] select-none object-contain"
				/>

				<p className={`${themeText.eyebrowWide} tracking-[0.32em]`}>My cat's name is</p>

				<div className="my-4 h-px w-12 bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

				<p
					className={`font-display ${themeText.heroDisplay}`}
					style={{
						fontSize: "clamp(2.618rem, 9vw, 5.5rem)",
						lineHeight: 0.88,
						letterSpacing: "-0.045em",
						opacity: nameVisible ? 1 : 0,
						transition: `opacity ${TIMING.MOTION_FAST}s ${TIMING.MOTION_EASING}`,
					}}
					aria-live="polite"
					aria-atomic="true"
				>
					{CAT_NAMES[nameIdx]}
				</p>

				<div className="mt-12 flex flex-col items-center gap-3">
					<SpinnerCircle size="small" />
					<p className={`${themeText.eyebrow} tracking-[0.26em]`}>{message}</p>
				</div>
			</div>
		</div>
	);
}
