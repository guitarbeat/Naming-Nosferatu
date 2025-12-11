import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass";
import { TOOLBAR_GLASS_CONFIGS } from "./toolbarConstants";

/**
 * ToolbarGlass - Shared wrapper for LiquidGlass with mode-specific configurations
 */
function ToolbarGlass({ mode, id, className, style, children }) {
  const config = TOOLBAR_GLASS_CONFIGS[mode] || TOOLBAR_GLASS_CONFIGS.filter;

  return (
    <LiquidGlass
      id={id}
      width={config.width}
      height={config.height}
      radius={config.radius}
      scale={config.scale}
      saturation={config.saturation}
      frost={config.frost}
      inputBlur={config.inputBlur}
      outputBlur={config.outputBlur}
      className={className}
      style={{ width: "100%", height: "auto", ...style }}
    >
      {children}
    </LiquidGlass>
  );
}

ToolbarGlass.propTypes = {
  mode: PropTypes.oneOf(["tournament", "filter"]).isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};

export default ToolbarGlass;
