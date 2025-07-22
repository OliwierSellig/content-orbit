import React from "react";
import { AlertTriangle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive animate-in fade-in-0 ${className}`}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
};
