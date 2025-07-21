import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base layout and typography
        "h-12 w-full rounded px-4 py-2.5 text-base font-normal leading-normal",
        // Explicit border and background
        "border-2 border-solid border-neutral-600 bg-neutral-800 text-neutral-200",
        // Placeholder color
        "placeholder:text-neutral-500",
        // Hover states
        "hover:border-neutral-500 hover:bg-neutral-750",
        // Focus states
        "focus-visible:outline-none focus-visible:border-neutral-400 focus-visible:bg-neutral-750",
        "focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.2)]",
        // Error states
        "aria-invalid:border-destructive aria-invalid:bg-red-950/20",
        "aria-invalid:shadow-[0_0_0_3px_rgba(212,74,132,0.2)]",
        // Smooth transitions
        "transition-[border-color,background-color,box-shadow] duration-200 ease-out",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
