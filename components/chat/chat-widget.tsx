"use client";

import { useAuth } from "@/contexts/auth-context";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./message-bubble";
import { chatApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Bot, MessageSquare, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

const MAX_CHARS = 2000;

export function ChatWidget() {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else if (wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen]);

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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sendMutation.isPending, isOpen]);

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Assistente de RH"
          className={cn(
            "flex flex-col overflow-hidden",
            "h-[min(600px,calc(100vh-10rem))] w-[min(400px,calc(100vw-3rem))]",
            "rounded-lg border bg-card shadow-xl",
          )}
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Assistente</p>
              <p className="text-xs text-muted-foreground">Assistente de RH</p>
            </div>
          </div>

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

          <div aria-live="polite" className="sr-only">
            {messages.at(-1)?.role === "assistant"
              ? messages.at(-1)?.content
              : ""}
          </div>

          <div className="space-y-1 border-t p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="max-h-32 min-h-11 resize-none"
                aria-invalid={isOverLimit}
                aria-describedby={isOverLimit ? "chat-input-error" : undefined}
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
            <div className="flex items-center justify-between gap-2 px-1">
              <p
                id="chat-input-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {isOverLimit
                  ? `Máximo de ${MAX_CHARS} caracteres. Remova ${input.length - MAX_CHARS}.`
                  : null}
              </p>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  isOverLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {input.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      )}

      <Button
        ref={triggerRef}
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
