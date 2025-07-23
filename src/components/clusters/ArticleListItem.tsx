import React from "react";
import type { ArticleListItemDto } from "../../types";
import DeleteArticleButton from "./DeleteArticleButton";

interface ArticleListItemProps {
  article: ArticleListItemDto;
  onDeleteRequest: (article: ArticleListItemDto) => void;
}

/**
 * Komponent reprezentujący pojedynczy artykuł na liście wewnątrz karty klastra.
 */
export default function ArticleListItem({ article, onDeleteRequest }: ArticleListItemProps) {
  const handleDeleteClick = () => {
    onDeleteRequest(article);
  };

  // Determine article link based on status and slug
  const getArticleLink = () => {
    if (article.status === "moved" && article.slug) {
      // For moved articles, we might want to show the slug or external link
      return `/articles/${article.slug}`;
    }
    // For concept and in_progress articles, link to the article editor/details
    return `/articles/${article.id}`;
  };

  // Status indicator styling with tooltip
  const getStatusIndicator = () => {
    const statusConfig = {
      concept: { color: "bg-yellow-400", label: "Koncept" },
      in_progress: { color: "bg-blue-400", label: "W trakcie" },
      moved: { color: "bg-green-400", label: "Przeniesiony" },
    };

    const config = statusConfig[article.status];
    if (!config) return null;

    return (
      <div className="relative group/status">
        <div className={`w-2 h-2 ${config.color} rounded-full flex-shrink-0 cursor-help`} />
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 transform translate-x-2 mb-2 opacity-0 group-hover/status:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <div className="bg-neutral-900/95 text-white text-xs font-medium px-2 py-1 rounded-lg border border-neutral-700/50 shadow-lg backdrop-blur-sm whitespace-nowrap">
            {config.label}
            {/* Arrow */}
            <div className="absolute top-full left-3 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-neutral-900/95"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="group relative">
      <a
        href={getArticleLink()}
        className="flex items-center justify-between py-3 px-4 rounded-lg bg-neutral-700/30 group-hover:bg-neutral-700/50 border border-neutral-600/30 group-hover:border-neutral-600/50 transition-all duration-200 cursor-pointer"
        title={article.name}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getStatusIndicator()}
          <span className="text-sm pr-4 block text-neutral-300 group-hover:text-white transition-all duration-200 truncate font-medium transform translate-x-0 group-hover:translate-x-3">
            {article.name}
          </span>
        </div>
        <div className="w-8 h-8 flex-shrink-0"></div> {/* Spacer for delete button */}
      </a>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10">
        <DeleteArticleButton onClick={handleDeleteClick} />
      </div>
    </div>
  );
}
