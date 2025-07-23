import React from "react";
import type { ArticleListItemDto } from "../../types";
import ArticleListItem from "./ArticleListItem";

interface ArticlesListProps {
  articles: ArticleListItemDto[];
  onDeleteRequest: (article: ArticleListItemDto) => void;
}

/**
 * Komponent wyświetlający listę artykułów wewnątrz karty klastra.
 */
export default function ArticlesList({ articles, onDeleteRequest }: ArticlesListProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {articles.map((article) => (
        <ArticleListItem key={article.id} article={article} onDeleteRequest={onDeleteRequest} />
      ))}
    </div>
  );
}
