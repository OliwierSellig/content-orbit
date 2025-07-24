import React, { useState } from "react";
import { MarkdownEditor } from "../editors/MarkdownEditor";
import { MetadataForm } from "../forms/MetadataForm";
import type { ArticleEditorViewModel, CustomAuditDto, UpdateArticleCommand } from "../../../types";
import { ActionPanel } from "../chat/ActionPanel";
import { ChatPanel } from "../chat/ChatPanel";

interface MobileEditorTabsProps {
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
}

type TabType = "actions" | "editor" | "metadata";

export const MobileEditorTabs: React.FC<MobileEditorTabsProps> = ({
  article,
  customAudits,
  onUpdateField,
  onSendMessage,
  onGenerateBody,
  onMoveToSanity,
  loadingStates,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("editor");

  const tabs = [
    { id: "actions" as const, label: "Akcje & Czat" },
    { id: "editor" as const, label: "Edytor" },
    { id: "metadata" as const, label: "Metadane" },
  ];

  return (
    <div className="lg:hidden w-full">
      {/* Nawigacja zakładek */}
      <div className="flex bg-neutral-800/50 rounded-t-lg border-b border-neutral-700/50 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white bg-neutral-700/50 border-b-2 border-primary"
                : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zawartość zakładek */}
      <div className="bg-neutral-800/50 rounded-b-lg border border-neutral-700/50 border-t-0 p-6 min-h-[70vh] w-full">
        {activeTab === "actions" && (
          <div className="flex flex-col h-full">
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
        )}

        {activeTab === "editor" && (
          <div className="h-full">
            <MarkdownEditor
              content={article.content || ""}
              onChange={(value: string) => onUpdateField("content", value)}
              disabled={article.isAiReplying}
              isLoading={loadingStates.generating}
            />
          </div>
        )}

        {activeTab === "metadata" && (
          <div className="h-full">
            <MetadataForm
              article={article}
              onFieldChange={onUpdateField}
              disabled={article.isAiReplying}
              isLoading={loadingStates.movingToSanity}
              onMoveToSanity={onMoveToSanity}
            />
          </div>
        )}
      </div>
    </div>
  );
};
