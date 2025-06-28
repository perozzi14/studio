
"use client";

import { useState } from "react";
import {
  whatsappAssistant,
  type WhatsAppAssistantOutput,
} from "@/ai/flows/whatsapp-assistant";
import { Header, BottomNav } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";
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
        title: "Ocurrió un Error",
        description:
          err instanceof Error ? err.message : "Ocurrió un error desconocido.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 md:pb-12 pb-20">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Bot /> Herramienta de Asistente IA de WhatsApp
              </CardTitle>
              <CardDescription>
                Prueba el asistente de IA que ayuda a los pacientes con sus preguntas,
                recomienda especialistas y gestiona reservas a través de WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="query" className="font-medium">
                    Consulta del Paciente
                  </label>
                  <Textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ej., 'Tengo dolor en el pecho, ¿a quién debo ver?' o 'Necesito confirmar mi cita para mañana.'"
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
                      Obteniendo respuesta...
                    </>
                  ) : (
                    "Preguntar al Asistente"
                  )}
                </Button>
              </form>

              {result && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-bold text-lg">Respuesta del Asistente:</h3>
                  <div className="p-4 bg-muted rounded-lg flex gap-4 items-start">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {result.response}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
