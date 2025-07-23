import { useState, useEffect, useMemo, useCallback } from "react";
import type { TopicClusterWithArticlesDto, TopicClusterDto, ArticleListItemDto } from "../../types";
import { toast } from "sonner";

interface UseClustersOptions {
  pageSize?: number;
}

interface UseClustersReturn {
  // Data and loading states
  clusters: TopicClusterWithArticlesDto[];
  isLoading: boolean;
  error: string | null;

  // Search and pagination states
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalClusters: number;

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
 * Obsługuje pobieranie danych z serwera, wyszukiwanie, paginację zsynchronizowaną z URL
 * oraz operacje usuwania.
 */
export function useClusters(options: UseClustersOptions = {}): UseClustersReturn {
  const { pageSize = 6 } = options;

  // Main data states
  const [clusters, setClusters] = useState<TopicClusterWithArticlesDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClusters, setTotalClusters] = useState(0);

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

  const fetchClusters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const urlParams = new URLSearchParams();
      urlParams.set("includeArticles", "true");
      urlParams.set("limit", String(pageSize));

      if (searchTerm) {
        urlParams.set("search", searchTerm);
      } else {
        urlParams.set("page", String(currentPage));
      }

      const response = await fetch(`/api/topic-clusters?${urlParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch clusters: ${response.status}`);
      }

      const data = await response.json();

      // Assume API returns { data: [], total: number } for paginated responses
      // and [] for search responses
      if (typeof data.total === "number") {
        setClusters(data.data);
        setTotalClusters(data.total);
      } else {
        setClusters(data);
        setTotalClusters(data.length);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error("Nie udało się pobrać klastrów", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm]);

  // Sync state from URL on initial load and on popstate (back/forward navigation)
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get("page") || "1", 10);
      const search = params.get("search") || "";
      setCurrentPage(page);
      setSearchTerm(search);
    };

    handleUrlChange(); // Initial load
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Effect to fetch data when state changes
  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const totalPages = useMemo(() => {
    if (searchTerm) {
      // Pagination is disabled for search on the backend
      return 1;
    }
    return Math.ceil(totalClusters / pageSize);
  }, [totalClusters, pageSize, searchTerm]);

  // Handlers
  const handleSearchChange = (term: string) => {
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set("search", term);
      params.delete("page"); // Reset page when searching
    } else {
      params.delete("search");
    }
    history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setSearchTerm(term);
    setCurrentPage(1); // Reset page state internally
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
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

      // After successful deletion, check if we need to change page
      if (clusters.length === 1 && currentPage > 1) {
        // If it was the last cluster on the page, go to the previous page
        handlePageChange(currentPage - 1);
      } else {
        // Otherwise, just refetch the current page's data
        await refetch();
      }

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

      // Refetch data to reflect the change
      await refetch();

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

  const refetch = useCallback(async () => {
    await fetchClusters();
  }, [fetchClusters]);

  return {
    // Data and loading states
    clusters,
    isLoading,
    error,

    // Search and pagination states
    searchTerm,
    currentPage,
    totalPages,
    totalClusters,

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
