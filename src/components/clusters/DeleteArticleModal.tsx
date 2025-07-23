import React, { useState } from "react";
import type { ArticleListItemDto } from "../../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteArticleModalProps {
  isOpen: boolean;
  article: ArticleListItemDto | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal potwierdzający usunięcie artykułu.
 * Prosty modal z pytaniem o potwierdzenie.
 */
export default function DeleteArticleModal({ isOpen, article, onConfirm, onCancel }: DeleteArticleModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!article) return;

    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return; // Prevent canceling during deletion
    onCancel();
  };

  if (!article) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[480px] bg-neutral-800/95 backdrop-blur-md border-2 border-neutral-700/50 rounded-2xl shadow-2xl">
        {/* Subtle accent gradient - warning color */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-60"></div>

        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">Usuń artykuł</DialogTitle>
          </div>
          <DialogDescription className="text-neutral-400 text-base leading-relaxed pl-10">
            Czy na pewno chcesz usunąć artykuł <strong className="text-neutral-200">"{article.name}"</strong>?
            <br />
            <br />
            Ta akcja jest nieodwracalna i artykuł zostanie trwale usunięty.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-4 pt-6 border-t border-neutral-700/30">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="px-8 py-3 h-auto border-2 border-neutral-600/50 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/60 hover:border-neutral-500/60 focus-visible:bg-neutral-700/60 focus-visible:border-neutral-500/60 transition-all duration-300 ease-custom rounded-xl font-medium"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-8 py-3 h-auto bg-gradient-to-r from-red-600/90 to-red-500 text-white hover:from-red-600 hover:to-red-500/95 hover:brightness-110 focus-visible:from-red-600 focus-visible:to-red-500/95 focus-visible:brightness-110 transition-all duration-300 ease-custom rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "Usuwanie..." : "Usuń artykuł"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
