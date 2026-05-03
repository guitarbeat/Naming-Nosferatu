import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";
import { SpinnerCircle } from "@/shared/components/layout/Feedback/Loading";
import loadingPreview from "@assets/image_1777773918924.png";

const CAT_NAMES = ["NOSFERATU", "SMEEMO", "ORBIT", "NOVA", "NEDJEM", "WOODS", "LUNA"];

interface AppBootScreenProps {
        message?: string;
        visible?: boolean;
}

export function AppBootScreen({ message = "Preparing the tournament...", visible }: AppBootScreenProps) {
        const isBootLoading = useAppStore((state: { ui: { isBootLoading: boolean } }) => state.ui.isBootLoading);
        const shouldRender = visible ?? isBootLoading;

        const [nameIdx, setNameIdx] = useState(0);
        const [nameVisible, setNameVisible] = useState(true);

        useEffect(() => {
                if (!shouldRender) return;
                const id = setInterval(() => {
                        setNameVisible(false);
                        setTimeout(() => {
                                setNameIdx((i) => (i + 1) % CAT_NAMES.length);
                                setNameVisible(true);
                        }, 320);
                }, 1500);
                return () => clearInterval(id);
        }, [shouldRender]);

        if (!shouldRender) return null;

        return (
                <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#080c12] px-6"
                        role="status"
                        aria-label="Loading application"
                >
                        <div
                                className="pointer-events-none absolute inset-0"
                                aria-hidden="true"
                                style={{
                                        background: `
                                                radial-gradient(ellipse 70% 50% at 20% 15%, hsl(190 55% 18% / 0.28) 0%, transparent 60%),
                                                radial-gradient(ellipse 55% 45% at 85% 80%, hsl(16 71% 22% / 0.18) 0%, transparent 55%)
                                        `,
                                }}
                        />

                        <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
                                <img
                                        src={loadingPreview}
                                        alt="Loading screen preview"
                                        className="mb-8 w-full max-w-[22rem] select-none object-contain"
                                />

                                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
                                        My cat's name is
                                </p>

                                <div className="my-4 h-px w-12 bg-gradient-to-r from-transparent via-white/28 to-transparent" />

                                <p
                                        className="font-display font-black uppercase text-white"
                                        style={{
                                                fontSize: "clamp(2.618rem, 9vw, 5.5rem)",
                                                lineHeight: 0.88,
                                                letterSpacing: "-0.045em",
                                                opacity: nameVisible ? 1 : 0,
                                                transition: "opacity 0.3s ease",
                                        }}
                                        aria-live="polite"
                                        aria-atomic="true"
                                >
                                        {CAT_NAMES[nameIdx]}
                                </p>

                                <div className="mt-12 flex flex-col items-center gap-3">
                                        <SpinnerCircle size="small" />
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">
                                                {message}
                                        </p>
                                </div>
                        </div>
                </div>
        );
}
