import React from "react";
import { PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  ariaLabel,
}: {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "p-2 rounded-md cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      isActive
        ? "bg-neutral-700 text-white hover:bg-neutral-600"
        : "bg-transparent text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-200"
    )}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isLeftPanelOpen,
  isRightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
}) => {
  return (
    <div className="flex w-full">
      <div className="flex items-center gap-2 bg-neutral-800/80 backdrop-blur-md border border-neutral-700/50 rounded-lg p-1.5 shadow-lg">
        <ToolbarButton
          onClick={onToggleLeftPanel}
          isActive={isLeftPanelOpen}
          ariaLabel={isLeftPanelOpen ? "Schowaj lewy panel" : "Pokaż lewy panel"}
        >
          <PanelLeft className="w-5 h-5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={onToggleRightPanel}
          isActive={isRightPanelOpen}
          ariaLabel={isRightPanelOpen ? "Schowaj prawy panel" : "Pokaż prawy panel"}
        >
          <PanelRight className="w-5 h-5" />
        </ToolbarButton>
      </div>
    </div>
  );
};
