import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type {
  ArticleDto,
  ArticleEditorViewModel,
  ChatMessage,
  ArticleChatCommand,
  CustomAuditDto,
  UpdateArticleCommand,
} from "../../types";

// Stan loading dla różnych operacji
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

  // Konwertuje ArticleDto na ArticleEditorViewModel
  const convertToViewModel = useCallback((articleData: ArticleDto): ArticleEditorViewModel => {
    return {
      ...articleData,
      isDirty: false,
      autosaveStatus: "idle",
      generationStatus: "idle",
      chatHistory: [],
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

  // Pobieranie początkowych danych
  const fetchInitialData = useCallback(async () => {
    try {
      setLoadingStates((prev) => ({ ...prev, fetching: true }));
      setError(null);

      // Pobierz artykuł i custom audits równolegle
      const [articleResponse, auditsResponse] = await Promise.all([
        fetch(`/api/articles/${articleId}`),
        fetch("/api/custom-audits"),
      ]);

      if (!articleResponse.ok) {
        throw new Error("Nie udało się pobrać artykułu");
      }

      if (!auditsResponse.ok) {
        throw new Error("Nie udało się pobrać audytów");
      }

      const articleData: ArticleDto = await articleResponse.json();
      const auditsData: CustomAuditDto[] = await auditsResponse.json();

      // Zapisz oryginalne dane do porównania
      originalDataRef.current = { ...articleData };

      // Konwertuj na view model
      const viewModel = convertToViewModel(articleData);

      setArticle(viewModel);
      setCustomAudits(auditsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingStates((prev) => ({ ...prev, fetching: false }));
    }
  }, [articleId, convertToViewModel]);

  // Auto-save funkcjonalność
  const performAutoSave = useCallback(
    async (dataToSave: UpdateArticleCommand) => {
      if (!article) return;

      try {
        setArticle((prev) => (prev ? { ...prev, autosaveStatus: "saving" } : null));

        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zapisać zmian");
        }

        const updatedArticle: ArticleDto = await response.json();

        // Aktualizuj oryginalne dane
        originalDataRef.current = { ...updatedArticle };

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

        // Wyczyść status po 2 sekundach
        setTimeout(() => {
          setArticle((prev) => (prev ? { ...prev, autosaveStatus: "idle" } : null));
        }, 2000);
      } catch (err) {
        setArticle((prev) => (prev ? { ...prev, autosaveStatus: "error" } : null));
        toast.error("Nie udało się zapisać zmian automatycznie");
      }
    },
    [article, articleId]
  );

  // Aktualizacja pola artykułu z auto-save
  const updateField = useCallback(
    (field: keyof UpdateArticleCommand, value: string) => {
      if (!article) return;

      setArticle((prev) => {
        if (!prev) return null;

        const updated = { ...prev, [field]: value };
        const isDirty = checkIsDirty(updated);

        return { ...updated, isDirty };
      });

      // Anuluj poprzedni timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Ustaw nowy timeout na auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        const dataToSave: UpdateArticleCommand = { [field]: value };
        performAutoSave(dataToSave);
      }, 1000); // 1 sekunda debounce
    },
    [article, checkIsDirty, performAutoSave]
  );

  // Wysyłanie wiadomości w czacie
  const sendMessage = useCallback(
    async (message: string) => {
      if (!article || article.isAiReplying) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
      };

      // Dodaj wiadomość użytkownika
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              chatHistory: [...prev.chatHistory, userMessage],
              isAiReplying: true,
            }
          : null
      );

      try {
        const chatCommand: ArticleChatCommand = {
          message,
          history: article.chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
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

        // Dodaj pustą wiadomość asystenta
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                chatHistory: [...prev.chatHistory, assistantMessage],
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
                  // Aktualizuj ostatnią wiadomość asystenta
                  setArticle((prev) => {
                    if (!prev) return null;
                    const updatedHistory = [...prev.chatHistory];
                    updatedHistory[updatedHistory.length - 1] = { ...assistantMessage };
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

        setArticle((prev) =>
          prev
            ? {
                ...prev,
                chatHistory: [...prev.chatHistory, errorMessage_chat],
                isAiReplying: false,
              }
            : null
        );

        toast.error(errorMessage);
      }
    },
    [article, articleId]
  );

  // Generowanie treści artykułu
  const generateBody = useCallback(async () => {
    if (!article || loadingStates.generating) return;

    setModalState((prev) => ({ ...prev, generate: false }));
    setLoadingStates((prev) => ({ ...prev, generating: true }));
    setArticle((prev) => (prev ? { ...prev, content: "", generationStatus: "generating" } : null));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    const updatedArticle: Partial<ArticleDto> = {
      content: "Mocked generated content.",
    };
    originalDataRef.current = { ...originalDataRef.current, ...updatedArticle };

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

    toast.success("Treść artykułu została wygenerowana");

    setTimeout(() => {
      setArticle((prev) => (prev ? { ...prev, generationStatus: "idle" } : null));
    }, 3000);

    setLoadingStates((prev) => ({ ...prev, generating: false }));
  }, [article, loadingStates.generating]);

  // Przeniesienie do Sanity
  const moveToSanity = useCallback(async () => {
    if (!article || loadingStates.movingToSanity) return;

    setModalState((prev) => ({ ...prev, sanity: false }));
    setLoadingStates((prev) => ({ ...prev, movingToSanity: true }));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updatedArticle: Partial<ArticleDto> = {
      status: "moved",
    };
    originalDataRef.current = { ...originalDataRef.current, ...updatedArticle };

    setArticle((prev) =>
      prev
        ? {
            ...prev,
            ...updatedArticle,
            isDirty: false,
          }
        : null
    );

    toast.success("Artykuł został przeniesiony do Sanity CMS");

    setLoadingStates((prev) => ({ ...prev, movingToSanity: false }));
  }, [article, loadingStates.movingToSanity]);

  // Pobierz dane przy montowaniu
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Cleanup timeoutu przy unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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
    refetch: fetchInitialData,
    modalState,
    setModalState,
  };
};
