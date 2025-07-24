import React, { useRef, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { MarkdownEditor } from "../editors/MarkdownEditor";
import { MetadataForm } from "../forms/MetadataForm";
import type { ArticleEditorViewModel, CustomAuditDto, UpdateArticleCommand } from "@/types";
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
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const defaultSize = 18;

  useEffect(() => {
    const panel = leftPanelRef.current;
    if (panel) {
      if (isLeftPanelOpen) {
        panel.resize(defaultSize);
      } else {
        panel.collapse();
      }
    }
  }, [isLeftPanelOpen]);

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (panel) {
      if (isRightPanelOpen) {
        panel.resize(defaultSize);
      } else {
        panel.collapse();
      }
    }
  }, [isRightPanelOpen]);

  const handleIsDragging = (isDragging: boolean) => {
    setIsDragging(isDragging);
    if (!isDragging) {
      flushSync(() => {
        setIsSettling(true);
      });

      const left = leftPanelRef.current;
      const right = rightPanelRef.current;

      if (left && !isLeftPanelOpen) {
        left.resize(0);
      }
      if (right && !isRightPanelOpen) {
        right.resize(0);
      }

      setIsSettling(false);
    }
  };

  return (
    <div className="hidden lg:flex w-full h-[calc(100vh-64px)]">
      <PanelGroup direction="horizontal">
        <Panel
          ref={leftPanelRef}
          collapsible={!isDragging}
          collapsedSize={0}
          minSize={10}
          maxSize={40}
          defaultSize={defaultSize}
          onCollapse={() => {
            if (isLeftPanelOpen) onToggleLeftPanel();
          }}
          className={cn({ "transition-all duration-200 ease-in-out": !isDragging && !isSettling })}
        >
          <div
            className={cn(
              "w-full bg-neutral-800/20 border-r border-b rounded-br-md border-neutral-700/50 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar",
              {
                "opacity-0": !isLeftPanelOpen,
                "opacity-100 transition-opacity duration-200 ease-in-out": isLeftPanelOpen,
              }
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
        </Panel>
        <PanelResizeHandle className="panel-resize-handle" onDragging={handleIsDragging}>
          <div className="panel-resize-handle-bar" />
        </PanelResizeHandle>
        <Panel minSize={30}>
          <div className="flex-1 p-6 pt-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div className="mb-4 sticky top-0 bg-neutral-900 z-10 py-2 -my-2">
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
        </Panel>
        <PanelResizeHandle className="panel-resize-handle" onDragging={handleIsDragging}>
          <div className="panel-resize-handle-bar" />
        </PanelResizeHandle>
        <Panel
          ref={rightPanelRef}
          collapsible={!isDragging}
          collapsedSize={0}
          minSize={10}
          maxSize={40}
          defaultSize={defaultSize}
          onCollapse={() => {
            if (isRightPanelOpen) onToggleRightPanel();
          }}
          className={cn({ "transition-all duration-200 ease-in-out": !isDragging && !isSettling })}
        >
          <div
            className={cn(
              "w-full bg-neutral-800/20 border-l border-b rounded-bl-md border-neutral-700/50 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar",
              {
                "opacity-0": !isRightPanelOpen,
                "opacity-100 transition-opacity duration-200 ease-in-out": isRightPanelOpen,
              }
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
        </Panel>
      </PanelGroup>
    </div>
  );
};
