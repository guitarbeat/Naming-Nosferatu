/**
 * @module Card
 * @description Reusable card component with flexible styling options
 */
import React, { useId, memo } from "react";
import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass";
import styles from "./Card.module.css";

const buildCardClasses = (variant, padding, shadow, border, background, liquidGlass, className) => {
  return [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    styles[`shadow-${shadow}`],
    border ? styles.bordered : "",
    background !== "solid" && background !== "glass" && !liquidGlass
      ? styles[`background-${background}`]
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
};

const buildContentClasses = (variant, padding, shadow, border) => {
  return [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    styles[`shadow-${shadow}`],
    border ? styles.bordered : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const Card = memo(
  React.forwardRef(
    (
      {
        children,
        className = "",
        variant = "default",
        padding = "medium",
        shadow = "medium",
        border = false,
        background = "solid",
        as: Component = "div",
        liquidGlass,
        ...props
      },
      ref,
    ) => {
      const cardClasses = buildCardClasses(
        variant,
        padding,
        shadow,
        border,
        background,
        liquidGlass,
        className,
      );

      // * If liquidGlass is enabled OR background is "glass", wrap content in LiquidGlass
      const shouldUseLiquidGlass = liquidGlass || background === "glass";
      // * Generate unique ID for this LiquidGlass instance
      const glassId = useId();

      if (shouldUseLiquidGlass) {
        // * Default config for glass background or custom liquidGlass config
        const defaultGlassConfig = {
          width: 300,
          height: 200,
          radius: 16,
          scale: -180,
          saturation: 1.1,
          frost: 0.05,
          inputBlur: 11,
          outputBlur: 0.7,
        };

        const {
          width = defaultGlassConfig.width,
          height = defaultGlassConfig.height,
          radius = defaultGlassConfig.radius,
          scale = defaultGlassConfig.scale,
          saturation = defaultGlassConfig.saturation,
          frost = defaultGlassConfig.frost,
          inputBlur = defaultGlassConfig.inputBlur,
          outputBlur = defaultGlassConfig.outputBlur,
          id,
          ...glassProps
        } = typeof liquidGlass === "object" ? liquidGlass : defaultGlassConfig;

        // * Separate wrapper classes (for LiquidGlass) from content classes
        const wrapperClasses = [className].filter(Boolean).join(" ");
        const contentClasses = buildContentClasses(variant, padding, shadow, border);

        return (
          <LiquidGlass
            id={id || `card-glass-${glassId.replace(/:/g, "-")}`}
            width={width}
            height={height}
            radius={radius}
            scale={scale}
            saturation={saturation}
            frost={frost}
            inputBlur={inputBlur}
            outputBlur={outputBlur}
            className={wrapperClasses}
            style={{ width: "100%", height: "auto", ...props.style }}
            {...glassProps}
          >
            <Component ref={ref} className={contentClasses} {...props}>
              {children}
            </Component>
          </LiquidGlass>
        );
      }

      return (
        <Component ref={ref} className={cardClasses} {...props}>
          {children}
        </Component>
      );
    },
  ),
);

Card.displayName = "Card";

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "elevated", "outlined", "filled"]),
  padding: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
  shadow: PropTypes.oneOf(["none", "small", "medium", "large", "xl"]),
  border: PropTypes.bool,
  background: PropTypes.oneOf(["solid", "glass", "gradient", "transparent"]),
  as: PropTypes.elementType,
  liquidGlass: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      radius: PropTypes.number,
      scale: PropTypes.number,
      saturation: PropTypes.number,
      frost: PropTypes.number,
      inputBlur: PropTypes.number,
      outputBlur: PropTypes.number,
    }),
  ]),
};

export default Card;
