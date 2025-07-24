import React from "react";
import { LoadingSpinner } from "../../shared/LoadingSpinner";
import type { ChatMessage } from "../../../types";

interface ChatHistoryProps {
  history: ChatMessage[];
  isAiReplying: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ history, isAiReplying }) => {
  return (
    <div className="flex-1 overflow-y-auto mb-4 bg-neutral-900/50 rounded-lg p-4 space-y-3">
      {history.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center italic">Rozpocznij rozmowę z asystentem AI</p>
      ) : (
        history.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === "user" ? "bg-primary/20 text-white ml-4" : "bg-neutral-700/50 text-neutral-200 mr-4"
            }`}
          >
            <div className="text-xs text-neutral-400 mb-1 capitalize">
              {message.role === "user" ? "Ty" : "Asystent"}
            </div>
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          </div>
        ))
      )}
      {isAiReplying && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <LoadingSpinner />
          <span>Asystent pisze...</span>
        </div>
      )}
    </div>
  );
};
