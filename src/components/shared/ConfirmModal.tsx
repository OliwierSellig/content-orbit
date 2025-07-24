import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  isConfirming = false,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon,
}) => {
  const isDanger = variant === "danger";

  const IconWrapper = isDanger ? (
    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
      {icon || <AlertTriangle className="w-5 h-5 text-red-400" />}
    </div>
  ) : (
    <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
      {icon || <CheckCircle className="w-5 h-5 text-sky-400" />}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[480px] bg-neutral-800/95 backdrop-blur-md border-2 border-neutral-700/50 rounded-2xl shadow-2xl">
        <div
          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
            isDanger ? "via-red-500/30" : "via-sky-500/30"
          } to-transparent opacity-60`}
        ></div>

        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center gap-3">
            {IconWrapper}
            <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-neutral-400 text-base leading-relaxed pl-10">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex justify-end gap-4 pt-6 border-t border-neutral-700/30">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-8 py-3 h-auto border-2 border-neutral-600/50 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/60 hover:border-neutral-500/60 focus-visible:bg-neutral-700/60 focus-visible:border-neutral-500/60 transition-all duration-300 ease-custom rounded-xl font-medium"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`px-8 py-3 h-auto transition-all duration-300 ease-custom rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed border ${
              isDanger
                ? "bg-red-950 text-red-400 border-red-800 hover:bg-red-900 hover:border-red-700"
                : "bg-sky-950 text-sky-400 border-sky-800 hover:bg-sky-900 hover:border-sky-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {isConfirming ? (
                <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin"></div>
              ) : (
                icon
              )}
              {isConfirming ? "Potwierdzanie..." : confirmText}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
