import React from "react";
import { CircleDashed, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ArticleStubDto } from "../../types";
import { cn } from "@/lib/utils";

type GenerationResult = {
  status: "pending" | "loading" | "success" | "error";
  isUpdating: boolean;
  article: ArticleStubDto | null;
  error: string | null;
};

interface ConceptGenerationListItemProps {
  subtopicName: string;
  result: GenerationResult;
  isSelected: boolean;
  onSelect: () => void;
}

const StatusIcon: React.FC<{ status: GenerationResult["status"] }> = ({ status }) => {
  switch (status) {
    case "loading":
      return <CircleDashed className="animate-spin text-primary h-5 w-5" />;
    case "success":
      return <CheckCircle2 className="text-green-500 h-5 w-5" />;
    case "error":
      return <AlertCircle className="text-destructive h-5 w-5" />;
    default:
      return <Sparkles className="text-neutral-500 h-5 w-5" />;
  }
};

export const ConceptGenerationListItem: React.FC<ConceptGenerationListItemProps> = ({
  subtopicName,
  result,
  isSelected,
  onSelect,
}) => {
  return (
    <Card
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      tabIndex={0}
      className={cn(
        "group relative overflow-hidden bg-neutral-800/50 border border-neutral-700/50 p-4 py-6 cursor-pointer transition-all duration-300 ease-in-out",
        "hover:border-primary/50 hover:bg-neutral-800 hover:scale-[1.03]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-lg",
        isSelected && "bg-primary/10 border-primary/70 scale-[1.03]"
      )}
      data-status={result.status}
    >
      <div className="flex items-center justify-between gap-4">
        <ArrowRight className="absolute left-0 h-5 w-5 text-primary opacity-0 -translate-x-full transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-4" />
        <p
          className="flex-1 min-w-0 truncate transition-all duration-300 ease-in-out group-hover:ml-10"
          title={subtopicName}
        >
          {subtopicName}
        </p>
        <div className="flex-shrink-0 z-10">
          <StatusIcon status={result.status} />
        </div>
      </div>
    </Card>
  );
};
