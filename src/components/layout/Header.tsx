import React from "react";
import { Home, Settings, Layers } from "lucide-react";
import { Logo } from "./Logo";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import type { NavItem } from "@/types";

interface HeaderProps {
  currentPath: string;
}

export function Header({ currentPath }: HeaderProps) {
  // Definicja elementów nawigacji zgodnie z planem implementacji
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      label: "Klastry",
      href: "/clusters",
      icon: Layers,
    },
    {
      label: "Opcje ",
      href: "/options",
      icon: Settings,
    },
  ];

  return (
    <header className="bg-background border-b border-neutral-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />

          {/* Nawigacja desktopowa */}
          <DesktopNav navItems={navItems} currentPath={currentPath} />

          {/* Nawigacja mobilna */}
          <MobileNav navItems={navItems} currentPath={currentPath} />
        </div>
      </div>
    </header>
  );
}
