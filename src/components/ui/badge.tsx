import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "primary" | "success" | "warning" | "error" | "info" | "neutral";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "badge badge-neutral",
    outline: "badge badge-neutral border-2",
    primary: "badge badge-primary",
    success: "badge badge-success",
    warning: "badge badge-warning", 
    error: "badge badge-error",
    info: "badge badge-info",
    neutral: "badge badge-neutral",
  };

  return (
    <div
      className={cn(
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };