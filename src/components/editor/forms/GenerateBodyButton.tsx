import React from "react";
import { Sparkles } from "lucide-react";

interface GenerateBodyButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const GenerateBodyButton: React.FC<GenerateBodyButtonProps> = ({ onClick, isLoading, disabled = false }) => {
  return (
    <div className="mb-4">
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="group relative w-full flex justify-center items-center px-4 py-3 bg-sky-950 text-sky-400 border border-sky-800 rounded-md hover:bg-sky-900 hover:border-sky-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-950 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500/50 focus-visible:outline-none transition-all duration-200 overflow-hidden cursor-pointer"
      >
        <span className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-sky-500 to-transparent transition-all duration-300 ease-in-out transform -translate-y-full group-hover:translate-y-0"></span>
        {isLoading ? (
          <>
            <div className="w-6 h-6 mr-3 border-2 border-current/40 border-t-current rounded-full animate-spin"></div>
            <span>Generowanie...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6 mr-3 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-12" />
            <span>Generuj treść</span>
          </>
        )}
        <span className="absolute right-0 top-0 h-full w-0.5 bg-gradient-to-t from-transparent via-sky-500 to-transparent transition-all duration-300 ease-in-out transform translate-y-full group-hover:translate-y-0"></span>
      </button>
    </div>
  );
};
