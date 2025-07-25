import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTopicGeneration } from "../hooks/useTopicGeneration";
import { TopicGenerationContext } from "../../contexts/TopicGenerationContext";
import type { TopicClusterDto } from "../../types";
import { TopicChoice } from "./steps/TopicChoice";
import { TopicSelection } from "./steps/TopicSelection";
import { SubtopicManagement } from "./steps/SubtopicManagement";
import { LoadingSpinner } from "../shared/LoadingSpinner";

interface TopicCreationWizardProps {
  isOpen: boolean;
  initialMode: "new" | "existing";
  onOpenChange: (isOpen: boolean) => void;
  onComplete: (subtopics: string[], topicCluster: TopicClusterDto) => void;
  existingClusters: TopicClusterDto[];
  isLoadingClusters: boolean;
  clustersError: string | null;
}

export const TopicCreationWizard: React.FC<TopicCreationWizardProps> = ({
  isOpen,
  onOpenChange,
  onComplete,
  initialMode,
  existingClusters,
  isLoadingClusters,
  clustersError,
}) => {
  const { state, actions } = useTopicGeneration({ initialMode });

  const handleSubtopicCompletion = (subtopics: string[], cluster: TopicClusterDto) => {
    onComplete(subtopics, cluster);
    actions.reset(); // Reset wizard state after completion
  };

  const renderStep = () => {
    // Show loading state when generating subtopics after cluster/topic selection
    if (
      state.isLoading &&
      (state.step === "topic_selection_existing" ||
        state.step === "topic_selection_ai" ||
        state.step === "topic_selection_manual")
    ) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <LoadingSpinner />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">Generowanie podtematów...</h3>
            <p className="text-neutral-400 text-sm">
              Tworzę propozycje podtematów dla tematu:{" "}
              <span className="font-medium text-white">"{state.selectedTopicName}"</span>
            </p>
          </div>
        </div>
      );
    }

    switch (state.step) {
      case "topic_choice":
        return <TopicChoice />;
      case "topic_selection_ai":
      case "topic_selection_manual":
      case "topic_selection_existing":
        return (
          <TopicSelection
            existingClusters={existingClusters}
            isLoadingClusters={isLoadingClusters}
            clustersError={clustersError}
          />
        );
      case "subtopic_management":
        return <SubtopicManagement onComplete={handleSubtopicCompletion} />;
      default:
        return null;
    }
  };

  const getTitleForStep = () => {
    // Show loading title when generating subtopics
    if (
      state.isLoading &&
      (state.step === "topic_selection_existing" ||
        state.step === "topic_selection_ai" ||
        state.step === "topic_selection_manual")
    ) {
      return "Generowanie podtematów";
    }

    switch (state.step) {
      case "topic_choice":
        return "Wybierz metodę";
      case "topic_selection_ai":
        return "Wybierz temat (AI)";
      case "topic_selection_manual":
        return "Wprowadź temat ręcznie";
      case "topic_selection_existing":
        return "Wybierz istniejący klaster";
      case "subtopic_management":
        return `Zarządzaj podtematami dla: ${state.selectedTopicName}`;
      default:
        return "Nowy temat";
    }
  };

  const getDescriptionForStep = () => {
    // Show loading description when generating subtopics
    if (
      state.isLoading &&
      (state.step === "topic_selection_existing" ||
        state.step === "topic_selection_ai" ||
        state.step === "topic_selection_manual")
    ) {
      return "Analizuję wybrany temat i tworzę listę propozycji podtematów...";
    }

    switch (state.step) {
      case "topic_choice":
        return "Wybierz preferowaną metodę, aby rozpocząć proces tworzenia nowego klastra tematycznego.";
      case "topic_selection_ai":
        return "Pozwól sztucznej inteligencji zaproponować tematy na podstawie Twojej wiedzy i preferencji.";
      case "topic_selection_manual":
        return "Wprowadź nazwę dla swojego nowego klastra tematycznego.";
      case "topic_selection_existing":
        return "Przeglądaj i wybierz z listy istniejących już klastrów tematycznych w Twoim projekcie.";
      case "subtopic_management":
        return "Zarządzaj listą podtematów. Możesz je dodawać, usuwać i edytować przed wygenerowaniem konceptów.";
      default:
        return "Rozpocznij tworzenie nowego klastra tematycznego.";
    }
  };

  return (
    <TopicGenerationContext.Provider value={{ state, actions }}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onOpenChange(false);
            actions.reset();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[850px] h-auto md:h-[85vh] max-h-[50rem] flex flex-col bg-neutral-800/95 backdrop-blur-md border-2 border-neutral-700/50 rounded-2xl shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60"></div>
          <DialogHeader className="space-y-4 pb-2 text-left">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              {getTitleForStep()}
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-base leading-relaxed">
              {getDescriptionForStep()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow flex flex-col min-h-0 p-4">{renderStep()}</div>
        </DialogContent>
      </Dialog>
    </TopicGenerationContext.Provider>
  );
};
