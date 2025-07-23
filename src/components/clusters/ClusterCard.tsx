import React from "react";
import type { TopicClusterWithArticlesDto, TopicClusterDto, ArticleListItemDto } from "../../types";
import { Card } from "../ui/card";
import { Layers } from "lucide-react";
import ArticlesList from "./ArticlesList";
import DeleteClusterButton from "./DeleteClusterButton";

interface ClusterCardProps {
  cluster: TopicClusterWithArticlesDto;
  onDeleteClusterRequest: (cluster: TopicClusterDto) => void;
  onDeleteArticleRequest: (article: ArticleListItemDto, clusterId: string) => void;
}

/**
 * Komponent karty klastra tematycznego.
 * Wyświetla nazwę klastra oraz listę przypisanych artykułów.
 */
export default function ClusterCard({ cluster, onDeleteClusterRequest, onDeleteArticleRequest }: ClusterCardProps) {
  const handleDeleteCluster = () => {
    // Convert TopicClusterWithArticlesDto to TopicClusterDto by omitting articles
    const { articles, ...clusterDto } = cluster;
    onDeleteClusterRequest(clusterDto);
  };

  const handleDeleteArticle = (article: ArticleListItemDto) => {
    onDeleteArticleRequest(article, cluster.id);
  };

  // Sort articles by status priority: moved > in_progress > concept
  const sortedArticles = [...cluster.articles].sort((a, b) => {
    const statusOrder = { moved: 0, in_progress: 1, concept: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <Card className="relative overflow-hidden bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl p-6 shadow-lg">
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60"></div>

      {/* Optional side accent for variety */}
      <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-r-full opacity-50"></div>

      {/* Header with icon, title and delete button */}
      <div className="flex items-start justify-between mb-1 gap-8">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon container with gradient background */}
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Layers className="w-5 h-5 text-primary" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-100 line-clamp-2 leading-tight">{cluster.name}</h3>
          </div>
        </div>

        {/* Delete button */}
        <DeleteClusterButton onClick={handleDeleteCluster} />
      </div>

      {/* Articles count badge */}
      <div className="mb-1">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-700/50 text-neutral-300 border border-neutral-600/50">
          {cluster.articles.length === 0 ? (
            <>
              <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full mr-2"></div>
              Brak artykułów
            </>
          ) : (
            <>
              {cluster.articles.length}{" "}
              {cluster.articles.length === 1 ? "artykuł" : cluster.articles.length < 5 ? "artykuły" : "artykułów"}
            </>
          )}
        </div>
      </div>

      {/* Articles list */}
      {cluster.articles.length > 0 && (
        <div className="max-h-90 overflow-y-auto space-y-2 pr-2 -mr-2 cluster-articles-scroll">
          <ArticlesList articles={sortedArticles} onDeleteRequest={handleDeleteArticle} />
        </div>
      )}

      {/* Empty state for clusters without articles */}
      {cluster.articles.length === 0 && (
        <div className="py-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-neutral-700/50 rounded-full flex items-center justify-center">
            <Layers className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-sm text-neutral-500">Ten klaster nie ma jeszcze artykułów</p>
          <p className="text-xs text-neutral-600 mt-1">Przejdź do dashboardu, aby wygenerować koncepty</p>
        </div>
      )}
    </Card>
  );
}
