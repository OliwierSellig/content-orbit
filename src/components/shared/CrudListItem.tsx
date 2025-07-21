import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

// Generyczny typ dla elementów listy
type TItem = {
  id: string;
  title: string;
  prompt: string;
};

interface CrudListItemProps<T extends TItem> {
  item: T;
  isUpdating?: boolean;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export const CrudListItem = <T extends TItem>({
  item,
  isUpdating = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: CrudListItemProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      // Toast jest obsługiwany w hooku useOptionsData
      // Modal pozostaje otwarty aby użytkownik mógł spróbować ponownie lub anulować
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Skrócona wersja prompt (pierwsze 100 znaków)
  const shortPrompt = item.prompt.length > 100 ? item.prompt.substring(0, 100) + "..." : item.prompt;

  const shouldShowToggle = item.prompt.length > 100;
  const isAnyActionLoading = isUpdating || isDeleting;

  return (
    <div
      className={`group relative bg-neutral-800/40 backdrop-blur-sm rounded-xl p-5 border border-neutral-700/30 hover:border-neutral-600/50 hover:bg-neutral-800/60 transition-all duration-300 hover:shadow-lg ${isAnyActionLoading ? "opacity-60" : ""}`}
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-primary/40 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex justify-between items-start pl-3">
        <div className="flex-1 min-w-0">
          {/* Tytuł */}
          <h4 className="font-medium text-base mb-3 truncate text-neutral-100 group-hover:text-white transition-colors">
            {item.title}
          </h4>

          {/* Prompt */}
          <div className="text-sm text-neutral-400 leading-relaxed">
            <p className="whitespace-pre-wrap">{isExpanded ? item.prompt : shortPrompt}</p>

            {/* Przycisk rozwijania */}
            {shouldShowToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isAnyActionLoading}
                className="mt-3 px-3 py-1 h-auto text-xs text-neutral-500 hover:text-primary hover:bg-primary/10 focus-visible:text-primary focus-visible:bg-primary/10 transition-all duration-200 rounded-lg border border-neutral-700/50 hover:border-primary/30"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1.5" />
                    Pokaż mniej
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1.5" />
                    Pokaż więcej
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="flex gap-2 ml-6 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={isAnyActionLoading}
            className="p-2.5 h-9 w-9 text-neutral-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 focus-visible:bg-blue-500/10 focus-visible:text-blue-400 transition-all duration-200 rounded-lg border border-neutral-700/30"
            title="Edytuj"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isAnyActionLoading}
            className="p-2.5 h-9 w-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 focus-visible:text-red-400 focus-visible:bg-red-500/10 transition-all duration-200 rounded-lg border border-neutral-700/30"
            title="Usuń"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Modal potwierdzenia usunięcia */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Potwierdź usunięcie"
        itemName={item.title}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
