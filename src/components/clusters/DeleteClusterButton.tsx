import React from "react";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

interface DeleteClusterButtonProps {
  onClick: () => void;
}

/**
 * Przycisk do usuwania klastra z ikoną kosza.
 */
export default function DeleteClusterButton({ onClick }: DeleteClusterButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="p-2.5 h-9 w-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:text-red-400 focus-visible:bg-red-500/10 transition-all duration-200 rounded-lg border border-neutral-700/30"
      title="Usuń klaster"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
