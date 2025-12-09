import { useState, useCallback } from 'react';

/**
 * Hook for managing liquid glass effect configuration
 * Replaces the traditional frost-based configuration with liquid glass parameters
 */
export function useLiquidGlass(initialConfig = {}) {
  const base = {
    icons: false,
    scale: -180,
    radius: 16,
    border: 0.07,
    lightness: 50,
    displace: 0.3,
    blend: 'difference',
    xChannel: 'R',
    yChannel: 'B',
    alpha: 0.93,
    blur: 11,
    chromaticR: 0,
    chromaticG: 10,
    chromaticB: 20,
    saturation: 1,
    turbulence: 0.3, // * Liquid glass specific - replaces frost
    width: 336,
    height: 96,
  };

  const presets = {
    dock: {
      ...base,
      width: 336,
      height: 96,
      displace: 0.35,
      icons: true,
      turbulence: 0.25, // * Lower turbulence for dock
    },
    pill: {
      ...base,
      width: 200,
      height: 80,
      displace: 0,
      turbulence: 0.15,
      radius: 40,
    },
    bubble: {
      ...base,
      radius: 70,
      width: 140,
      height: 140,
      displace: 0.25,
      turbulence: 0.2,
    },
    free: {
      ...base,
      width: 140,
      height: 280,
      radius: 80,
      border: 0.15,
      alpha: 0.74,
      lightness: 60,
      blur: 10,
      displace: 0,
      scale: -300,
      turbulence: 0.35, // * Higher turbulence for free mode
    },
  };

  const [config, setConfig] = useState({
    ...presets.dock,
    ...initialConfig,
    preset: initialConfig.preset || 'dock',
  });

  const updateConfig = useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const setPreset = useCallback(
    (presetName) => {
      if (presets[presetName]) {
        setConfig((prev) => ({
          ...prev,
          ...presets[presetName],
          preset: presetName,
        }));
      }
    },
    []
  );

  return {
    config,
    updateConfig,
    setPreset,
    presets,
  };
}

export default useLiquidGlass;
