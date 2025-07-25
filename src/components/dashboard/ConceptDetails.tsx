import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ArticleStubDto, UpdateArticleCommand } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { AlertTriangle, RefreshCw, Trash2, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const conceptDetailsSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany."),
  name: z.string().min(1, "Nazwa robocza jest wymagana."),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional(),
});

type ConceptDetailsFormData = z.infer<typeof conceptDetailsSchema>;

interface ConceptDetailsProps {
  article: ArticleStubDto | null;
  isLoading: boolean;
  isUpdating: boolean;
  onRetry: () => void;
  onUpdate: (data: UpdateArticleCommand) => void;
  onDelete: () => void;
  onRegenerate: (name: string) => void;
  error: string | null;
}

const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-neutral-700/50 animate-pulse rounded-md ${className}`} />
);

export const ConceptDetails: React.FC<ConceptDetailsProps> = ({
  article,
  isLoading,
  isUpdating,
  onRetry,
  onUpdate,
  onDelete,
  onRegenerate,
  error,
}) => {
  const form = useForm<ConceptDetailsFormData>({
    resolver: zodResolver(conceptDetailsSchema),
    defaultValues: {
      title: "",
      name: "",
      description: "",
      seo_title: "",
      seo_description: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title ?? "",
        name: article.name ?? "",
        description: article.description ?? "",
        seo_title: article.seo_title ?? "",
        seo_description: article.seo_description ?? "",
        slug: article.slug ?? "",
      });
    }
  }, [article, form.reset]);

  const handleBlur = () => {
    if (form.formState.isDirty) {
      onUpdate(form.getValues());
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-neutral-800/50 rounded-2xl">
        <CardHeader className="p-0 pb-4">
          <SkeletonLoader className="h-8 w-3/4 mb-2" />
          <SkeletonLoader className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <SkeletonLoader className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonLoader className="h-12 w-full" />
            <SkeletonLoader className="h-12 w-full" />
          </div>
          <SkeletonLoader className="h-12 w-full" />
        </CardContent>
        <CardFooter className="p-0 pt-6">
          <SkeletonLoader className="h-12 w-1/3 ml-auto" />
        </CardFooter>
      </Card>
    );
  }

  if (error && !article) {
    return (
      <div className="p-8 bg-destructive/5 border border-destructive/30 rounded-2xl text-center flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-destructive/80 mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Wystąpił błąd</h3>
        <p className="text-destructive/70 mb-6 max-w-sm">{error}</p>
        <Button onClick={onRetry} variant="secondary" className="group bg-destructive/10 hover:bg-destructive/20">
          <RefreshCw className="w-4 h-4 mr-2 transition-transform duration-500 ease-in-out group-hover:rotate-180" />
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 bg-neutral-800/50 rounded-2xl text-center">
        <p className="text-neutral-400">Wybierz podtemat z listy, aby zobaczyć szczegóły.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="h-full">
        <Card className="h-full flex flex-col border border-neutral-700/50 bg-neutral-800/50 rounded-2xl">
          <CardHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Nazwa robocza</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={handleBlur}
                      placeholder="Wewnętrzna nazwa dla listy"
                      className="text-lg font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardHeader>
          <CardContent className="flex-grow">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2 border-b border-neutral-700/60 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="content"
                  className="cursor-pointer rounded-none bg-transparent p-2 transition-all duration-200 text-neutral-400 hover:text-white hover:-translate-y-px data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  Treść
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className="cursor-pointer rounded-none bg-transparent p-2 transition-all duration-200 text-neutral-400 hover:text-white hover:-translate-y-px data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  SEO
                </TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="space-y-4 pt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł</FormLabel>
                      <FormControl>
                        <Input {...field} onBlur={handleBlur} placeholder="Główny tytuł artykułu" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis</FormLabel>
                      <FormControl>
                        <Textarea {...field} onBlur={handleBlur} placeholder="Krótki opis konceptu..." rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="seo" className="space-y-4 pt-6">
                <FormField
                  control={form.control}
                  name="seo_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł SEO</FormLabel>
                      <FormControl>
                        <Input {...field} onBlur={handleBlur} placeholder="Tytuł dla wyszukiwarek..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis SEO</FormLabel>
                      <FormControl>
                        <Textarea {...field} onBlur={handleBlur} placeholder="Opis dla wyszukiwarek..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} onBlur={handleBlur} placeholder="przyjazny-url-artykulu" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between items-center pt-6 border-t border-neutral-700/50">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="p-2.5 h-10 w-10 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:text-red-400 focus-visible:bg-red-500/10 transition-all duration-200 rounded-lg border border-neutral-700/30"
                title="Usuń"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onRegenerate(form.getValues().name)}
                disabled={isUpdating}
                className="group cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_theme(colors.primary/0.3)] hover:border-primary/80"
              >
                <Sparkles className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                {isUpdating ? "Generowanie..." : "Nowy koncept z AI"}
              </Button>
            </div>
            <Button asChild variant="primary" size="lg" className="group">
              <a href={`/articles/${article.id}`}>
                Przejdź do edytora
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
