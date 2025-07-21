import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CrudListItem } from "./CrudListItem";

// Generyczny typ dla elementów listy
type TItem = {
  id: string;
  title: string;
  prompt: string;
};

interface CrudListProps<T extends TItem> {
  items: T[];
  isCreating?: boolean;
  updatingItemId?: string | null;
  deletingItemId?: string | null;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => Promise<void>;
  emptyMessage?: string;
  createButtonText?: string;
}

export const CrudList = <T extends TItem>({
  items,
  isCreating = false,
  updatingItemId = null,
  deletingItemId = null,
  onCreate,
  onEdit,
  onDelete,
  emptyMessage = "Brak elementów",
  createButtonText = "Dodaj nowy",
}: CrudListProps<T>) => {
  return (
    <div className="space-y-4">
      {/* Przycisk dodawania */}
      <Button
        onClick={onCreate}
        variant="outline"
        className="group w-full border-dashed border-2 border-neutral-600/50  bg-neutral-800/20 hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:border-primary/50 focus-visible:bg-primary/5 focus-visible:text-primary transition-all duration-300 py-4 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md"
        size="sm"
        disabled={isCreating}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-1.5 rounded-lg bg-neutral-700/50 group-hover:bg-primary/20 transition-colors duration-300">
            <Plus className="w-4 h-4" />
          </div>
          <span className="font-medium group-hover:translate-x-1 transition-transform duration-300 ease-custom">
            {isCreating ? "Dodawanie..." : createButtonText}
          </span>
        </div>
      </Button>

      {/* Lista elementów */}
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CrudListItem
              key={item.id}
              item={item}
              isUpdating={updatingItemId === item.id}
              isDeleting={deletingItemId === item.id}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
