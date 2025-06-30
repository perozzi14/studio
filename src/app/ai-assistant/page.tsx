
"use client";

import { useState, useRef, useEffect } from "react";
import { whatsappAssistant } from "@/ai/flows/whatsapp-assistant";
import { Header, BottomNav } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Loader2, Send, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type Message = {
  sender: "user" | "assistant";
  text: string;
};

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: "user", text: input };
    
    const historyForApi = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = input;
    setInput("");
    setIsLoading(true);

    try {
      const output = await whatsappAssistant({ query: currentQuery, history: historyForApi });
      const assistantMessage: Message = {
        sender: "assistant",
        text: output.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        sender: 'assistant',
        text: "Lo siento, no pude procesar tu solicitud en este momento. Por favor, inténtalo de nuevo más tarde."
      };
      setMessages(prev => [...prev, errorMessage]);
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
        <div className="container max-w-2xl h-[75vh] md:h-[80vh]">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                <Bot /> Asistente IA
              </CardTitle>
              <CardDescription>
                Haz preguntas, busca especialistas o gestiona tus citas.
                Estoy aquí para ayudarte.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                      ej., ¿Qué cardiólogos hay en Caracas?
                    </p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-2",
                      message.sender === "user" && "justify-end"
                    )}
                  >
                    {message.sender === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "p-3 rounded-lg max-w-sm md:max-w-md shadow-sm whitespace-pre-wrap",
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user ? user.name.charAt(0) : <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-end gap-2">
                     <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg max-w-sm shadow-sm bg-muted rounded-bl-none flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
