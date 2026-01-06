/**
 * @module useScreenSize
 * @description Hook to detect screen size breakpoints
 */

import { useEffect, useState } from "react";

export interface ScreenSize {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isSmallMobile: boolean;
}

export function useScreenSize(): ScreenSize {
    const [screenSize, setScreenSize] = useState<ScreenSize>({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isSmallMobile: false,
    });

    useEffect(() => {
        const updateScreenSize = () => {
            const width = window.innerWidth;
            setScreenSize({
                isMobile: width <= 768,
                isTablet: width > 768 && width <= 1024,
                isDesktop: width > 1024,
                isSmallMobile: width <= 430,
            });
        };
        updateScreenSize();
        window.addEventListener("resize", updateScreenSize);
        window.addEventListener("orientationchange", updateScreenSize);
        return () => {
            window.removeEventListener("resize", updateScreenSize);
            window.removeEventListener("orientationchange", updateScreenSize);
        };
    }, []);

    return screenSize;
}

export default useScreenSize;
