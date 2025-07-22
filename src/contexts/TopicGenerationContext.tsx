import { createContext } from "react";
import type { TopicGenerationState, TopicGenerationActions } from "../components/hooks/useTopicGeneration";

export interface TopicGenerationContextType {
  state: TopicGenerationState;
  actions: TopicGenerationActions;
}

export const TopicGenerationContext = createContext<TopicGenerationContextType | undefined>(undefined);
