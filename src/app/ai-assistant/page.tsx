"use client";

import { useState } from "react";
import {
  whatsappAssistant,
  type WhatsAppAssistantOutput,
} from "@/ai/flows/whatsapp-assistant";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function AiAssistantPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WhatsAppAssistantOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const output = await whatsappAssistant({ query });
      setResult(output);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Bot /> AI WhatsApp Assistant Tool
              </CardTitle>
              <CardDescription>
                Test the AI assistant that helps patients with their questions,
                recommends specialists, and manages bookings via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="query" className="font-medium">
                    Patient's Query
                  </label>
                  <Textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'I have chest pain, who should I see?' or 'I need to confirm my appointment for tomorrow.'"
                    rows={4}
                    disabled={isLoading}
                    className="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting response...
                    </>
                  ) : (
                    "Ask Assistant"
                  )}
                </Button>
              </form>

              {result && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-bold text-lg">Assistant's Response:</h3>
                  <div className="p-4 bg-muted rounded-lg flex gap-4 items-start">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-foreground/80 leading-relaxed">
                      {result.response}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
