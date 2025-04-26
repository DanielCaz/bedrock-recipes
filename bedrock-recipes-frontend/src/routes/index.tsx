import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import useWebSocket from "react-use-websocket";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Markdown from "react-markdown";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

const formSchema = z.object({
  ingredients: z
    .string()
    .min(1, "Please enter at least one ingredient")
    .max(1000, "Please enter no more than 1000 characters"),
});

type FormSchema = z.infer<typeof formSchema>;

type Message = {
  message: string;
} & (
  | {
      type: "info" | "recipe";
    }
  | {
      type: "image";
      image_url: string;
    }
);

function RouteComponent() {
  const [recipe, setRecipe] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { sendMessage } = useWebSocket(import.meta.env.VITE_WS_ENDPOINT, {
    onMessage: (message) => {
      const data: Message = JSON.parse(message.data);

      if (data.type === "recipe") {
        setRecipe((prev) => (prev ? prev + data.message : data.message));
      } else if (data.type === "image" && data.image_url) {
        setImageUrl(data.image_url);
      }
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
    },
  });

  const onSubmit = (values: FormSchema) => {
    const ingredients = values.ingredients
      .split("\n")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    sendMessage(JSON.stringify({ action: "message", ingredients }));

    setRecipe("");
    setImageUrl(null);
  };

  return (
    <main className="grid place-content-center gap-8 p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Generate a recipe
          </CardTitle>
          <CardDescription className="text-lg">
            Enter the ingredients you have, and we will generate a recipe for
            you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the ingredients for your recipe (one per line).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
          {recipe ? (
            <div className="flex flex-col items-start justify-around gap-8 md:flex-row">
              <Card className="w-full">
                <CardContent>
                  <Markdown
                    components={{
                      h1: ({ children, ...props }) => (
                        <h1 className="text-xl font-bold" {...props}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }) => (
                        <h2 className="text-lg font-semibold" {...props}>
                          {children}
                        </h2>
                      ),
                      ul: ({ children, ...props }) => (
                        <ul className="list-inside list-disc" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="list-inside list-decimal" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }) => (
                        <li className="ml-4" {...props}>
                          {children}
                        </li>
                      ),
                      p: ({ children, ...props }) => (
                        <p className="mt-2" {...props}>
                          {children}
                        </p>
                      ),
                    }}
                  >
                    {recipe}
                  </Markdown>
                </CardContent>
              </Card>
              <Card className="w-full">
                <CardContent>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Generated Recipe"
                      className="h-auto w-full rounded-2xl"
                    />
                  ) : (
                    <p>Loading...</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
