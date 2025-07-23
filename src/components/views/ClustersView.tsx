import { useClusters } from "../hooks/useClusters";
import { LoadingSpinner } from "../shared/LoadingSpinner";

import DeleteArticleModal from "../clusters/DeleteArticleModal";
import SearchInput from "../shared/SearchInput";
import Pagination from "../shared/Pagination";
import ClustersGrid from "../clusters/ClustersGrid";
import DeleteClusterModal from "../clusters/DeleteClusterModal";

/**
 * Główny widok zarządzania klastrami tematycznymi.
 * Wyświetla spaginowaną siatkę klastrów z możliwością wyszukiwania,
 * przeglądania artykułów oraz usuwania klastrów i artykułów.
 */
export default function ClustersView() {
  const {
    displayClusters,
    isLoading,
    error,
    searchTerm,
    currentPage,
    totalPages,
    isDeleteClusterModalOpen,
    isDeleteArticleModalOpen,
    clusterToDelete,
    articleToDelete,
    handleSearchChange,
    handlePageChange,
    requestClusterDelete,
    confirmClusterDelete,
    requestArticleDelete,
    confirmArticleDelete,
    cancelDelete,
  } = useClusters();

  return (
    <div className="container mx-auto py-12 px-6 max-w-6xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
          Zarządzanie Klastrami
        </h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Przeglądaj i zarządzaj swoimi klastrami tematycznymi oraz przypisanymi do nich artykułami.
        </p>

        {/* Search Input */}
        <div className="max-w-md mx-auto">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Szukaj w klastrach i artykułach..."
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-2">Błąd podczas ładowania klastrów</div>
            <div className="text-neutral-400 text-sm">{error}</div>
          </div>
        ) : displayClusters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400">
              {searchTerm ? "Nie znaleziono klastrów pasujących do wyszukiwania" : "Nie masz jeszcze żadnych klastrów"}
            </div>
            {searchTerm && <div className="text-sm text-neutral-500 mt-2">Spróbuj zmienić kryteria wyszukiwania</div>}
          </div>
        ) : (
          <>
            {/* Clusters Grid */}
            <div className="mb-8">
              <ClustersGrid
                clusters={displayClusters}
                onDeleteClusterRequest={requestClusterDelete}
                onDeleteArticleRequest={requestArticleDelete}
              />
            </div>

            {/* Pagination - only show when not searching */}
            {!searchTerm && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </>
        )}
      </div>

      {/* Delete Modals */}
      <DeleteClusterModal
        isOpen={isDeleteClusterModalOpen}
        cluster={clusterToDelete}
        onConfirm={confirmClusterDelete}
        onCancel={cancelDelete}
      />

      <DeleteArticleModal
        isOpen={isDeleteArticleModalOpen}
        article={articleToDelete?.article || null}
        onConfirm={confirmArticleDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
