import React from "react";
import { Button } from "@/components/ui/button";
import { NavLink } from "./NavLink";
import type { NavItem } from "@/types";

interface DesktopNavProps {
  navItems: NavItem[];
  currentPath: string;
}

export function DesktopNav({ navItems, currentPath }: DesktopNavProps) {
  const handleLogout = () => {
    // TODO: Implementacja wylogowania - na razie zaślepka zgodnie z planem MVP
    console.log("Logout clicked - functionality to be implemented");
  };

  return (
    <nav className="hidden md:flex pl-5 items-center justify-between flex-1">
      {/* Lista linków nawigacyjnych po lewej stronie */}
      <ul className="flex items-center space-x-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavLink item={item} currentPath={currentPath} />
          </li>
        ))}
      </ul>

      {/* Przycisk wyloguj po prawej stronie */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
      >
        Wyloguj
      </Button>
    </nav>
  );
}
