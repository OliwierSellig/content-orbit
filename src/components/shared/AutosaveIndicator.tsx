import React from "react";

interface AutosaveIndicatorProps {
  isDirty: boolean;
  autosaveStatus: "idle" | "saving" | "success" | "error";
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ isDirty, autosaveStatus }) => {
  return (
    <div className="flex items-center gap-2">
      {isDirty && <span className="text-amber-400 text-sm">● Niezapisane zmiany</span>}
      {autosaveStatus === "saving" && <span className="text-blue-400 text-sm">💾 Zapisywanie...</span>}
      {autosaveStatus === "success" && <span className="text-green-400 text-sm">✓ Zapisano</span>}
      {autosaveStatus === "error" && <span className="text-red-400 text-sm">✗ Błąd zapisu</span>}
    </div>
  );
};
