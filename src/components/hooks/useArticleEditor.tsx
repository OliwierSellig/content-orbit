import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type {
  ArticleDto,
  ArticleEditorViewModel,
  UpdateArticleCommand,
  CustomAuditDto,
  ChatMessage,
  ArticleChatCommand,
} from "../../types";

interface LoadingStates {
  fetching: boolean;
  saving: boolean;
  generating: boolean;
  movingToSanity: boolean;
}

// Custom hook do zarządzania logiką edytora artykułu
export const useArticleEditor = (articleId: string) => {
  const [article, setArticle] = useState<ArticleEditorViewModel | null>(null);
  const [customAudits, setCustomAudits] = useState<CustomAuditDto[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetching: true,
    saving: false,
    generating: false,
    movingToSanity: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState({
    generate: false,
    sanity: false,
  });

  // Ref do przechowywania timeoutu auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref do przechowywania oryginalnych danych artykułu dla porównania
  const originalDataRef = useRef<Partial<ArticleDto> | null>(null);

  // Helper functions for chat history session storage
  const getChatHistoryKey = useCallback(() => `article-chat-${articleId}`, [articleId]);

  const loadChatHistory = useCallback((): ChatMessage[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.sessionStorage.getItem(getChatHistoryKey());
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Error loading chat history:", error);
      return [];
    }
  }, [getChatHistoryKey]);

  const saveChatHistory = useCallback(
    (history: ChatMessage[]) => {
      if (typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(getChatHistoryKey(), JSON.stringify(history));
      } catch (error) {
        console.warn("Error saving chat history:", error);
      }
    },
    [getChatHistoryKey]
  );

  // Konwertuje ArticleDto na ArticleEditorViewModel
  const convertToViewModel = useCallback((articleData: ArticleDto): ArticleEditorViewModel => {
    return {
      ...articleData,
      isDirty: false,
      autosaveStatus: "idle",
      generationStatus: "idle",
      chatHistory: [], // Will be set separately after loading
      isAiReplying: false,
    };
  }, []);

  // Sprawdza czy dane się zmieniły
  const checkIsDirty = useCallback((currentData: Partial<ArticleDto>) => {
    if (!originalDataRef.current) return false;

    const fieldsToCheck: (keyof ArticleDto)[] = [
      "name",
      "content",
      "title",
      "slug",
      "description",
      "seo_title",
      "seo_description",
    ];

    return fieldsToCheck.some((field) => currentData[field] !== originalDataRef.current![field]);
  }, []);

  // Funkcja auto-save z debounce
  const scheduleAutoSave = useCallback(
    (data: Partial<UpdateArticleCommand>) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      setArticle((prev) => (prev ? { ...prev, autosaveStatus: "saving" } : null));

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/articles/${articleId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const updatedArticle: ArticleDto = await response.json();
            originalDataRef.current = updatedArticle;

            setArticle((prev) =>
              prev
                ? {
                    ...prev,
                    ...updatedArticle,
                    isDirty: false,
                    autosaveStatus: "success",
                  }
                : null
            );

            setTimeout(() => {
              setArticle((prev) => (prev ? { ...prev, autosaveStatus: "idle" } : null));
            }, 2000);
          } else {
            throw new Error("Nie udało się zapisać zmian");
          }
        } catch (err) {
          setArticle((prev) => (prev ? { ...prev, autosaveStatus: "error" } : null));
          toast.error("Błąd podczas zapisywania zmian");
        }
      }, 1000);
    },
    [articleId]
  );

  // Aktualizuje pojedyncze pole artykułu
  const updateField = useCallback(
    (field: keyof UpdateArticleCommand, value: string) => {
      setArticle((prev) => {
        if (!prev) return null;

        const updatedData = { ...prev, [field]: value };
        const isDirty = checkIsDirty(updatedData);

        if (isDirty) {
          scheduleAutoSave({ [field]: value });
        }

        return { ...updatedData, isDirty };
      });
    },
    [checkIsDirty, scheduleAutoSave]
  );

  // Pobieranie danych artykułu i audytów
  const fetchData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, fetching: true }));

      const [articleResponse, auditsResponse] = await Promise.all([
        fetch(`/api/articles/${articleId}`),
        fetch("/api/custom-audits"),
      ]);

      if (!articleResponse.ok) {
        throw new Error("Nie udało się pobrać artykułu");
      }

      const articleData: ArticleDto = await articleResponse.json();
      const auditsData: CustomAuditDto[] = auditsResponse.ok ? await auditsResponse.json() : [];

      originalDataRef.current = articleData;
      const viewModel = convertToViewModel(articleData);

      // Load chat history from session storage and set it
      const chatHistory = loadChatHistory();
      setArticle({ ...viewModel, chatHistory });
      setCustomAudits(auditsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoadingStates((prev) => ({ ...prev, fetching: false }));
    }
  }, [articleId, convertToViewModel, loadChatHistory]);

  // Effect do pobierania danych przy inicjalizacji
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup timeout przy odmontowaniu
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Wysyłanie wiadomości w czacie
  const sendMessage = useCallback(
    async (message: string) => {
      if (!article || article.isAiReplying) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
      };

      // Create new chat history with user message
      const newChatHistory = [...article.chatHistory, userMessage];
      saveChatHistory(newChatHistory); // Save to session storage

      // Dodaj wiadomość użytkownika
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              chatHistory: newChatHistory,
              isAiReplying: true,
            }
          : null
      );

      try {
        const chatCommand: ArticleChatCommand = {
          message,
          history: newChatHistory.slice(0, -1).map((msg) => ({ role: msg.role, content: msg.content })), // Exclude the current message from history
        };

        const response = await fetch(`/api/articles/${articleId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatCommand),
        });

        if (!response.ok) {
          throw new Error("Nie udało się wysłać wiadomości");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Nie można odczytać odpowiedzi");
        }

        const decoder = new TextDecoder();
        let assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "",
        };

        // Add empty assistant message to chat history
        const chatWithAssistant = [...newChatHistory, assistantMessage];
        saveChatHistory(chatWithAssistant);

        // Dodaj pustą wiadomość asystenta
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                chatHistory: chatWithAssistant,
              }
            : null
        );

        // Czytaj strumień
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setArticle((prev) => (prev ? { ...prev, isAiReplying: false } : null));
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantMessage.content += " " + parsed.text;

                  // Update chat history in session storage
                  const updatedHistory = [...newChatHistory, { ...assistantMessage }];
                  saveChatHistory(updatedHistory);

                  // Aktualizuj ostatnią wiadomość asystenta
                  setArticle((prev) => {
                    if (!prev) return null;
                    return { ...prev, chatHistory: updatedHistory };
                  });
                }
              } catch (e) {
                // Ignoruj błędy parsowania pojedynczych chunków
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas komunikacji z AI";

        // Dodaj wiadomość błędu do czatu
        const errorMessage_chat: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `Przepraszam, wystąpił błąd: ${errorMessage}`,
        };

        const chatWithError = [...newChatHistory, errorMessage_chat];
        saveChatHistory(chatWithError); // Save to session storage

        setArticle((prev) =>
          prev
            ? {
                ...prev,
                chatHistory: chatWithError,
                isAiReplying: false,
              }
            : null
        );

        toast.error(errorMessage);
      }
    },
    [article, articleId, saveChatHistory]
  );

  // Generowanie treści artykułu
  const generateBody = useCallback(async () => {
    if (!article) return;

    try {
      setLoadingStates((prev) => ({ ...prev, generating: true }));
      setArticle((prev) => (prev ? { ...prev, generationStatus: "generating" } : null));

      const response = await fetch(`/api/articles/${articleId}/generate-body`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Nie udało się wygenerować treści");
      }

      const updatedArticle: ArticleDto = await response.json();
      originalDataRef.current = updatedArticle;

      setArticle((prev) =>
        prev
          ? {
              ...prev,
              ...updatedArticle,
              isDirty: false,
              generationStatus: "success",
            }
          : null
      );

      toast.success("Treść została pomyślnie wygenerowana");

      setTimeout(() => {
        setArticle((prev) => (prev ? { ...prev, generationStatus: "idle" } : null));
      }, 2000);
    } catch (err) {
      setArticle((prev) => (prev ? { ...prev, generationStatus: "error" } : null));
      toast.error("Błąd podczas generowania treści");
    } finally {
      setLoadingStates((prev) => ({ ...prev, generating: false }));
    }
  }, [article, articleId]);

  // Przenoszenie artykułu do Sanity
  const moveToSanity = useCallback(async () => {
    if (!article) return;

    try {
      setLoadingStates((prev) => ({ ...prev, movingToSanity: true }));

      const response = await fetch(`/api/articles/${articleId}/move-to-sanity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Nie udało się przenieść artykułu");
      }

      const updatedArticle: ArticleDto = await response.json();
      originalDataRef.current = updatedArticle;

      setArticle((prev) =>
        prev
          ? {
              ...prev,
              ...updatedArticle,
              isDirty: false,
            }
          : null
      );

      toast.success("Artykuł został pomyślnie przeniesiony do Sanity");
    } catch (err) {
      toast.error("Błąd podczas przenoszenia artykułu");
    } finally {
      setLoadingStates((prev) => ({ ...prev, movingToSanity: false }));
    }
  }, [article, articleId]);

  return {
    article,
    customAudits,
    isLoading: loadingStates.fetching,
    error,
    loadingStates,
    updateField,
    sendMessage,
    generateBody,
    moveToSanity,
    modalState,
    setModalState,
  };
};
