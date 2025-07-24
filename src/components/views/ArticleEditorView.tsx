import React, { useState } from "react";
import { useArticleEditor } from "../hooks/useArticleEditor";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { AutosaveIndicator } from "../shared/AutosaveIndicator";
import { ThreePanelLayout } from "../editor/layouts/ThreePanelLayout";
import { MobileEditorTabs } from "../editor/layouts/MobileEditorTabs";

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
  } = useArticleEditor(articleId);

  const toggleLeftPanel = () => setIsLeftPanelOpen((prev) => !prev);
  const toggleRightPanel = () => setIsRightPanelOpen((prev) => !prev);

  // Szkieletowy widok podczas ładowania
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900">
        <div className="w-full py-12 px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner />
              <p className="text-neutral-400 mt-4">Ładowanie edytora artykułu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Widok błędu
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900">
        <div className="w-full py-12 px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-400 mb-4 text-4xl">⚠️</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Wystąpił błąd</h3>
              <p className="text-neutral-400 mb-6">{error || "Nie udało się załadować artykułu"}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-200"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900">
      <div className="w-full">
        {/* Układ desktop - trzy panele */}
        <ThreePanelLayout
          article={article}
          customAudits={customAudits}
          onUpdateField={updateField}
          onSendMessage={sendMessage}
          onGenerateBody={generateBody}
          onMoveToSanity={moveToSanity}
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
          onGenerateBody={generateBody}
          onMoveToSanity={moveToSanity}
          loadingStates={{
            generating: loadingStates.generating,
            movingToSanity: loadingStates.movingToSanity,
          }}
        />
      </div>
    </div>
  );
};

export default ArticleEditorView;
