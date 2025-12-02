import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../../shared/utils/classNameUtils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80",
        ghost: "transition-colors hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 transition-colors hover:underline",
        login:
          "relative font-bold tracking-wide bg-[linear-gradient(135deg,var(--button-primary-bg,var(--primary-600)),var(--button-primary-hover,var(--primary-700)))] text-primary-foreground shadow-[0_4px_16px_rgb(0_0_0/0.2),0_2px_8px_rgb(0_0_0/0.15),0_0_20px_rgb(var(--primary-rgb,44,62,64)/0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_8px_24px_rgb(0_0_0/0.25),0_4px_12px_rgb(0_0_0/0.2),0_0_30px_rgb(var(--primary-rgb,44,62,64)/0.4)] hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-100 active:shadow-[0_2px_8px_rgb(0_0_0/0.2),0_0_15px_rgb(var(--primary-rgb,44,62,64)/0.25)] before:absolute before:inset-0 before:content-[''] before:bg-[linear-gradient(135deg,rgb(255_255_255/0.1),transparent_50%,rgb(255_255_255/0.05))] before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 before:pointer-events-none hover:before:opacity-100 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-[0_2px_4px_rgb(0_0_0/0.1)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // If className is provided, it should override variant styles
    // Put className last so it can override Tailwind classes
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
