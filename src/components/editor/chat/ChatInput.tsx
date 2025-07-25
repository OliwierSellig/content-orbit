import React, { useState, useRef, useEffect } from "react";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { Send } from "lucide-react";
import type { CustomAuditDto } from "../../../types";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  customAudits: CustomAuditDto[];
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, customAudits, disabled = false }) => {
  const [message, setMessage] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  }, [message]);

  // Obsługa zmiany tekstu i wykrywanie slash command
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Sprawdź czy "/" jest komendą (nie częścią zwykłego tekstu)
    const shouldShowSlashMenu = () => {
      if (!value.endsWith("/") || customAudits.length === 0) {
        return false;
      }

      // Przypadek 1: Textarea jest pusta i wpisujemy tylko "/"
      if (value === "/") {
        return true;
      }

      // Przypadek 2: "/" jest na początku nowej linii
      if (value.endsWith("\n/")) {
        return true;
      }

      // Przypadek 3: "/" jest po spacji (nowa komenda)
      if (value.endsWith(" /")) {
        return true;
      }

      // W przeciwnym razie "/" jest częścią tekstu (np. "w/w", "24/7")
      return false;
    };

    if (shouldShowSlashMenu()) {
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();

      // Position menu above textarea (menu will adjust its own position)
      setSlashMenuPosition({
        top: rect.top,
        left: rect.left,
      });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  // Obsługa wyboru komendy slash
  const handleSelectCommand = (prompt: string) => {
    // Usuń "/" i dodaj prompt z odpowiednim formatowaniem
    let newMessage = "";

    if (message === "/") {
      // Przypadek 1: Sam "/" - zastąp całkowicie
      newMessage = prompt;
    } else if (message.endsWith("\n/")) {
      // Przypadek 2: "/" na nowej linii
      newMessage = message.slice(0, -1) + prompt;
    } else if (message.endsWith(" /")) {
      // Przypadek 3: "/" po spacji
      newMessage = message.slice(0, -1) + prompt;
    }

    setMessage(newMessage);
    setShowSlashMenu(false);

    // Fokus z powrotem na textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Obsługa wysłania wiadomości
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();

    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setShowSlashMenu(false);
    }
  };

  // Obsługa klawiatury
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }

    if (e.key === "Escape") {
      setShowSlashMenu(false);
    }
  };

  // Ukryj menu gdy klikniesz poza nim
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSlashMenu(false);
    };

    if (showSlashMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSlashMenu]);

  const canSend = message.trim() && !disabled;

  // Dynamic placeholder based on available audits
  const getPlaceholder = () => {
    if (disabled) return "AI myśli...";
    if (customAudits.length > 0) {
      return "Napisz wiadomość... (użyj / dla niestandardowych audytów)";
    }
    return "Napisz swoją wiadomość...";
  };

  return (
    <div className="mt-auto">
      {/* Input Container */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Large Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className="w-full px-4 py-3 bg-neutral-700/60 border border-neutral-600/40 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none disabled:opacity-50 text-sm leading-relaxed min-h-[100px] max-h-[160px] custom-scrollbar"
            rows={4}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!canSend}
            className={`w-full mt-[-8px] py-3 cursor-pointer rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none ${
              canSend
                ? "bg-violet-500/80 hover:bg-violet-600/80 text-white shadow-sm hover:shadow-md"
                : "bg-neutral-700/50 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              <span>Wyślij wiadomość</span>
            </div>
          </button>
        </form>
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        customAudits={customAudits}
        isVisible={showSlashMenu}
        onSelectCommand={handleSelectCommand}
        position={slashMenuPosition}
      />
    </div>
  );
};
