import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type {
  AiPreferenceDto,
  CustomAuditDto,
  CreateAiPreferenceCommand,
  UpdateAiPreferenceCommand,
  CreateCustomAuditCommand,
  UpdateCustomAuditCommand,
} from "../../types";

// Generyczny typ dla elementów
type ItemType = AiPreferenceDto | CustomAuditDto;

// Schema walidacji dla formularza
const FormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tytuł jest wymagany")
    .min(3, "Tytuł musi mieć co najmniej 3 znaki")
    .max(255, "Tytuł nie może przekraczać 255 znaków"),
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt jest wymagany")
    .min(10, "Prompt musi mieć co najmniej 10 znaków")
    .max(5000, "Prompt nie może przekraczać 5000 znaków"),
});

type FormData = z.infer<typeof FormSchema>;

interface CrudFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  type: "aiPreference" | "customAudit" | null;
  item: ItemType | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (
    data: CreateAiPreferenceCommand | UpdateAiPreferenceCommand | CreateCustomAuditCommand | UpdateCustomAuditCommand
  ) => Promise<void>;
}

export const CrudFormModal: React.FC<CrudFormModalProps> = ({
  isOpen,
  mode,
  type,
  item,
  isSubmitting = false,
  onClose,
  onSave,
}) => {
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      prompt: "",
    },
  });

  // Reset formularza i wypełnienie danymi przy edycji
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && item) {
        form.reset({
          title: item.title,
          prompt: item.prompt,
        });
      } else {
        form.reset({
          title: "",
          prompt: "",
        });
      }
    }
  }, [isOpen, mode, item, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsLocalSubmitting(true);
      await onSave(data);
      form.reset();
    } catch (error) {
      console.error("Error saving item:", error);
      // Toast jest obsługiwany w hooku useOptionsData
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getTitle = () => {
    if (!type) return "";

    const typeNames = {
      aiPreference: "preferencję AI",
      customAudit: "niestandardowy audyt",
    };

    return mode === "create" ? `Dodaj ${typeNames[type]}` : `Edytuj ${typeNames[type]}`;
  };

  const getDescription = () => {
    if (!type) return "";

    if (type === "aiPreference") {
      return mode === "create"
        ? "Utwórz nową preferencję stylu AI, która będzie używana podczas generowania treści."
        : "Edytuj istniejącą preferencję stylu AI.";
    }

    return mode === "create"
      ? "Utwórz nowy niestandardowy audyt do analizy treści."
      : "Edytuj istniejący niestandardowy audyt.";
  };

  const isFormSubmitting = isSubmitting || isLocalSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] bg-neutral-800/95 backdrop-blur-md border-2 border-neutral-700/50 rounded-2xl shadow-2xl">
        {/* Subtle accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-60"></div>

        <DialogHeader className="space-y-4 pb-2">
          <DialogTitle className="text-2xl font-bold text-white bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-base leading-relaxed">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium text-neutral-200">Tytuł</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wprowadź tytuł..."
                      disabled={isFormSubmitting}
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500/75" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium text-neutral-200">Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wprowadź szczegółowy prompt..."
                      className="min-h-[160px] resize-none text-base leading-relaxed"
                      disabled={isFormSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500/75" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-8 border-t border-neutral-700/30">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isFormSubmitting}
                className="px-8 py-3 h-auto border-2 border-neutral-600/50 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/60 hover:border-neutral-500/60 focus-visible:bg-neutral-700/60 focus-visible:border-neutral-500/60 transition-all duration-300 ease-custom rounded-xl font-medium"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isFormSubmitting || !form.formState.isValid}
                className="px-8 py-3 h-auto bg-neutral-600 border-2 border-neutral-500/60 text-neutral-100 hover:bg-neutral-500 hover:border-neutral-400/70 hover:text-white focus-visible:bg-neutral-500 focus-visible:border-neutral-400/70 focus-visible:text-white transition-all duration-300 ease-custom rounded-xl font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {isFormSubmitting && (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  )}
                  {isFormSubmitting ? "Zapisywanie..." : "Zapisz"}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
