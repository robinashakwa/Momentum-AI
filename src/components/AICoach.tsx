/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Send, Trash2, Zap, Flame, Clock, Calendar } from "lucide-react";
import { ChatMessage } from "../types.js";

interface AICoachProps {
  token: string;
}

export default function AICoach({ token }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mandatory 4 questions that the AI Coach guarantees answering
  const suggestions = [
    "What should I finish first?",
    "How much time is left?",
    "Can I still finish before the deadline?",
    "What should I do right now?"
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
    if (!window.confirm("Are you sure you want to reset the conversation with the Deadline Coach?")) return;
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
    <div className="bg-white border border-stone-100 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col h-[75vh] font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 leading-tight">AI Deadline Rescue Coach</h3>
            <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
              Emergency Advisor Active
            </span>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-1.5 border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
            title="Reset Conversation"
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
                transition={{ duration: 0.2 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser 
                    ? "bg-stone-900 text-white font-semibold" 
                    : "bg-stone-50 border border-stone-100 text-stone-800 font-medium shadow-2xs"
                }`}>
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-stone-800">Defeat Last-Minute Panic</h4>
              <p className="text-xs text-stone-400 max-w-sm mt-1 leading-relaxed font-semibold">
                "No procrastination, no fluff." Click any question below or ask me about your goals to immediately analyze completion feasibility, remaining hours, and optimal hour-by-hour schedules.
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
            <div className="bg-stone-50 border border-stone-100 text-stone-500 text-xs rounded-2xl px-4 py-3 flex items-center gap-2 font-semibold">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span>AI is calculating your feasibility...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips panel */}
      <div className="pb-3 border-t border-stone-50 pt-3 shrink-0">
        <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest mb-2">Required Emergency Inquiries:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(phrase)}
              disabled={loading}
              className="text-[11px] font-bold text-red-700 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-full px-4 py-2 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Input container */}
      <div className="pt-3 border-t border-stone-100 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="relative bg-stone-50 border border-stone-200 focus-within:border-stone-400 rounded-xl flex items-center p-1.5 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about your deadlines, or write a custom prompt..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-stone-900 focus:outline-none placeholder-stone-400 font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white disabled:text-stone-400 rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
