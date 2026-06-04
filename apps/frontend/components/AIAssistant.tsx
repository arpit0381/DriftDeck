"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, RefreshCw, Check } from "lucide-react";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

interface AIAssistantProps {
  chat: ChatMessage[];
  prompt: string;
  loading: boolean;
  onPromptChange: (v: string) => void;
  onSend: () => void;
}

export default function AIAssistant({
  chat,
  prompt,
  loading,
  onPromptChange,
  onSend,
}: AIAssistantProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, loading]);

  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="glass-panel border-border p-6 rounded-2xl flex flex-col max-w-3xl mx-auto"
      style={{ height: "calc(100vh - 10rem)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-xs font-black font-mono tracking-wider text-foreground">
            DRIFT DECK NEURAL ENGINE
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Semantic Models Live
        </span>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 mb-4">
        {chat.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[82%] rounded-xl p-3.5 text-xs font-semibold leading-relaxed border ${
              msg.sender === "user"
                ? "bg-primary/15 border-primary/25 text-foreground self-end"
                : "bg-card border-border/40 text-foreground/80 self-start"
            }`}
          >
            {msg.sender === "ai" && (
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono text-primary font-black">
                <Sparkles className="w-3 h-3" /> DRIFT AI
              </div>
            )}
            <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border/40 rounded-xl p-3.5 text-xs font-semibold text-muted self-start flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
            Neural semantic parsing in progress...
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 border-t border-border/30 pt-3 flex-shrink-0">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && onSend()}
          placeholder="Ask AI to summarize documents, explain notes, or analyze files..."
          className="flex-1 h-10 bg-card border border-border rounded-xl px-4 text-xs outline-none focus:border-primary/50 transition-colors text-foreground"
          disabled={loading}
        />
        <button
          onClick={onSend}
          disabled={loading || !prompt.trim()}
          className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover flex items-center justify-center text-white transition-all shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
