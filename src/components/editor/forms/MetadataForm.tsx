import React, { useState } from "react";
import type { ArticleEditorViewModel, UpdateArticleCommand } from "@/types";
import { LoadingSpinner } from "../../shared/LoadingSpinner";
import { SanityLogo } from "../../shared/SanityLogo";
import { stripHtmlTags } from "@/lib/utils";

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
            value={stripHtmlTags(article.title) || ""}
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
            value={stripHtmlTags(article.description) || ""}
            onChange={(e) => onFieldChange("description", e.target.value)}
            disabled={disabled}
            rows={5}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50 min-h-[100px] max-h-[400px] custom-scrollbar"
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
            disabled={disabled}
            rows={5}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50 min-h-[100px] max-h-[400px] custom-scrollbar"
          />
        </div>

        {/* Przycisk przenoszenia do Sanity */}
        <div className="pt-4 border-t border-neutral-600">
          <button
            onClick={onMoveToSanity}
            disabled={isLoading || article.status === "moved" || disabled}
            className="group relative w-full flex justify-center items-center px-4 py-3 bg-black text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 focus-visible:outline-none transition-all duration-150 overflow-hidden cursor-pointer"
          >
            <span className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-primary to-transparent transition-all duration-300 ease-in-out transform -translate-y-full group-hover:translate-y-0 group-disabled:group-hover:translate-y-0"></span>
            {isLoading ? (
              <>
                <svg className="w-6 h-6 mr-3 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Przenoszenie...
              </>
            ) : article.status === "moved" ? (
              <>
                <SanityLogo className="w-6 h-6 mr-3 text-green-400 rounded-sm transition-transform ease-in-out duration-300" />
                Przeniesiono do Sanity
              </>
            ) : (
              <>
                <SanityLogo className="w-6 h-6 mr-3 rounded-sm transition-transform ease-in-out duration-300 group-hover:scale-110 group-hover:rotate-[30deg]" />
                Przenieś do Sanity
              </>
            )}
            <span className="absolute right-0 top-0 h-full w-0.5 bg-gradient-to-t from-transparent via-primary to-transparent transition-all duration-300 ease-in-out transform translate-y-full group-hover:translate-y-0 group-disabled:group-hover:translate-y-full"></span>
          </button>
        </div>
      </div>
    </>
  );
};
