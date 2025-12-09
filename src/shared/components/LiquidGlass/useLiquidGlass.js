import { useState, useCallback } from 'react';

/**
 * Hook for managing liquid glass effect configuration
 * Based on the improved displacement map approach
 *
 * @param {Object} initialConfig - Initial configuration overrides
 * @returns {Object} Configuration object with presets and update methods
 */
export function useLiquidGlass(initialConfig = {}) {
  const base = {
    scale: -180,
    radius: 18,
    border: 0.07,
    lightness: 50,
    outputBlur: 0.7,
    blend: 'difference',
    xChannel: 'R',
    yChannel: 'B',
    alpha: 0.93,
    inputBlur: 11,
    chromaticR: 0,
    chromaticG: 10,
    chromaticB: 20,
    saturation: 1.1,
    frost: 0.05,
    width: 200,
    height: 80,
  };

  const presets = {
    dock: {
      ...base,
      width: 336,
      height: 96,
      outputBlur: 0.7,
      frost: 0.05,
      radius: 16,
    },
    pill: {
      ...base,
      width: 200,
      height: 80,
      outputBlur: 0.5,
      frost: 0,
      radius: 40,
    },
    bubble: {
      ...base,
      radius: 70,
      width: 140,
      height: 140,
      outputBlur: 0,
      frost: 0,
    },
    free: {
      ...base,
      width: 140,
      height: 280,
      radius: 80,
      border: 0.15,
      alpha: 0.74,
      lightness: 60,
      inputBlur: 10,
      outputBlur: 0,
      scale: -300,
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
