import React from "react";
import type { CustomAuditDto } from "../../../types";

interface SlashCommandMenuProps {
  customAudits: CustomAuditDto[];
  isVisible: boolean;
  onSelectCommand: (prompt: string) => void;
  position: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  customAudits,
  isVisible,
  onSelectCommand,
  position,
}) => {
  if (!isVisible || customAudits.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute z-10 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg max-w-xs w-64"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2">
        <div className="text-xs text-neutral-400 mb-2 px-2">Dostępne audyty:</div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {customAudits.map((audit) => (
            <button
              key={audit.id}
              onClick={() => onSelectCommand(audit.prompt)}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none transition-colors"
            >
              <div className="font-medium text-white">{audit.title}</div>
              <div className="text-xs text-neutral-400 truncate">
                {audit.prompt.length > 60 ? `${audit.prompt.substring(0, 60)}...` : audit.prompt}
              </div>
            </button>
          ))}
        </div>
        {customAudits.length === 0 && (
          <div className="text-center text-neutral-500 text-sm py-4">Brak dostępnych audytów</div>
        )}
      </div>
    </div>
  );
};
