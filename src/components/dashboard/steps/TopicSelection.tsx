import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopicGenerationContext } from "../../../contexts/TopicGenerationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormError } from "../../shared/FormError";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CreateTopicClusterCommand, TopicClusterDto } from "../../../types";
import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";
import { LoadingSpinner } from "../../shared/LoadingSpinner";
import { ArrowRight } from "lucide-react";

interface TopicSelectionProps {
  existingClusters: TopicClusterDto[];
  isLoadingClusters: boolean;
  clustersError: string | null;
}

// Placeholder components, to be extracted into their own files later

const AiSuggestionTiles: React.FC = () => {
  const context = useContext(TopicGenerationContext);
  if (!context) throw new Error("Context not found");

  const { state, actions } = context;

  useEffect(() => {
    if (state.step === "topic_selection_ai" && state.suggestions.length === 0) {
      actions.fetchSuggestions();
    }
  }, [state.step, state.suggestions.length, actions]);

  if (state.isLoading) return <LoadingSpinner label="Pobieranie sugestii AI..." />;
  if (state.error) return <div className="text-destructive text-center p-8">{state.error}</div>;

  return (
    <ScrollArea className="h-[50vh] pr-4 -mr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.suggestions.map((suggestion: string) => (
          <div
            key={suggestion}
            onClick={() => actions.selectTopic(suggestion)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") actions.selectTopic(suggestion);
            }}
            className="group relative p-6 rounded-xl cursor-pointer transition-colors duration-300 ease-in-out overflow-hidden
                       bg-neutral-200 
                       border border-neutral-500
                       hover:border-primary/70
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary 
                       focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <div className="relative flex items-center justify-center w-full h-full">
              <ArrowRight className="absolute left-0 h-5 w-5 text-neutral-700 opacity-0 -translate-x-full transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-6" />
              <p className="font-semibold text-center text-neutral-800 transition-transform duration-300 ease-in-out group-hover:translate-x-4">
                {suggestion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const topicManualSchema = z.object({
  name: z.string().min(3, "Nazwa tematu musi mieć co najmniej 3 znaki."),
});

const TopicManualForm: React.FC = () => {
  const context = useContext(TopicGenerationContext);
  if (!context) throw new Error("Context not found");

  const { actions } = context;

  const form = useForm<z.infer<typeof topicManualSchema>>({
    resolver: zodResolver(topicManualSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const {
    setError,
    formState: { isSubmitting, isValid },
  } = form;

  const onSubmit = async (values: z.infer<typeof topicManualSchema>) => {
    try {
      await actions.setTopicName(values.name);
    } catch (error) {
      setError("root", {
        type: "manual",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.",
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Nazwa tematu</FormLabel>
                <FormControl>
                  <Input placeholder="Np. Marketing w social media dla e-commerce" {...field} className="h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={form.formState.errors.root?.message} />
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isValid}
            className="w-full h-14 text-lg font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Tworzenie...</span>
              </div>
            ) : (
              "Stwórz temat i przejdź dalej"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

const ExistingClusterList: React.FC<TopicSelectionProps> = ({ existingClusters, isLoadingClusters, clustersError }) => {
  const context = useContext(TopicGenerationContext);
  if (!context) throw new Error("Context not found");

  const { actions } = context;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClusters = existingClusters.filter((cluster) =>
    cluster.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingClusters) return <LoadingSpinner label="Ładowanie klastrów..." />;
  if (clustersError) return <div className="text-destructive text-center p-8">{clustersError}</div>;

  return (
    <div className="flex flex-col h-full min-h-0">
      <Input
        placeholder="Wyszukaj klaster..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ScrollArea className="flex-grow pr-4 -mr-4 overflow-y-auto">
        <div className="space-y-3">
          {filteredClusters.length > 0 ? (
            filteredClusters.map((cluster) => (
              <Card
                key={cluster.id}
                role="button"
                tabIndex={0}
                onClick={() => actions.setTopicCluster(cluster)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    actions.setTopicCluster(cluster);
                  }
                }}
                className="group p-4 rounded-lg cursor-pointer transition-all duration-300 bg-neutral-800/50 border border-neutral-700/50 hover:border-primary/30 hover:bg-neutral-800   flex items-center gap-4"
              >
                <FolderOpen className="w-6 h-6 text-primary/70 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium">{cluster.name}</span>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4 border border-dashed border-neutral-700 rounded-lg">
              <FolderOpen className="w-12 h-12 text-neutral-600" />
              <p className="max-w-xs">
                Nie znaleziono pasujących klastrów. Spróbuj zmienić frazę lub stwórz nowy temat.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const TopicSelection: React.FC<TopicSelectionProps> = (props) => {
  const context = useContext(TopicGenerationContext);
  if (!context) {
    throw new Error("TopicSelection must be used within a TopicGenerationContext.Provider");
  }

  const { state } = context;

  switch (state.step) {
    case "topic_selection_ai":
      return <AiSuggestionTiles />;
    case "topic_selection_manual":
      return <TopicManualForm />;
    case "topic_selection_existing":
      return <ExistingClusterList {...props} />;
    default:
      return null;
  }
};
