import React from "react";
import { MarkdownEditor } from "../editors/MarkdownEditor";
import { MetadataForm } from "../forms/MetadataForm";
import type { ArticleEditorViewModel, CustomAuditDto, UpdateArticleCommand } from "../../../types";
import { ChatPanel } from "@/components/editor/chat/ChatPanel";
import { ActionPanel } from "@/components/editor/chat/ActionPanel";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "../common/EditorToolbar";

interface ThreePanelLayoutProps {
  article: ArticleEditorViewModel;
  customAudits: CustomAuditDto[];
  onUpdateField: (field: keyof UpdateArticleCommand, value: string) => void;
  onSendMessage: (message: string) => void;
  onGenerateBody: () => void;
  onMoveToSanity: () => void;
  loadingStates: {
    generating: boolean;
    movingToSanity: boolean;
  };
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  article,
  customAudits,
  onUpdateField,
  onSendMessage,
  onGenerateBody,
  onMoveToSanity,
  loadingStates,
  isLeftPanelOpen,
  isRightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
}) => {
  return (
    <div className="hidden lg:flex w-full">
      {/* Lewy panel */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden sticky top-0 h-[calc(100vh-64px)]",
          isLeftPanelOpen ? "w-100" : "w-0"
        )}
      >
        <div className="w-100 bg-neutral-800/20 border-r border-b rounded-br-md border-neutral-700/50 p-6 flex flex-col sticky h-full">
          <div
            className={cn(
              "transition-opacity duration-200 h-full overflow-y-auto custom-scrollbar",
              isLeftPanelOpen ? "opacity-100" : "opacity-0"
            )}
          >
            <ActionPanel
              onGenerateBody={onGenerateBody}
              isLoading={loadingStates.generating}
              disabled={article.isAiReplying}
            />
            <ChatPanel
              history={article.chatHistory}
              onSendMessage={onSendMessage}
              customAudits={customAudits}
              isAiReplying={article.isAiReplying}
            />
          </div>
        </div>
      </div>

      {/* Środkowy panel */}
      <div className="flex-1 p-6 pt-6 flex flex-col">
        <div className="mb-4">
          <EditorToolbar
            isLeftPanelOpen={isLeftPanelOpen}
            isRightPanelOpen={isRightPanelOpen}
            onToggleLeftPanel={onToggleLeftPanel}
            onToggleRightPanel={onToggleRightPanel}
          />
        </div>

        <div className="w-3/4 mb-12 text-left">
          <h1 className="text-4xl font-bold text-white mb-3">{article.title || "Wpisz tytuł..."}</h1>
          <p className="text-lg text-neutral-400">{article.description || "Wpisz opis..."}</p>
        </div>
        <MarkdownEditor
          content={article.content || ""}
          onChange={(value: string) => onUpdateField("content", value)}
          disabled={article.isAiReplying}
          isLoading={loadingStates.generating}
        />
      </div>

      {/* Prawy panel */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden sticky top-0 h-[calc(100vh-64px)]",
          isRightPanelOpen ? "w-100" : "w-0"
        )}
      >
        <div className="w-100 bg-neutral-800/20 border-l border-b rounded-bl-md border-neutral-700/50 p-6 flex flex-col  h-[calc(100vh-64px)]">
          <div
            className={cn(
              "transition-opacity duration-200 h-full overflow-y-auto custom-scrollbar",
              isRightPanelOpen ? "opacity-100" : "opacity-0"
            )}
          >
            <MetadataForm
              article={article}
              onFieldChange={onUpdateField}
              disabled={article.isAiReplying}
              isLoading={loadingStates.movingToSanity}
              onMoveToSanity={onMoveToSanity}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
