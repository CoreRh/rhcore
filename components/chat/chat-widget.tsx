import { useAuth } from "@/contexts/auth-context";
import React, { useRef, useState } from "react";
import { ChatMessage } from "./message-bubble";
import { chatApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Bot, MessageSquare, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Textarea } from "../ui/textarea";

const MAX_CHARS = 2000;

export function ChatWidget() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const sendMutation = useMutation({
    mutationFn: (mensagem: string) => chatApi.send(mensagem),
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.data.RESPOSTA,
        },
      ]);
      scrollToBottom();
    },
    onError: (error: { statusCode?: number; message?: string }) => {
      if (error.statusCode === 401) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        logout();
        return;
      }
      toast.error(error.message ?? "Não foi possível enviar a mensagem.");
    },
  });

  const trimmed = input.trim();
  const isOverLimit = input.length > MAX_CHARS;
  const canSend = trimmed.length > 0 && !isOverLimit && !sendMutation.isPending;

  const handleSend = () => {
    if (!canSend) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    sendMutation.mutate(trimmed);
    setInput("");
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Painel do chat — empilhado logo acima do botão */}
      {isOpen && (
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            "h-[min(600px,calc(100vh-10rem))] w-[min(400px,calc(100vw-3rem))]",
            "rounded-lg border bg-card shadow-xl",
          )}
        >
          {/* Cabeçalho */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Assistente</p>
              <p className="text-xs text-muted-foreground">Assistente de RH</p>
            </div>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && !sendMutation.isPending ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Bot className="h-8 w-8" />
                <p className="text-sm">Envie uma mensagem para começar.</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {/* Indicador de digitando */}
            {sendMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="space-y-1 border-t p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="max-h-32 min-h-11 resize-none"
                aria-invalid={isOverLimit}
              />
              <Button
                onClick={handleSend}
                disabled={!canSend}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
            <div className="flex justify-end px-1">
              <span
                className={cn(
                  "text-xs",
                  isOverLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {input.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante — sempre logo abaixo do painel */}
      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
