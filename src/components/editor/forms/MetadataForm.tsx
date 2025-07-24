import React from "react";
import type { ArticleEditorViewModel, UpdateArticleCommand } from "../../../types";

interface MetadataFormProps {
  article: ArticleEditorViewModel;
  onFieldChange: (field: keyof UpdateArticleCommand, value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onMoveToSanity: () => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({
  article,
  onFieldChange,
  disabled = false,
  isLoading = false,
  onMoveToSanity,
}) => {
  return (
    <>
      <h3 className="text-lg font-semibold text-white mb-4">Metadane</h3>

      <div className="space-y-4">
        {/* Nazwa */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Nazwa artykułu</label>
          <input
            type="text"
            value={article.name || ""}
            onChange={(e) => onFieldChange("name", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Tytuł */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Tytuł</label>
          <input
            type="text"
            value={article.title || ""}
            onChange={(e) => onFieldChange("title", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Slug</label>
          <input
            type="text"
            value={article.slug || ""}
            onChange={(e) => onFieldChange("slug", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Opis */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Opis</label>
          <textarea
            value={article.description || ""}
            onChange={(e) => onFieldChange("description", e.target.value)}
            rows={3}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
          />
        </div>

        {/* SEO Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">SEO Tytuł</label>
          <input
            type="text"
            value={article.seo_title || ""}
            onChange={(e) => onFieldChange("seo_title", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* SEO Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">SEO Opis</label>
          <textarea
            value={article.seo_description || ""}
            onChange={(e) => onFieldChange("seo_description", e.target.value)}
            rows={3}
            disabled={disabled}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
          />
        </div>

        {/* Przycisk przenoszenia do Sanity */}
        <div className="pt-4 border-t border-neutral-600">
          <button
            onClick={onMoveToSanity}
            disabled={isLoading || article.status === "moved" || disabled}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-200"
          >
            {isLoading
              ? "Przenoszenie..."
              : article.status === "moved"
                ? "Przeniesiono do Sanity"
                : "Przenieś do Sanity"}
          </button>
        </div>
      </div>
    </>
  );
};
