import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from "react";
import { Undo2 } from "lucide-react";
import type { TopicClusterDto, ArticleStubDto, CreateArticleCommand, UpdateArticleCommand } from "../../types";
import { ConceptGenerationListItem } from "./ConceptGenerationListItem";
import { ConceptDetails } from "./ConceptDetails";
import { DeleteConfirmModal } from "../shared/DeleteConfirmModal";
import { Button } from "../ui/button";

type GenerationResult = {
  status: "pending" | "loading" | "success" | "error";
  isUpdating: boolean;
  article: ArticleStubDto | null;
  error: string | null;
};

type GenerationSessionState = {
  subtopics: string[];
  topicCluster: TopicClusterDto;
  generationResults: Record<string, GenerationResult>;
};

interface ConceptGenerationListProps {
  sessionState: GenerationSessionState;
  setSessionState: (
    value: GenerationSessionState | null | ((prevState: GenerationSessionState | null) => GenerationSessionState | null)
  ) => void;
  onReset: () => void;
}

export const ConceptGenerationList: React.FC<ConceptGenerationListProps> = ({
  sessionState,
  setSessionState,
  onReset,
}) => {
  const { subtopics, topicCluster, generationResults } = sessionState;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  // Effect to synchronize results state with the subtopics list
  useEffect(() => {
    let hasChanged = false;
    const newResults = { ...generationResults };

    subtopics.forEach((topic) => {
      if (!newResults[topic]) {
        newResults[topic] = { status: "pending", isUpdating: false, article: null, error: null };
        hasChanged = true;
      }
    });

    Object.keys(newResults).forEach((topic) => {
      if (!subtopics.includes(topic)) {
        delete newResults[topic];
        hasChanged = true;
      }
    });

    if (hasChanged) {
      setSessionState((prevState) => (prevState ? { ...prevState, generationResults: newResults } : null));
    }

    // Update selected subtopic
    setSelectedSubtopic((prevSelected) => {
      if (prevSelected && subtopics.includes(prevSelected)) {
        return prevSelected;
      }
      return subtopics[0] ?? null;
    });
  }, [subtopics, generationResults, setSessionState]);

  const generateConcept = useCallback(
    async (subtopicName: string) => {
      setSessionState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          generationResults: {
            ...prevState.generationResults,
            [subtopicName]: { status: "loading", error: null, isUpdating: false, article: null },
          },
        };
      });

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
          throw new Error("Nie udało się wygenerować konceptu.");
        }

        const newArticle: ArticleStubDto = await response.json();
        setSessionState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            generationResults: {
              ...prevState.generationResults,
              [subtopicName]: { status: "success", article: newArticle, error: null, isUpdating: false },
            },
          };
        });
      } catch (err) {
        setSessionState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            generationResults: {
              ...prevState.generationResults,
              [subtopicName]: {
                status: "error",
                article: null,
                error: err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.",
                isUpdating: false,
              },
            },
          };
        });
      }
    },
    [topicCluster.id, setSessionState]
  );

  const handleRegenerateConcept = useCallback(
    async (subtopicName: string, nameForAI: string) => {
      const currentResult = generationResults[subtopicName];
      if (!currentResult || !currentResult.article) return;

      const articleId = currentResult.article.id;

      setSessionState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          generationResults: {
            ...prevState.generationResults,
            [subtopicName]: { ...prevState.generationResults[subtopicName], isUpdating: true, error: null },
          },
        };
      });

      try {
        const response = await fetch(`/api/articles/${articleId}/regenerate-concept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameForAI }),
        });

        if (!response.ok) throw new Error("Nie udało się zregenerować konceptu.");

        const regeneratedArticle: ArticleStubDto = await response.json();
        setSessionState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            generationResults: {
              ...prevState.generationResults,
              [subtopicName]: {
                ...prevState.generationResults[subtopicName],
                isUpdating: false,
                article: regeneratedArticle,
              },
            },
          };
        });
      } catch (error) {
        setSessionState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            generationResults: {
              ...prevState.generationResults,
              [subtopicName]: {
                ...prevState.generationResults[subtopicName],
                isUpdating: false,
                error: "Błąd podczas regeneracji",
              },
            },
          };
        });
      }
    },
    [generationResults, setSessionState]
  );

  useEffect(() => {
    subtopics.forEach((subtopic) => {
      if (!generationResults[subtopic] || generationResults[subtopic].status === "pending") {
        generateConcept(subtopic);
      }
    });
  }, [subtopics, generationResults, generateConcept]);

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
      const originalState = { ...sessionState };
      const newName = data.name;

      // Optimistic UI update
      setSessionState((prevState) => {
        if (!prevState) return null;
        const newState = { ...prevState };
        if (newName && newName !== subtopicName) {
          newState.subtopics = newState.subtopics.map((s) => (s === subtopicName ? newName : s));
          const { [subtopicName]: value, ...rest } = newState.generationResults;
          newState.generationResults = {
            ...rest,
            [newName]: { ...value, article: { ...value.article!, ...data } },
          };
          if (selectedSubtopic === subtopicName) {
            setSelectedSubtopic(newName);
          }
        } else {
          newState.generationResults[subtopicName] = {
            ...newState.generationResults[subtopicName],
            article: { ...newState.generationResults[subtopicName].article!, ...data },
          };
        }
        return newState;
      });

      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Nie udało się zaktualizować konceptu.");

        toast.success("Koncept został zaktualizowany.");
      } catch (error) {
        setSessionState(originalState);
        toast.error("Błąd zapisu. Przywracanie poprzedniego stanu.");
      }
    },
    [sessionState, setSessionState, selectedSubtopic]
  );

  const handleDeleteConcept = useCallback(async () => {
    if (!selectedSubtopic) return;

    const articleId = generationResults[selectedSubtopic]?.article?.id;
    if (!articleId) return;

    if (subtopics.length === 1) {
      setIsDeleteModalOpen(false);
      try {
        const response = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Nie udało się usunąć ostatniego konceptu.");
        toast.success("Ostatni koncept usunięty. Powrót do ekranu głównego.");
        onReset();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania.");
      }
      return;
    }

    const originalState = { ...sessionState };

    setSessionState((prevState) => {
      if (!prevState) return null;
      const newSubtopics = prevState.subtopics.filter((s) => s !== selectedSubtopic);
      const newResults = { ...prevState.generationResults };
      delete newResults[selectedSubtopic];
      const currentIndex = prevState.subtopics.findIndex((s) => s === selectedSubtopic);
      const nextSubtopic = newSubtopics[currentIndex] || newSubtopics[currentIndex - 1] || null;
      setSelectedSubtopic(nextSubtopic);
      return { ...prevState, subtopics: newSubtopics, generationResults: newResults };
    });
    setIsDeleteModalOpen(false);

    try {
      const response = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Nie udało się usunąć konceptu.");
      toast.success("Koncept został pomyślnie usunięty.");
    } catch (error) {
      setSessionState(originalState);
      toast.error(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas usuwania.");
    }
  }, [sessionState, setSessionState, onReset, selectedSubtopic]);

  const selectedResult = selectedSubtopic ? generationResults[selectedSubtopic] : null;

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-left">
          Generowanie konceptów dla: <span className="text-primary">{topicCluster.name}</span>
        </h2>
        <Button onClick={onReset} variant="outline" className="group">
          <Undo2 className="w-4 h-4 mr-2 transition-transform duration-500 group-hover:rotate-360" />
          Zacznij od nowa
        </Button>
      </div>
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
