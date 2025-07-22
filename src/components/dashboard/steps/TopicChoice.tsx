import React, { useContext } from "react";
import { BrainCircuit, PenSquare } from "lucide-react";
import { TopicGenerationContext } from "../../../contexts/TopicGenerationContext";
import type { WizardStep } from "../../hooks/useTopicGeneration";

interface Choice {
  id: WizardStep;
  icon: React.ElementType;
  title: string;
  description: string;
}

const choices: Choice[] = [
  {
    id: "topic_selection_ai",
    icon: BrainCircuit,
    title: "Sugestie AI",
    description: "Wygeneruj listę propozycji tematów na podstawie Twoich preferencji.",
  },
  {
    id: "topic_selection_manual",
    icon: PenSquare,
    title: "Wpisz ręcznie",
    description: "Wprowadź własny, dowolny temat główny.",
  },
];

export const TopicChoice: React.FC = () => {
  const context = useContext(TopicGenerationContext);

  if (!context) {
    throw new Error("TopicChoice must be used within a TopicGenerationContext.Provider");
  }

  const { actions } = context;

  return (
    <div className="flex flex-col gap-4 mx-auto p-4">
      {choices.map((choice) => (
        <div
          key={choice.id}
          role="button"
          tabIndex={0}
          onClick={() => actions.goToStep(choice.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") actions.goToStep(choice.id);
          }}
          className="flex items-start gap-6 p-6 rounded-xl transition-colors duration-150 bg-neutral-800/50 border-2 border-neutral-700/50 hover:border-primary/40 hover:bg-neutral-700/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 cursor-pointer"
        >
          <div className="bg-primary/10 p-3 rounded-full">
            <choice.icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{choice.title}</h3>
            <p className="text-neutral-400 mt-1">{choice.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
