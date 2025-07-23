import type { TopicClusterWithArticlesDto, TopicClusterDto, ArticleListItemDto } from "../../types";
import ClusterCard from "./ClusterCard";

interface ClustersGridProps {
  clusters: TopicClusterWithArticlesDto[];
  onDeleteClusterRequest: (cluster: TopicClusterDto) => void;
  onDeleteArticleRequest: (article: ArticleListItemDto, clusterId: string) => void;
}

/**
 * Komponent siatki klastrów tematycznych.
 * Renderuje klastry w responsive grid layout.
 */
export default function ClustersGrid({ clusters, onDeleteClusterRequest, onDeleteArticleRequest }: ClustersGridProps) {
  if (clusters.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clusters.map((cluster) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          onDeleteClusterRequest={onDeleteClusterRequest}
          onDeleteArticleRequest={onDeleteArticleRequest}
        />
      ))}
    </div>
  );
}
