/**
 * @module glassConfig
 * @description Shared liquid glass configuration utilities
 */

/**
 * Default liquid glass configuration
 */
export const DEFAULT_GLASS_CONFIG = {
  width: 300,
  height: 200,
  radius: 16,
  scale: -180,
  saturation: 1.1,
  frost: 0.05,
  inputBlur: 11,
  outputBlur: 0.7,
};

/**
 * Header-specific liquid glass configuration
 */
export const HEADER_GLASS_CONFIG = {
  width: 800,
  height: 80,
  radius: 12,
  scale: -180,
  saturation: 1.2,
  frost: 0.08,
  inputBlur: 12,
  outputBlur: 0.8,
};

/**
 * Resolve liquid glass config from prop
 * @param {boolean|Object} liquidGlass - Liquid glass prop
 * @param {Object} defaultConfig - Default configuration to use
 * @returns {Object} Resolved configuration
 */
export function resolveGlassConfig(liquidGlass, defaultConfig) {
  if (typeof liquidGlass === "object") {
    return {
      width: liquidGlass.width ?? defaultConfig.width,
      height: liquidGlass.height ?? defaultConfig.height,
      radius: liquidGlass.radius ?? defaultConfig.radius,
      scale: liquidGlass.scale ?? defaultConfig.scale,
      saturation: liquidGlass.saturation ?? defaultConfig.saturation,
      frost: liquidGlass.frost ?? defaultConfig.frost,
      inputBlur: liquidGlass.inputBlur ?? defaultConfig.inputBlur,
      outputBlur: liquidGlass.outputBlur ?? defaultConfig.outputBlur,
      id: liquidGlass.id,
      ...Object.fromEntries(
        Object.entries(liquidGlass).filter(
          ([key]) =>
            ![
              "width",
              "height",
              "radius",
              "scale",
              "saturation",
              "frost",
              "inputBlur",
              "outputBlur",
              "id",
            ].includes(key),
        ),
      ),
    };
  }
  return defaultConfig;
}
