/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Send, Sparkles, BrainCircuit, Trash2, ArrowRight, CornerDownLeft, Coffee, Sparkle } from "lucide-react";
import { ChatMessage } from "../types.js";

interface AICoachProps {
  token: string;
}

export default function AICoach({ token }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions chips (Feature 9)
  const suggestions = [
    "What should I work on next?",
    "Help me stay motivated.",
    "Break my goal into steps.",
    "Encourage me."
  ];

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/coach/chat", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setMessages(result.history || []);
      }
    } catch (e) {
      console.error("Error loading coach chat history", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchChatHistory();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage = textToSend.trim();
    setInput("");
    setLoading(true);

    // Append user message immediately to state for responsive UI
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      userId: 0,
      sender: "user",
      message: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const result = await response.json();
        const tempCoachMsg: ChatMessage = {
          id: Date.now() + 1,
          userId: 0,
          sender: "coach",
          message: result.reply,
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, tempCoachMsg]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your conversation with Momentum?")) return;
    try {
      const response = await fetch("/api/coach/chat", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMessages([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm flex flex-col h-[75vh]">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight font-sans">AI Coach Momentum</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Online Cheering Partner
            </span>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-1.5 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Sandbox container */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
        {messages.length > 0 ? (
          messages.map((msg, i) => {
            const isUser = msg.sender === "user";
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-[20px] p-4 text-xs leading-relaxed font-sans ${
                  isUser 
                    ? "bg-slate-900 text-white font-semibold" 
                    : "bg-[#F8FAF7] text-slate-700 border border-emerald-100/55 font-medium shadow-sm"
                }`}>
                  {/* Process paragraphs and bullets nicely */}
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-sans">Meet Momentum, Your AI Coach</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed font-sans font-semibold">
                "Small steps. Big results." I'm here to help you defeat decision fatigue and plan realistic milestones with warmth and encouragement.
              </p>
            </div>
          </div>
        )}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-50 border border-slate-100 text-slate-400 text-xs rounded-2xl px-4 py-3 flex items-center gap-2 font-sans">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="font-semibold">Momentum is writing...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips panel */}
      {messages.length === 0 && (
        <div className="pb-3 border-t border-slate-50 pt-3 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-sans">Try asking me:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(phrase)}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/60 rounded-full px-4 py-2 transition-colors cursor-pointer text-left font-sans"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="pt-3 border-t border-slate-100 shrink-0 font-sans">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="relative bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-500/5 rounded-xl flex items-center p-1.5 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type a message or ask: 'Plan my day'..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 focus:outline-none placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
