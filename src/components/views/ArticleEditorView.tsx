import React, { useState, useEffect, useCallback } from "react";
import { useArticleEditor } from "../hooks/useArticleEditor";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { AutosaveIndicator } from "../shared/AutosaveIndicator";
import { ThreePanelLayout } from "../editor/layouts/ThreePanelLayout";
import { MobileEditorTabs } from "../editor/layouts/MobileEditorTabs";
import { ConfirmModal } from "../shared/ConfirmModal";
import { Sparkles, Library, FileUp } from "lucide-react";

interface ArticleEditorViewProps {
  articleId: string;
}

export const ArticleEditorView: React.FC<ArticleEditorViewProps> = ({ articleId }) => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const {
    article,
    customAudits,
    isLoading,
    error,
    loadingStates,
    updateField,
    sendMessage,
    generateBody,
    moveToSanity,
    modalState,
    setModalState,
  } = useArticleEditor(articleId);

  const toggleLeftPanel = useCallback(() => setIsLeftPanelOpen((prev) => !prev), []);
  const toggleRightPanel = useCallback(() => setIsRightPanelOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === "[") {
          event.preventDefault();
          toggleLeftPanel();
        } else if (event.key === "]") {
          event.preventDefault();
          toggleRightPanel();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleLeftPanel, toggleRightPanel]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error || !article) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{error || "Nie udało się załadować artykułu."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900">
        <div className="w-full">
          {/* Układ desktop - trzy panele */}
          <ThreePanelLayout
            article={article}
            customAudits={customAudits}
            onUpdateField={updateField}
            onSendMessage={sendMessage}
            onGenerateBody={() => setModalState({ ...modalState, generate: true })}
            onMoveToSanity={() => setModalState({ ...modalState, sanity: true })}
            loadingStates={{
              generating: loadingStates.generating,
              movingToSanity: loadingStates.movingToSanity,
            }}
            isLeftPanelOpen={isLeftPanelOpen}
            isRightPanelOpen={isRightPanelOpen}
            onToggleLeftPanel={toggleLeftPanel}
            onToggleRightPanel={toggleRightPanel}
          />

          {/* Układ mobilny - zakładki */}
          <MobileEditorTabs
            article={article}
            customAudits={customAudits}
            onUpdateField={updateField}
            onSendMessage={sendMessage}
            onGenerateBody={() => setModalState({ ...modalState, generate: true })}
            onMoveToSanity={() => setModalState({ ...modalState, sanity: true })}
            loadingStates={{
              generating: loadingStates.generating,
              movingToSanity: loadingStates.movingToSanity,
            }}
          />
        </div>
      </div>
      <ConfirmModal
        isOpen={modalState.generate}
        title="Generowanie treści artykułu"
        description="Czy na pewno chcesz wygenerować treść dla tego artykułu? Spowoduje to nadpisanie obecnej treści."
        onConfirm={generateBody}
        onCancel={() => setModalState({ ...modalState, generate: false })}
        confirmText="Generuj"
        cancelText="Anuluj"
        isConfirming={loadingStates.generating}
        icon={<Sparkles className="w-5 h-5 text-sky-400" />}
      />
      <ConfirmModal
        isOpen={modalState.sanity}
        title="Przeniesienie do Sanity"
        description="Czy na pewno chcesz przenieść ten artykuł do Sanity? Po przeniesieniu edycja w tym narzędziu zostanie zablokowana."
        onConfirm={moveToSanity}
        onCancel={() => setModalState({ ...modalState, sanity: false })}
        confirmText="Przenieś"
        cancelText="Anuluj"
        isConfirming={loadingStates.movingToSanity}
        variant="danger"
        icon={<FileUp className="w-5 h-5 text-red-400" />}
      />
    </>
  );
};

export default ArticleEditorView;
