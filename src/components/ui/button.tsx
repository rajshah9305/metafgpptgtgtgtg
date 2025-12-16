import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "btn focus-ring";
    
    const variantClasses = {
      "default": "btn-primary",
      "outline": "btn-outline", 
      "ghost": "btn-ghost",
      "secondary": "btn-secondary",
    };
    
    const sizeClasses = {
      "default": "btn-base",
      "sm": "btn-sm",
      "lg": "btn-lg",
      "icon": "btn-sm w-10 h-10 p-2",
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };