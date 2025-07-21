import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProfileDto, UpdateProfileCommand } from "../../types";
import { UpdateProfileRequestSchema } from "../../lib/schemas/profile.schemas";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GenerationSettingsFormProps {
  initialData: ProfileDto;
  isSubmitting?: boolean;
  onSave: (data: UpdateProfileCommand) => Promise<void>;
}

type FormData = z.infer<typeof UpdateProfileRequestSchema>;

export const GenerationSettingsForm: React.FC<GenerationSettingsFormProps> = ({
  initialData,
  isSubmitting = false,
  onSave,
}) => {
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateProfileRequestSchema),
    defaultValues: {
      default_topics_count: initialData.default_topics_count,
      default_subtopics_count: initialData.default_subtopics_count,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setIsLocalSubmitting(true);
      await onSave(data);
    } catch (error) {
      console.error("Error saving profile:", error);
      // Toast jest obsługiwany w hooku useOptionsData
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const isFormSubmitting = isSubmitting || isLocalSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="default_topics_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domyślna liczba tematów</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  disabled={isFormSubmitting}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Ile tematów ma być generowanych domyślnie (1-10)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_subtopics_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domyślna liczba podtematów</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  disabled={isFormSubmitting}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Ile podtematów ma być generowanych domyślnie (1-10)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isFormSubmitting || !form.formState.isValid}
          className="w-full bg-gradient-to-r from-primary/80 to-primary/90 border-2 border-neutral-600/30 text-white hover:from-primary/90 hover:to-primary hover:border-neutral-500/40 hover:brightness-105 focus-visible:from-primary/90 focus-visible:to-primary focus-visible:border-neutral-500/40 focus-visible:brightness-105 transition-all duration-200 py-3.5 rounded-lg font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            {isFormSubmitting && (
              <div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
            )}
            {isFormSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
          </span>
        </Button>
      </form>
    </Form>
  );
};
