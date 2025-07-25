import React, { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { ChatMessage } from "../../../types";

interface ChatHistoryProps {
  history: ChatMessage[];
  isAiReplying: boolean;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ history, isAiReplying }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or AI starts replying
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    // Small delay to ensure content has rendered
    const timeoutId = setTimeout(scrollToBottom, 50);

    return () => clearTimeout(timeoutId);
  }, [history.length, isAiReplying]);

  // Check if AI is thinking (before stream starts) vs streaming (response in progress)
  const lastMessage = history[history.length - 1];
  const isAiCurrentlyStreaming = isAiReplying && lastMessage?.role === "assistant";
  const isAiThinking = isAiReplying && !isAiCurrentlyStreaming;

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto mb-4 bg-neutral-900/30 rounded-lg p-3 space-y-3 border border-neutral-700/20 custom-scrollbar scroll-smooth"
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageCircle className="w-8 h-8 text-neutral-500 mb-3" />
          <p className="text-neutral-400 text-xs mb-1">Rozpocznij konwersację</p>
          <p className="text-neutral-600 text-xs max-w-[180px] leading-relaxed">
            Zadaj pytanie lub użyj <span className="text-violet-400 font-mono">/</span> dla komend
          </p>
        </div>
      ) : (
        history.map((message, index) => (
          <div key={message.id} className={`${message.role === "user" ? "ml-4" : "mr-4"}`}>
            {/* Message Content */}
            <div
              className={`${
                message.role === "user"
                  ? "bg-blue-500/15 border border-blue-500/25 ml-auto"
                  : "bg-neutral-700/40 border border-neutral-600/30"
              } rounded-lg p-3`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-xs font-medium ${message.role === "user" ? "text-blue-300" : "text-violet-300"}`}
                >
                  {message.role === "user" ? "Ty" : "AI"}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Message Text */}
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === "user" ? "text-blue-50" : "text-neutral-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))
      )}

      {/* AI Thinking Indicator - Only show when thinking, not when streaming */}
      {isAiThinking && (
        <div className="mr-4">
          <div className="bg-neutral-700/20 border border-neutral-600/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-violet-300">AI</span>
              <div className="flex gap-1">
                <div
                  className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
