import React from "react";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";
import { Brain, Zap } from "lucide-react";
import type { ChatMessage, CustomAuditDto } from "../../../types";

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  customAudits: CustomAuditDto[];
  isAiReplying: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ history, onSendMessage, customAudits, isAiReplying }) => {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700/30">
        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-white">Czat z AI</span>
        <div
          className={`ml-auto w-2 h-2 rounded-full ${isAiReplying ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
        />
      </div>

      {/* Chat History */}
      <ChatHistory history={history} isAiReplying={isAiReplying} />

      {/* Chat Input */}
      <ChatInput onSendMessage={onSendMessage} customAudits={customAudits} disabled={isAiReplying} />
    </div>
  );
};
