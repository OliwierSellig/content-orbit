import React, { useState, useRef, useEffect } from "react";
import { SlashCommandMenu } from "./SlashCommandMenu";
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

  // Obsługa zmiany tekstu i wykrywanie slash command
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Sprawdź czy ostatni znak to "/"
    if (value.endsWith("/") && customAudits.length > 0) {
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();

      // Pozycjonuj menu nad textarea
      setSlashMenuPosition({
        top: rect.top - 10,
        left: rect.left,
      });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  // Obsługa wyboru komendy slash
  const handleSelectCommand = (prompt: string) => {
    // Usuń ostatni "/" i dodaj prompt
    const newMessage = message.slice(0, -1) + prompt;
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

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość... (użyj / dla komend)"
          disabled={disabled}
          className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
          rows={3}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-all duration-200 text-sm"
        >
          Wyślij
        </button>
      </form>

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
