import React from "react";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";
import type { ChatMessage, CustomAuditDto } from "../../../types";

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  customAudits: CustomAuditDto[];
  isAiReplying: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ history, onSendMessage, customAudits, isAiReplying }) => {
  return (
    <div className="flex-1 flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">Czat z AI</h3>

      <ChatHistory history={history} isAiReplying={isAiReplying} />

      <ChatInput onSendMessage={onSendMessage} customAudits={customAudits} disabled={isAiReplying} />
    </div>
  );
};
