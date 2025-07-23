import { useState, useEffect, useMemo } from "react";
import type { TopicClusterWithArticlesDto, TopicClusterDto, ArticleListItemDto } from "../../types";
import { toast } from "sonner";

interface UseClustersOptions {
  pageSize?: number;
}

interface UseClustersReturn {
  // Data and loading states
  allData: TopicClusterWithArticlesDto[];
  displayClusters: TopicClusterWithArticlesDto[];
  isLoading: boolean;
  error: string | null;

  // Search and pagination states
  searchTerm: string;
  currentPage: number;
  totalPages: number;

  // Modal states
  isDeleteClusterModalOpen: boolean;
  isDeleteArticleModalOpen: boolean;
  clusterToDelete: TopicClusterDto | null;
  articleToDelete: { article: ArticleListItemDto; clusterId: string } | null;

  // Handlers
  handleSearchChange: (term: string) => void;
  handlePageChange: (page: number) => void;
  requestClusterDelete: (cluster: TopicClusterDto) => void;
  confirmClusterDelete: () => Promise<void>;
  requestArticleDelete: (article: ArticleListItemDto, clusterId: string) => void;
  confirmArticleDelete: () => Promise<void>;
  cancelDelete: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook do zarządzania stanem widoku klastrów z artykułami.
 * Obsługuje pobieranie danych, wyszukiwanie, paginację oraz operacje usuwania.
 */
export function useClusters(options: UseClustersOptions = {}): UseClustersReturn {
  const { pageSize = 6 } = options;

  // Main data states
  const [allData, setAllData] = useState<TopicClusterWithArticlesDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isDeleteClusterModalOpen, setIsDeleteClusterModalOpen] = useState(false);
  const [isDeleteArticleModalOpen, setIsDeleteArticleModalOpen] = useState(false);
  const [clusterToDelete, setClusterToDelete] = useState<TopicClusterDto | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<{ article: ArticleListItemDto; clusterId: string } | null>(
    null
  );

  // Fetch clusters from API
  const fetchClusters = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = searchTerm
        ? `/api/topic-clusters?includeArticles=true&search=${encodeURIComponent(searchTerm)}`
        : `/api/topic-clusters?includeArticles=true`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch clusters: ${response.status}`);
      }

      const data: TopicClusterWithArticlesDto[] = await response.json();
      setAllData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error("Nie udało się pobrać klastrów", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for initial load
  useEffect(() => {
    fetchClusters();
  }, []);

  // Effect for search - refetch when search term changes
  useEffect(() => {
    fetchClusters();
    setCurrentPage(1); // Reset to first page on search change
  }, [searchTerm]);

  // Compute filtered and paginated data
  const { displayClusters, totalPages } = useMemo(() => {
    let filteredData = allData;

    // When using search, API already returns filtered data
    // For pagination, we need to slice the data client-side only when no search
    if (!searchTerm) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      filteredData = allData.slice(startIndex, endIndex);
    }

    const pages = searchTerm ? 1 : Math.ceil(allData.length / pageSize);

    return {
      displayClusters: filteredData,
      totalPages: pages,
    };
  }, [allData, currentPage, pageSize, searchTerm]);

  // Handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const requestClusterDelete = (cluster: TopicClusterDto) => {
    setClusterToDelete(cluster);
    setIsDeleteClusterModalOpen(true);
  };

  const requestArticleDelete = (article: ArticleListItemDto, clusterId: string) => {
    setArticleToDelete({ article, clusterId });
    setIsDeleteArticleModalOpen(true);
  };

  const confirmClusterDelete = async () => {
    if (!clusterToDelete) return;

    try {
      const response = await fetch(`/api/topic-clusters/${clusterToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete cluster: ${response.status}`);
      }

      // Update local state - remove cluster from allData
      setAllData((prev) => prev.filter((cluster) => cluster.id !== clusterToDelete.id));

      toast.success("Klaster został usunięty", {
        description: `Klaster "${clusterToDelete.name}" został pomyślnie usunięty.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error("Nie udało się usunąć klastra", {
        description: errorMessage,
      });
    } finally {
      cancelDelete();
    }
  };

  const confirmArticleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const response = await fetch(`/api/articles/${articleToDelete.article.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete article: ${response.status}`);
      }

      // Update local state - remove article from the specific cluster
      setAllData((prev) =>
        prev.map((cluster) => {
          if (cluster.id === articleToDelete.clusterId) {
            return {
              ...cluster,
              articles: cluster.articles.filter((article) => article.id !== articleToDelete.article.id),
            };
          }
          return cluster;
        })
      );

      toast.success("Artykuł został usunięty", {
        description: `Artykuł "${articleToDelete.article.name}" został pomyślnie usunięty.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error("Nie udało się usunąć artykułu", {
        description: errorMessage,
      });
    } finally {
      cancelDelete();
    }
  };

  const cancelDelete = () => {
    setIsDeleteClusterModalOpen(false);
    setIsDeleteArticleModalOpen(false);
    setClusterToDelete(null);
    setArticleToDelete(null);
  };

  const refetch = async () => {
    await fetchClusters();
  };

  return {
    // Data and loading states
    allData,
    displayClusters,
    isLoading,
    error,

    // Search and pagination states
    searchTerm,
    currentPage,
    totalPages,

    // Modal states
    isDeleteClusterModalOpen,
    isDeleteArticleModalOpen,
    clusterToDelete,
    articleToDelete,

    // Handlers
    handleSearchChange,
    handlePageChange,
    requestClusterDelete,
    confirmClusterDelete,
    requestArticleDelete,
    confirmArticleDelete,
    cancelDelete,
    refetch,
  };
}
