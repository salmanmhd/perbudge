"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Send,
  User,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  TrendingDown,
  Wallet,
  PiggyBank,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatWithAi } from "@/app/actions/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const INITIAL_MESSAGE: Message = {
  id: "init-1",
  role: "assistant",
  content:
    "Hi, I'm Perbudge! I have real-time visibility into your transactions, monthly budgets, EMIs, and savings goals. Ask me anything about your money — like checking if you can afford a purchase, analyzing food spend, or pacing this month's budget.",
  timestamp: "Just now",
};

const SUGGESTIONS = [
  {
    icon: Wallet,
    title: "Monthly Spend",
    prompt: "How much did I spend this month and what is my biggest category?",
  },
  {
    icon: Coffee,
    title: "Food & Dining",
    prompt: "How much have I spent on food, groceries, and dining out?",
  },
  {
    icon: PiggyBank,
    title: "Savings Pace",
    prompt: "Am I on track to meet my savings target this month?",
  },
  {
    icon: TrendingDown,
    title: "Cut Expenses",
    prompt: "Where am I spending more than usual and where can I cut ₹3,000?",
  },
];

/**
 * Clean formatter for AI responses: supports bold, code spans, lists, and numbers.
 */
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point
        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.startsWith("* ");
        const bulletText = isBullet
          ? trimmed.replace(/^[•\-*]\s*/, "")
          : trimmed;

        // Numbered list
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const numberPrefix = isNumbered ? trimmed.match(/^\d+\.\s/)?.[0] : "";
        const itemText = isNumbered
          ? trimmed.replace(/^\d+\.\s/, "")
          : bulletText;

        // Parse inline elements (bold, code, currency)
        const renderFormattedText = (raw: string) => {
          // Split by bold (**text**), then code (`text`)
          const parts = raw.split(/(\*\*.*?\*\*|`.*?`)/g);

          return parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong
                  key={pIdx}
                  className="font-semibold text-foreground tracking-tight"
                >
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={pIdx}
                  className="rounded bg-muted/80 px-1.5 py-0.5 text-xs font-mono text-primary border border-border/50"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });
        };

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-2 shrink-0" />
              <div className="flex-1">{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        if (isNumbered) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-xs font-bold text-primary font-mono mt-0.5 shrink-0">
                {numberPrefix}
              </span>
              <div className="flex-1">{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        return <p key={idx}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-expand textarea up to 160px
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const historyPayload = updated
        .filter((m) => m.id !== "init-1")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await chatWithAi(historyPayload);

      if (result.success && result.text) {
        setMessages([
          ...updated,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: result.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setMessages([
          ...updated,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: result.text || "Sorry, I hit an error analyzing your data. Please try again.",
            timestamp: "Error",
          },
        ]);
      }
    } catch {
      setMessages([
        ...updated,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network issue. Please try again in a moment.",
          timestamp: "Error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  const isOnlyInitial = messages.length === 1;

  return (
    <div className="flex flex-col h-full w-full bg-card/60 dark:bg-card/30 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Top Bar inside Chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Perbudge Co-pilot
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Connected to your live transactions, budgets & EMIs
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Start fresh conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                  isUser
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-primary border-border/60"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`flex flex-col group max-w-[85%] sm:max-w-[78%] ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`relative rounded-2xl px-4 py-3.5 shadow-xs transition-all ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    <FormattedMessage content={msg.content} />
                  )}
                </div>

                {/* Footer details: time & copy */}
                <div
                  className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-muted-foreground ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.timestamp && <span>{msg.timestamp}</span>}
                  {!isUser && msg.id !== "init-1" && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground flex items-center gap-1 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-background text-primary border border-border/60 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-muted/60 dark:bg-muted/30 border border-border/50 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2.5 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Analyzing your financial data...</span>
            </div>
          </div>
        )}

        {/* Suggestions when chat is fresh */}
        {isOnlyInitial && !isLoading && (
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested Questions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(item.prompt)}
                    className="flex items-start gap-2.5 p-3 text-left rounded-xl border border-border/50 bg-background/50 hover:bg-muted/40 hover:border-primary/40 transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Bottom Input Box */}
      <div className="p-3 sm:p-4 bg-background/80 dark:bg-background/50 backdrop-blur-lg border-t border-border/40">
        <div className="relative flex flex-col rounded-xl border border-border/60 bg-background shadow-xs focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your spending, budget, or EMIs..."
            disabled={isLoading}
            className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-50 min-h-[44px] max-h-[160px]"
          />

          {/* Bottom actions row inside the input box */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/60">
                Enter
              </kbd>{" "}
              to send,{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/60">
                Shift + Enter
              </kbd>{" "}
              for new line
            </span>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="ml-auto h-8 px-3 rounded-lg gap-1.5 transition-all shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span className="text-xs font-medium">Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/60 mt-2">
          Perbudge AI provides personal insights based on your logged finances. Always verify major decisions.
        </p>
      </div>
    </div>
  );
}
