import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { TopicClusterDto, TopicClusterSuggestionsDto, ProfileDto } from "../../types";

export type WizardStep =
  | "topic_choice"
  | "topic_selection_ai"
  | "topic_selection_manual"
  | "topic_selection_existing"
  | "subtopic_management";

export interface TopicGenerationState {
  step: WizardStep;
  selectedTopicName: string | null;
  selectedTopicCluster: TopicClusterDto | null;
  subtopics: string[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  defaultSubtopicsCount: number;
}

export interface TopicGenerationActions {
  goToStep: (step: WizardStep) => void;
  selectTopic: (topicName: string) => Promise<void>;
  setTopicName: (topicName: string) => Promise<void>;
  setTopicCluster: (cluster: TopicClusterDto) => Promise<void>;
  setSubtopics: (subtopics: string[]) => void;
  fetchSuggestions: () => Promise<void>;
  regenerateSubtopics: () => Promise<void>;
  reset: () => void;
}

type UseTopicGenerationProps = {
  initialMode: "new" | "existing";
};

export const useTopicGeneration = ({ initialMode }: UseTopicGenerationProps) => {
  const [profile, setProfile] = useState<ProfileDto | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Nie udało się pobrać profilu użytkownika.");
        }
        const data: ProfileDto = await response.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
        // Ustawienie domyślnej wartości w razie błędu
        // setState(prev => ({ ...prev, error: error instanceof Error ? error.message : String(error) })); // This line was removed from the new_code, so it's removed here.
      }
    };
    fetchProfile();
  }, []);

  const initialState = useMemo(
    (): TopicGenerationState => ({
      step: initialMode === "existing" ? "topic_selection_existing" : "topic_choice",
      selectedTopicName: null,
      selectedTopicCluster: null,
      subtopics: [],
      suggestions: [],
      isLoading: false,
      error: null,
      defaultSubtopicsCount: profile?.default_subtopics_count || 10, // Domyślnie 10
    }),
    [initialMode, profile]
  );

  const [state, setState] = useState<TopicGenerationState>(initialState);

  // This effect hook ensures that the `defaultSubtopicsCount` in the state
  // is updated once the user's profile data is fetched.
  useEffect(() => {
    if (profile?.default_subtopics_count) {
      setState((prev) => ({ ...prev, defaultSubtopicsCount: profile.default_subtopics_count }));
    }
  }, [profile]);

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch("/api/topic-clusters/suggestions");
      if (!response.ok) throw new Error("Nie udało się pobrać sugestii.");
      const data: TopicClusterSuggestionsDto = await response.json();
      setState((prev) => ({ ...prev, suggestions: data.suggestions, isLoading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
        isLoading: false,
      }));
    }
  }, []);

  const fetchSubtopicSuggestions = useCallback(
    async (topicName: string) => {
      if (!topicName || topicName.trim() === "") {
        setState((prev) => ({ ...prev, error: "Topic name cannot be empty.", isLoading: false }));
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await fetch(`/api/topic-clusters/suggestions?topic_name=${encodeURIComponent(topicName)}`);
        if (!response.ok) throw new Error("Nie udało się pobrać sugestii podtematów.");
        const data: TopicClusterSuggestionsDto = await response.json();
        setState((prev) => ({ ...prev, subtopics: data.suggestions, isLoading: false }));
        goToStep("subtopic_management");
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : String(error),
          isLoading: false,
        }));
      }
    },
    [goToStep]
  );

  const selectTopic = useCallback(
    async (topicName: string) => {
      setState((prev) => ({ ...prev, selectedTopicName: topicName }));
      await fetchSubtopicSuggestions(topicName);
    },
    [fetchSubtopicSuggestions]
  );

  const setTopicName = useCallback(
    async (topicName: string) => {
      setState((prev) => ({ ...prev, selectedTopicName: topicName, selectedTopicCluster: null }));
      await fetchSubtopicSuggestions(topicName);
    },
    [fetchSubtopicSuggestions]
  );

  const setTopicCluster = useCallback(
    async (cluster: TopicClusterDto) => {
      setState((prev) => ({ ...prev, selectedTopicCluster: cluster, selectedTopicName: cluster.name }));
      await fetchSubtopicSuggestions(cluster.name);
    },
    [fetchSubtopicSuggestions]
  );

  const setSubtopics = useCallback((subtopics: string[]) => {
    setState((prev) => ({ ...prev, subtopics }));
  }, []);

  const regenerateSubtopics = useCallback(async () => {
    if (!state.selectedTopicName) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(
        `/api/topic-clusters/suggestions?topic_name=${encodeURIComponent(state.selectedTopicName)}`
      );
      if (!response.ok) throw new Error("Nie udało się pobrać nowych sugestii.");

      const data: TopicClusterSuggestionsDto = await response.json();
      const existingSubtopics = new Set(state.subtopics);
      const newUniqueSuggestions = data.suggestions.filter((s) => !existingSubtopics.has(s));

      const neededCount = state.defaultSubtopicsCount - state.subtopics.length;

      if (neededCount <= 0) {
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.info("Lista podtematów jest już pełna.");
        return;
      }

      const suggestionsToAdd = newUniqueSuggestions.slice(0, neededCount);

      if (suggestionsToAdd.length > 0) {
        setState((prev) => ({
          ...prev,
          subtopics: [...prev.subtopics, ...suggestionsToAdd],
          isLoading: false,
        }));
        toast.success(
          `Uzupełniono listę o ${suggestionsToAdd.length} ${suggestionsToAdd.length === 1 ? "sugestię" : "sugestii"}.`
        );
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        toast.info("Nie znaleziono więcej unikalnych sugestii.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      toast.error(errorMessage);
    }
  }, [state.selectedTopicName, state.subtopics, state.defaultSubtopicsCount]);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const actions = useMemo(
    () => ({
      goToStep,
      selectTopic,
      setTopicName,
      setTopicCluster,
      setSubtopics,
      fetchSuggestions,
      regenerateSubtopics,
      reset,
    }),
    [goToStep, selectTopic, setTopicName, setTopicCluster, setSubtopics, fetchSuggestions, regenerateSubtopics, reset]
  );

  return { state, actions };
};
