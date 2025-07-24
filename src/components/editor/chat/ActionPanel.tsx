import React from "react";

interface ActionPanelProps {
  onGenerateBody: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ onGenerateBody, isLoading, disabled = false }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Akcje</h3>
      <button
        onClick={onGenerateBody}
        disabled={isLoading || disabled}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-200"
      >
        {isLoading ? "Generowanie..." : "Generuj treść"}
      </button>
    </div>
  );
};
