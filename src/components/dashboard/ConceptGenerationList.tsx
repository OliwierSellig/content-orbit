import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from "react";
import type { TopicClusterDto, ArticleStubDto, CreateArticleCommand, UpdateArticleCommand } from "../../types";
import { ConceptGenerationListItem } from "./ConceptGenerationListItem";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { ConceptDetails } from "./ConceptDetails";
import { DeleteConfirmModal } from "../shared/DeleteConfirmModal";

interface ConceptGenerationListProps {
  subtopics: string[];
  setSubtopics: React.Dispatch<React.SetStateAction<string[]>>;
  topicCluster: TopicClusterDto;
}

type GenerationResult = {
  status: "pending" | "loading" | "success" | "error";
  isUpdating: boolean;
  article: ArticleStubDto | null;
  error: string | null;
};

export const ConceptGenerationList: React.FC<ConceptGenerationListProps> = ({
  subtopics,
  setSubtopics,
  topicCluster,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [generationResults, setGenerationResults] = useState<Record<string, GenerationResult>>({});
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  // Effect to synchronize results state with the subtopics list
  useEffect(() => {
    setGenerationResults((prevResults) => {
      const newResults = { ...prevResults };
      let hasChanged = false;
      subtopics.forEach((topic) => {
        if (!newResults[topic]) {
          newResults[topic] = { status: "pending", isUpdating: false, article: null, error: null };
          hasChanged = true;
        }
      });
      // Czyszczenie starych wyników, jeśli podtemat został usunięty
      Object.keys(newResults).forEach((topic) => {
        if (!subtopics.includes(topic)) {
          delete newResults[topic];
          hasChanged = true;
        }
      });
      return hasChanged ? newResults : prevResults;
    });

    // Aktualizacja wybranego podtematu
    setSelectedSubtopic((prevSelected) => {
      if (prevSelected && subtopics.includes(prevSelected)) {
        return prevSelected;
      }
      return subtopics[0] ?? null;
    });
  }, [subtopics]);

  const generateConcept = useCallback(
    async (subtopicName: string) => {
      setGenerationResults((prev) => ({
        ...prev,
        [subtopicName]: { ...prev[subtopicName], status: "loading", error: null, isUpdating: false },
      }));

      try {
        const command: CreateArticleCommand = {
          topic_cluster_id: topicCluster.id,
          name: subtopicName,
        };
        const response = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Nie udało się wygenerować konceptu.");
        }

        const newArticle: ArticleStubDto = await response.json();
        setGenerationResults((prev) => ({
          ...prev,
          [subtopicName]: {
            ...prev[subtopicName],
            status: "success",
            article: newArticle,
            error: null,
            isUpdating: false,
          },
        }));
      } catch (err) {
        setGenerationResults((prev) => ({
          ...prev,
          [subtopicName]: {
            ...prev[subtopicName],
            status: "error",
            article: null,
            error: err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.",
            isUpdating: false,
          },
        }));
      }
    },
    [topicCluster.id]
  );

  const handleRegenerateConcept = useCallback(
    async (subtopicName: string, nameForAI: string) => {
      const currentResult = generationResults[subtopicName];
      if (!currentResult || !currentResult.article) return;

      const articleId = currentResult.article.id;
      setGenerationResults((prev) => ({
        ...prev,
        [subtopicName]: { ...prev[subtopicName], isUpdating: true, error: null },
      }));

      try {
        const response = await fetch(`/api/articles/${articleId}/regenerate-concept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameForAI }),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zregenerować konceptu.");
        }
        const regeneratedArticle: ArticleStubDto = await response.json();
        setGenerationResults((prev) => ({
          ...prev,
          [subtopicName]: {
            ...prev[subtopicName],
            isUpdating: false,
            article: regeneratedArticle,
          },
        }));
      } catch (error) {
        setGenerationResults((prev) => ({
          ...prev,
          [subtopicName]: {
            ...prev[subtopicName],
            isUpdating: false,
            error: "Błąd podczas regeneracji",
          },
        }));
      }
    },
    [generationResults]
  );

  // Effect to start generation
  useEffect(() => {
    subtopics.forEach((subtopic) => {
      if (!generationResults[subtopic] || generationResults[subtopic].status === "pending") {
        generateConcept(subtopic);
      }
    });
  }, [subtopics, generateConcept, generationResults]);

  const handleSelectSubtopic = (subtopicName: string) => {
    setSelectedSubtopic(subtopicName);
  };

  const handleRetry = () => {
    if (selectedSubtopic) {
      generateConcept(selectedSubtopic);
    }
  };

  const handleUpdateConcept = useCallback(
    async (subtopicName: string, data: UpdateArticleCommand) => {
      const currentResult = generationResults[subtopicName];
      if (!currentResult || !currentResult.article) return;

      const articleId = currentResult.article.id;
      const originalArticle = currentResult.article;
      const originalSubtopics = [...subtopics];
      const originalResults = { ...generationResults };
      const originalSelectedSubtopic = selectedSubtopic;

      const newName = data.name;

      if (newName && newName !== subtopicName) {
        // Update subtopics array
        setSubtopics((prev) => prev.map((s) => (s === subtopicName ? newName : s)));
        // Update generationResults by changing the key
        setGenerationResults((prev) => {
          const { [subtopicName]: value, ...rest } = prev;
          return {
            ...rest,
            [newName]: {
              ...value,
              article: { ...value.article!, ...data },
            },
          };
        });
        // Update selected subtopic
        if (selectedSubtopic === subtopicName) {
          setSelectedSubtopic(newName);
        }
      } else {
        // Just update the article data without changing the key
        setGenerationResults((prev) => ({
          ...prev,
          [subtopicName]: {
            ...prev[subtopicName],
            article: { ...prev[subtopicName].article!, ...data },
          },
        }));
      }

      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zaktualizować konceptu.");
        }
        toast.success("Koncept został zaktualizowany.");
        setGenerationResults((prev) => ({
          ...prev,
          [newName || subtopicName]: { ...prev[newName || subtopicName], isUpdating: false },
        }));
      } catch (error) {
        // Revert on error
        setSubtopics(originalSubtopics);
        setGenerationResults(originalResults);
        setSelectedSubtopic(originalSelectedSubtopic);
        toast.error("Błąd zapisu. Przywracanie poprzedniego stanu.");
      }
    },
    [generationResults, subtopics, setSubtopics, selectedSubtopic]
  );

  const handleDeleteConcept = useCallback(async () => {
    if (!selectedSubtopic) return;

    const articleId = generationResults[selectedSubtopic]?.article?.id;
    if (!articleId) return;

    // Remove from state optimistically
    const originalResults = { ...generationResults };
    const originalSubtopics = [...subtopics];

    const newSubtopics = subtopics.filter((s) => s !== selectedSubtopic);
    const newResults = { ...generationResults };
    delete newResults[selectedSubtopic];

    setSubtopics(newSubtopics);
    setGenerationResults(newResults);

    // Select the next available subtopic or null
    const currentIndex = originalSubtopics.findIndex((s) => s === selectedSubtopic);
    const nextSubtopic = newSubtopics[currentIndex] || newSubtopics[currentIndex - 1] || null;
    setSelectedSubtopic(nextSubtopic);

    setIsDeleteModalOpen(false);

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Nie udało się usunąć konceptu.");
      }
      toast.success("Koncept został pomyślnie usunięty.");
    } catch (error) {
      // Revert on error
      setSubtopics(originalSubtopics);
      setGenerationResults(originalResults);
      setSelectedSubtopic(selectedSubtopic);
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas usuwania.");
    }
  }, [selectedSubtopic, generationResults, subtopics, setSubtopics]);

  if (false) {
    return <LoadingSpinner label="Generowanie konceptów..." />;
  }

  if (false) {
    return (
      <div className="text-center text-destructive p-8 border border-destructive/50 rounded-lg max-w-2xl mx-auto">
        <h3 className="text-lg font-bold mb-2">Błąd generowania konceptów</h3>
        <p>{generationResults[subtopics[0]]?.error}</p>
      </div>
    );
  }

  const selectedResult = selectedSubtopic ? generationResults[selectedSubtopic] : null;

  return (
    <div className="container mx-auto max-w-7xl">
      <h2 className="text-2xl font-bold text-center mb-10">
        Generowanie konceptów dla: <span className="text-primary">{topicCluster.name}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-5">
          <div className="space-y-3">
            {subtopics.map((subtopic) => (
              <ConceptGenerationListItem
                key={subtopic}
                subtopicName={subtopic}
                result={
                  generationResults[subtopic] ?? {
                    status: "pending",
                    isUpdating: false,
                    article: null,
                    error: null,
                  }
                }
                isSelected={selectedSubtopic === subtopic}
                onSelect={() => handleSelectSubtopic(subtopic)}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-8 lg:col-span-7">
          <ConceptDetails
            article={selectedResult?.article ?? null}
            isLoading={selectedResult?.status === "loading"}
            isUpdating={selectedResult?.isUpdating ?? false}
            onRetry={handleRetry}
            onUpdate={(data) => selectedSubtopic && handleUpdateConcept(selectedSubtopic, data)}
            onDelete={() => setIsDeleteModalOpen(true)}
            onRegenerate={(name) => selectedSubtopic && handleRegenerateConcept(selectedSubtopic, name)}
            error={selectedResult?.error ?? null}
          />
        </div>
      </div>
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Potwierdź usunięcie"
        description={`Czy na pewno chcesz trwale usunąć koncept dla podtematu "${selectedSubtopic}"?`}
        onConfirm={handleDeleteConcept}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
