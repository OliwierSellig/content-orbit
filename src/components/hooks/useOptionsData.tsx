import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  ProfileDto,
  AiPreferenceDto,
  CustomAuditDto,
  UpdateProfileCommand,
  CreateAiPreferenceCommand,
  UpdateAiPreferenceCommand,
  CreateCustomAuditCommand,
  UpdateCustomAuditCommand,
} from "../../types";

// Stan widoku opcji
interface OptionsViewState {
  profile: ProfileDto | null;
  aiPreferences: AiPreferenceDto[];
  customAudits: CustomAuditDto[];
  isLoading: boolean;
  error: Error | null;
}

// Stan modala
type ModalState<T> = {
  isOpen: boolean;
  mode: "create" | "edit";
  type: "aiPreference" | "customAudit" | null;
  data: T | null;
};

// Loading states dla operacji
interface LoadingStates {
  profileUpdate: boolean;
  itemCreate: boolean;
  itemUpdate: string | null; // ID elementu który jest aktualizowany
  itemDelete: string | null; // ID elementu który jest usuwany
}

type ItemType = AiPreferenceDto | CustomAuditDto;

// Custom hook do zarządzania danymi widoku Options
export const useOptionsData = () => {
  const [state, setState] = useState<OptionsViewState>({
    profile: null,
    aiPreferences: [],
    customAudits: [],
    isLoading: true,
    error: null,
  });

  const [modalState, setModalState] = useState<ModalState<ItemType>>({
    isOpen: false,
    mode: "create",
    type: null,
    data: null,
  });

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    profileUpdate: false,
    itemCreate: false,
    itemUpdate: null,
    itemDelete: null,
  });

  // Funkcja do pobierania wszystkich danych
  const fetchAllData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [profileResponse, aiPreferencesResponse, customAuditsResponse] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/ai-preferences"),
        fetch("/api/custom-audits"),
      ]);

      // Sprawdź czy wszystkie requesty są successful
      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }
      if (!aiPreferencesResponse.ok) {
        throw new Error(`Failed to fetch AI preferences: ${aiPreferencesResponse.status}`);
      }
      if (!customAuditsResponse.ok) {
        throw new Error(`Failed to fetch custom audits: ${customAuditsResponse.status}`);
      }

      const [profile, aiPreferences, customAudits] = await Promise.all([
        profileResponse.json(),
        aiPreferencesResponse.json(),
        customAuditsResponse.json(),
      ]);

      setState({
        profile,
        aiPreferences: aiPreferences || [],
        customAudits: customAudits || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching options data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Unknown error occurred"),
      }));
      toast.error("Błąd podczas ładowania danych");
    }
  }, []);

  // Inicjalne ładowanie danych
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Aktualizacja profilu
  const updateProfile = useCallback(
    async (data: UpdateProfileCommand) => {
      if (!state.profile) return;

      const previousProfile = state.profile;

      try {
        setLoadingStates((prev) => ({ ...prev, profileUpdate: true }));

        // Optimistic UI - aktualizuj stan od razu
        setState((prev) => ({
          ...prev,
          profile: { ...prev.profile!, ...data },
        }));

        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to update profile: ${response.status}`);
        }

        const updatedProfile = await response.json();

        setState((prev) => ({
          ...prev,
          profile: updatedProfile,
        }));

        toast.success("Ustawienia zostały zaktualizowane");
      } catch (error) {
        console.error("Error updating profile:", error);

        // Przywróć poprzedni stan w przypadku błędu
        setState((prev) => ({
          ...prev,
          profile: previousProfile,
        }));

        toast.error(error instanceof Error ? error.message : "Błąd podczas aktualizacji ustawień");
        throw error;
      } finally {
        setLoadingStates((prev) => ({ ...prev, profileUpdate: false }));
      }
    },
    [state.profile]
  );

  // Tworzenie elementu (AI preference lub custom audit)
  const createItem = useCallback(
    async (type: "aiPreference" | "customAudit", data: CreateAiPreferenceCommand | CreateCustomAuditCommand) => {
      try {
        setLoadingStates((prev) => ({ ...prev, itemCreate: true }));

        const endpoint = type === "aiPreference" ? "/api/ai-preferences" : "/api/custom-audits";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to create ${type}: ${response.status}`);
        }

        const newItem = await response.json();

        // Optimistic UI - dodaj nowy element do listy
        setState((prev) => ({
          ...prev,
          [type === "aiPreference" ? "aiPreferences" : "customAudits"]: [
            newItem,
            ...prev[type === "aiPreference" ? "aiPreferences" : "customAudits"],
          ],
        }));

        const itemName = type === "aiPreference" ? "Preferencja AI" : "Niestandardowy audyt";
        const successMessage = type === "aiPreference" ? `${itemName} została dodana` : `${itemName} został dodany`;
        toast.success(successMessage);

        return newItem;
      } catch (error) {
        console.error(`Error creating ${type}:`, error);
        toast.error(
          error instanceof Error
            ? error.message
            : `Błąd podczas tworzenia ${type === "aiPreference" ? "preferencji" : "audytu"}`
        );
        throw error;
      } finally {
        setLoadingStates((prev) => ({ ...prev, itemCreate: false }));
      }
    },
    []
  );

  // Aktualizacja elementu
  const updateItem = useCallback(
    async (
      type: "aiPreference" | "customAudit",
      id: string,
      data: UpdateAiPreferenceCommand | UpdateCustomAuditCommand
    ) => {
      const arrayKey = type === "aiPreference" ? "aiPreferences" : "customAudits";
      const previousItems = state[arrayKey];
      const itemIndex = previousItems.findIndex((item) => item.id === id);

      if (itemIndex === -1) return;

      const previousItem = previousItems[itemIndex];

      try {
        setLoadingStates((prev) => ({ ...prev, itemUpdate: id }));

        // Optimistic UI - aktualizuj element od razu
        const updatedItems = [...previousItems];
        updatedItems[itemIndex] = { ...previousItem, ...data };

        setState((prev) => ({
          ...prev,
          [arrayKey]: updatedItems,
        }));

        const endpoint = type === "aiPreference" ? `/api/ai-preferences/${id}` : `/api/custom-audits/${id}`;

        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to update ${type}: ${response.status}`);
        }

        const updatedItem = await response.json();

        // Zaktualizuj rzeczywistymi danymi z serwera
        const finalItems = [...previousItems];
        finalItems[itemIndex] = updatedItem;

        setState((prev) => ({
          ...prev,
          [arrayKey]: finalItems,
        }));

        const itemName = type === "aiPreference" ? "Preferencja AI" : "Niestandardowy audyt";
        const successMessage =
          type === "aiPreference" ? `${itemName} została zaktualizowana` : `${itemName} został zaktualizowany`;
        toast.success(successMessage);
      } catch (error) {
        console.error(`Error updating ${type}:`, error);

        // Przywróć poprzedni stan w przypadku błędu
        setState((prev) => ({
          ...prev,
          [arrayKey]: previousItems,
        }));

        toast.error(
          error instanceof Error
            ? error.message
            : `Błąd podczas aktualizacji ${type === "aiPreference" ? "preferencji" : "audytu"}`
        );
        throw error;
      } finally {
        setLoadingStates((prev) => ({ ...prev, itemUpdate: null }));
      }
    },
    [state.aiPreferences, state.customAudits]
  );

  // Usuwanie elementu
  const deleteItem = useCallback(
    async (type: "aiPreference" | "customAudit", id: string) => {
      const arrayKey = type === "aiPreference" ? "aiPreferences" : "customAudits";
      const previousItems = state[arrayKey];

      try {
        setLoadingStates((prev) => ({ ...prev, itemDelete: id }));

        // Optimistic UI - usuń element od razu
        const filteredItems = previousItems.filter((item) => item.id !== id);

        setState((prev) => ({
          ...prev,
          [arrayKey]: filteredItems,
        }));

        const endpoint = type === "aiPreference" ? `/api/ai-preferences/${id}` : `/api/custom-audits/${id}`;

        const response = await fetch(endpoint, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to delete ${type}: ${response.status}`);
        }

        const itemName = type === "aiPreference" ? "Preferencja AI" : "Niestandardowy audyt";
        const successMessage = type === "aiPreference" ? `${itemName} została usunięta` : `${itemName} został usunięty`;
        toast.success(successMessage);
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);

        // Przywróć poprzedni stan w przypadku błędu
        setState((prev) => ({
          ...prev,
          [arrayKey]: previousItems,
        }));

        toast.error(
          error instanceof Error
            ? error.message
            : `Błąd podczas usuwania ${type === "aiPreference" ? "preferencji" : "audytu"}`
        );
        throw error;
      } finally {
        setLoadingStates((prev) => ({ ...prev, itemDelete: null }));
      }
    },
    [state.aiPreferences, state.customAudits]
  );

  // Funkcje zarządzania modalem
  const openCreateModal = useCallback((type: "aiPreference" | "customAudit") => {
    setModalState({
      isOpen: true,
      mode: "create",
      type,
      data: null,
    });
  }, []);

  const openEditModal = useCallback((type: "aiPreference" | "customAudit", item: ItemType) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      type,
      data: item,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: "create",
      type: null,
      data: null,
    });
  }, []);

  return {
    // Stan
    ...state,
    modalState,
    loadingStates,

    // Akcje
    updateProfile,
    createItem,
    updateItem,
    deleteItem,

    // Modal
    openCreateModal,
    openEditModal,
    closeModal,

    // Utilities
    refetch: fetchAllData,
  };
};
