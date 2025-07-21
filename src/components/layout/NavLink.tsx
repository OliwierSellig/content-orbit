import React from "react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

interface NavLinkProps {
  item: NavItem;
  currentPath: string;
  className?: string;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

export function NavLink({ item, currentPath, className, onClick, variant = "desktop" }: NavLinkProps) {
  const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
  const Icon = item.icon;

  const desktopStyles = {
    base: "hover:bg-white/10 hover:text-white",
    active: "bg-white/20 text-white font-semibold",
    inactive: "text-white/80",
  };

  const mobileStyles = {
    base: "hover:bg-foreground/10 hover:text-foreground",
    active: "bg-foreground/15 text-foreground font-semibold",
    inactive: "text-foreground/80",
  };

  const styles = variant === "mobile" ? mobileStyles : desktopStyles;

  return (
    <a
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
        styles.base,
        isActive ? styles.active : styles.inactive,
        variant === "mobile" && "hover:scale-[1.02] hover:shadow-sm",
        className
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{item.label}</span>
    </a>
  );
}
