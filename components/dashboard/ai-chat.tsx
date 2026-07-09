"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAi } from "@/app/actions/chat";

export function AiChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm Perbudge. I can analyze your transactions and answer any questions about your money. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const result = await chatWithAi(newMessages);
    
    if (result.success && result.text) {
      setMessages([...newMessages, { role: "assistant", content: result.text }]);
    } else {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I had trouble processing that request." }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-b-xl border-t border-border/40">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[300px] lg:max-h-[600px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
                {msg.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm break-words ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm whitespace-pre-wrap"}`}>
                {msg.content.replace(/\*\*/g, "")}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-muted rounded-tl-sm flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-sm rounded-b-xl">
        <form 
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How much did I spend on food this month?"
            className="rounded-full bg-background"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
