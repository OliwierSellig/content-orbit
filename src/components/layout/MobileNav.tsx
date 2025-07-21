import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import type { NavItem } from "@/types";

interface MobileNavProps {
  navItems: NavItem[];
  currentPath: string;
}

export function MobileNav({ navItems, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // TODO: Implementacja wylogowania - na razie zaślepka zgodnie z planem MVP
    console.log("Logout clicked - functionality to be implemented");
    setIsOpen(false);
  };

  const handleLinkClick = () => {
    // Zamknij panel po kliknięciu linku
    setIsOpen(false);
  };

  return (
    <div className="flex md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            aria-label="Otwórz menu nawigacyjne"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-80 bg-background/95 backdrop-blur-md border-neutral-600 shadow-2xl mobile-menu-panel"
        >
          <SheetHeader className="pb-6">
            <SheetTitle className="text-foreground text-lg font-semibold">Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col space-y-6 px-2">
            {/* Lista linków nawigacyjnych */}
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  currentPath={currentPath}
                  onClick={handleLinkClick}
                  variant="mobile"
                  className="justify-start"
                />
              ))}
            </nav>

            {/* Separator */}
            <div className="border-t border-neutral-600/50 my-2" />

            {/* Przycisk wyloguj */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-transparent border-neutral-600/30 text-foreground hover:bg-neutral-600/20 hover:text-foreground w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              Wyloguj
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
