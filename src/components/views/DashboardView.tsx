import React, { useState, useEffect } from "react";
import useSessionStorage from "../hooks/useSessionStorage";
import { Sparkles, FolderSearch } from "lucide-react";
import { TopicCreationWizard } from "../dashboard/TopicCreationWizard";
import { ConceptGenerationList } from "../dashboard/ConceptGenerationList";
import type { TopicClusterDto, ArticleStubDto } from "../../types";

type WizardMode = "new" | "existing";

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
} | null;

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  disabled?: boolean;
  "data-testid"?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  title,
  description,
  disabled,
  "data-testid": dataTestId,
}) => (
  <div
    role="button"
    tabIndex={disabled ? -1 : 0}
    onClick={!disabled ? onClick : undefined}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (!disabled) onClick();
      }
    }}
    className={`
            w-full max-w-sm p-8 rounded-2xl
            flex flex-col items-center text-center
            bg-neutral-800/50 border-2 border-neutral-700/50
            transition-all duration-300 ease-in-out
            focus:outline-none
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-primary/70 hover:bg-neutral-800 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
            }
        `}
    data-testid={dataTestId}
  >
    <Icon className="w-10 h-10 mb-4 text-primary" />
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-neutral-400">{description}</p>
  </div>
);

export const DashboardView: React.FC = () => {
  const [wizardStatus, setWizardStatus] = useState<{ isOpen: boolean; mode: WizardMode }>({
    isOpen: false,
    mode: "new",
  });
  const [wizardKey, setWizardKey] = useState(0);

  const [generationData, setGenerationData] = useSessionStorage<GenerationSessionState>("conceptGenerationState", null);

  // State to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [clusters, setClusters] = useState<TopicClusterDto[]>([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(true);
  const [clustersError, setClustersError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClusters = async () => {
      setIsLoadingClusters(true);
      setClustersError(null);
      try {
        const response = await fetch("/api/topic-clusters");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać istniejących klastrów.");
        }
        const data: TopicClusterDto[] = await response.json();
        setClusters(data);
      } catch (err) {
        setClustersError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.");
      } finally {
        setIsLoadingClusters(false);
      }
    };
    fetchClusters();
  }, []);

  const openWizard = (mode: WizardMode) => {
    setWizardKey((prevKey) => prevKey + 1);
    setWizardStatus({ isOpen: true, mode: mode });
  };

  const closeWizard = () => {
    setWizardStatus({ isOpen: false, mode: "new" });
  };

  const handleWizardComplete = (subtopics: string[], topicCluster: TopicClusterDto) => {
    setGenerationData({ subtopics, topicCluster, generationResults: {} });
    closeWizard();
  };

  const handleResetFlow = () => {
    setGenerationData(null);
  };

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Zacznij od stworzenia nowego tematu lub wybierz istniejący, aby wygenerować koncepty artykułów.
        </p>
      </div>

      {hasMounted && generationData ? (
        <ConceptGenerationList
          sessionState={generationData}
          setSessionState={setGenerationData}
          onReset={handleResetFlow}
        />
      ) : (
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <ActionButton
            onClick={() => openWizard("new")}
            icon={Sparkles}
            title="Nowy temat"
            description="Rozpocznij od zera, korzystając z sugestii AI lub wprowadzając własny pomysł."
            data-testid="new-topic-button"
          />
          <ActionButton
            onClick={() => openWizard("existing")}
            icon={FolderSearch}
            title="Wybierz istniejący"
            description="Kontynuuj pracę nad jednym z wcześniej utworzonych klastrów tematycznych."
            disabled={isLoadingClusters}
            data-testid="existing-topic-button"
          />
        </div>
      )}

      <TopicCreationWizard
        key={wizardKey}
        isOpen={wizardStatus.isOpen}
        onOpenChange={(isOpen) => !isOpen && closeWizard()}
        onComplete={handleWizardComplete}
        initialMode={wizardStatus.mode}
        existingClusters={clusters}
        isLoadingClusters={isLoadingClusters}
        clustersError={clustersError}
      />
    </div>
  );
};
