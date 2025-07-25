import React, { useContext, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopicGenerationContext } from "../../../contexts/TopicGenerationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Sparkles, LoaderCircle } from "lucide-react";
import type { TopicClusterDto } from "../../../types";
import { toast } from "sonner";
import { LoadingSpinner } from "../../shared/LoadingSpinner";

const subtopicManagementSchema = z.object({
  subtopics: z.array(
    z.object({
      value: z.string().min(1, "Podtemat nie może być pusty."),
    })
  ),
  newSubtopic: z.string().optional(),
});

interface SubtopicManagementProps {
  onComplete: (subtopics: string[], cluster: TopicClusterDto) => void;
}

export const SubtopicManagement: React.FC<SubtopicManagementProps> = ({ onComplete }) => {
  const context = useContext(TopicGenerationContext);
  if (!context) throw new Error("Context not found");
  const { state, actions } = context;
  const [isCreatingCluster, setIsCreatingCluster] = useState(false);

  const form = useForm<z.infer<typeof subtopicManagementSchema>>({
    resolver: zodResolver(subtopicManagementSchema),
    defaultValues: {
      subtopics: state.subtopics.map((value: string) => ({ value })),
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtopics",
  });

  const { register, handleSubmit, resetField, reset } = form;

  // This effect synchronizes the form state with the context state
  useEffect(() => {
    reset({
      subtopics: state.subtopics.map((value) => ({ value })),
    });
  }, [state.subtopics, reset]);

  const handleAddSubtopic = (data: { newSubtopic?: string }) => {
    if (data.newSubtopic && data.newSubtopic.trim() !== "") {
      const topicValue = data.newSubtopic.trim();
      if (state.subtopics.includes(topicValue)) {
        toast.warning(`Podtemat "${topicValue}" już istnieje na liście.`);
        return;
      }
      const updatedSubtopics = [...state.subtopics, topicValue];
      actions.setSubtopics(updatedSubtopics); // Update context, form will sync via useEffect
      resetField("newSubtopic");
      toast.success(`Dodano podtemat: "${topicValue}"`);
    }
  };

  const handleRemoveSubtopic = (index: number) => {
    const topicValue = fields[index].value;
    const updatedSubtopics = state.subtopics.filter((_, i) => i !== index);
    actions.setSubtopics(updatedSubtopics); // Update context, form will sync via useEffect
    toast.info(`Usunięto podtemat: "${topicValue}"`);
  };

  const handleFormSubmit = async (_data: z.infer<typeof subtopicManagementSchema>) => {
    setIsCreatingCluster(true);
    // Use the state from the context as the single source of truth,
    // ignoring the form data which might not be perfectly in sync.
    const finalSubtopics = state.subtopics;
    const clusterName = state.selectedTopicName;

    if (!clusterName) {
      toast.error("Brak nazwy tematu. Nie można utworzyć klastra.");
      setIsCreatingCluster(false);
      return;
    }

    try {
      // If we are working on an existing cluster, no need to create it again.
      if (state.selectedTopicCluster?.id) {
        onComplete(finalSubtopics, state.selectedTopicCluster);
        return;
      }

      const response = await fetch("/api/topic-clusters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clusterName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nie udało się utworzyć klastra tematycznego.");
      }

      const newCluster: TopicClusterDto = await response.json();
      toast.success(`Utworzono klaster: "${newCluster.name}"`);
      onComplete(finalSubtopics, newCluster);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsCreatingCluster(false);
    }
  };

  const shouldShowRegenerateButton = fields.length < state.defaultSubtopicsCount;

  return (
    <div className="flex flex-col h-full">
      {state.isLoading && (
        <LoadingSpinner
          label="Pobieranie podtematów..."
          className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm z-10"
        />
      )}
      {state.error && <p className="text-destructive text-center p-4">{state.error}</p>}

      <Form {...form}>
        <ScrollArea className="flex-grow pr-4 -mr-4 custom-scrollbar overflow-y-auto">
          <Card className="bg-transparent border-none shadow-none">
            <CardContent className="p-1 [&>*:first-child]:-mt-6">
              <ul className="space-y-2">
                {fields.map((field, index) => (
                  <li key={field.id} className="flex items-center gap-2">
                    <Input
                      {...register(`subtopics.${index}.value`)}
                      className="flex-grow h-11 bg-neutral-800 border-neutral-700 focus-visible:bg-neutral-700/60"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubtopic(index)}
                      className="p-2.5 h-9 w-9 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:text-red-400 focus-visible:bg-red-500/10 transition-all duration-200 rounded-lg border border-neutral-700/30"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollArea>

        <div className="mt-auto pt-6 border-t border-neutral-700/50">
          <div className="flex items-center gap-2 mb-6">
            <Input
              {...register("newSubtopic")}
              placeholder="Dodaj nowy podtemat..."
              className="flex-grow h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(() => handleAddSubtopic({ newSubtopic: form.getValues("newSubtopic") }))();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleSubmit(() => handleAddSubtopic({ newSubtopic: form.getValues("newSubtopic") }))}
              variant="secondary"
              className="h-12"
            >
              Dodaj
            </Button>
          </div>

          <div className="flex justify-between items-center">
            {shouldShowRegenerateButton ? (
              <Button
                type="button"
                variant="outline"
                onClick={actions.regenerateSubtopics}
                disabled={state.isLoading}
                className="h-12 border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-solid group"
              >
                <Sparkles className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                Uzupełnij z AI
              </Button>
            ) : (
              <div></div>
            )}

            <Button
              onClick={form.handleSubmit(handleFormSubmit)}
              disabled={state.isLoading || isCreatingCluster || fields.length === 0}
              variant="primary"
              className="h-12 text-base"
            >
              {isCreatingCluster ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Tworzenie klastra...
                </>
              ) : (
                "Zatwierdź i generuj koncepty"
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};
