/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, User as UserIcon, Lock, CheckCircle2, ArrowLeft } from "lucide-react";

interface AuthProps {
  onLoginSuccess: (token: string, user: { id: number; username: string }) => void;
  onBackToLanding?: () => void;
}

export default function Auth({ onLoginSuccess, onBackToLanding }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-white border border-slate-100 rounded-full px-4 py-2 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-950 font-sans">Momentum AI</span>
        </div>
        <p className="text-center text-sm text-slate-500 max-w-xs mx-auto font-medium">
          "What's the smallest next step I can take today?"
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white py-10 px-8 shadow-sm border border-slate-100 rounded-[32px] sm:px-10"
        >
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {isLogin ? "Welcome back" : "Create your workspace"}
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {isLogin ? "Ready to build momentum today?" : "Get your personal AI productivity coach"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-xs bg-red-50 border border-red-100 rounded-lg text-red-600 font-medium"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm rounded-xl transition-all font-medium"
                  placeholder="e.g. alex"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm rounded-xl transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2 font-sans">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 disabled:bg-slate-400 transition-colors cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-ping h-2 w-2 rounded-full bg-white opacity-75"></span>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <span>{isLogin ? "Enter Workspace" : "Get Started"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              {isLogin ? "New to Momentum AI? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>

        {/* Informative hackathon cards */}
        <div className="mt-8 grid grid-cols-1 gap-3 max-w-md mx-auto">
          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed font-medium">
              <strong className="text-slate-900 block font-bold mb-0.5">The Last-Minute Life Saver</strong>
              Struggling to make headway? Momentum AI automatically decomposes overwhelming projects into sequential, lightweight actions so you can build active momentum.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
