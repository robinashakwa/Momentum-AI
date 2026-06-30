/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, CheckCircle, Sparkles, BrainCircuit, AlertCircle, Heart } from "lucide-react";

interface FocusTimerProps {
  token: string;
}

export default function FocusTimer({ token }: FocusTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Focus encouragement quotes
  const quotes = [
    "You're doing great! Just focus on this single breath.",
    "Only 10 minutes left! You are making wonderful progress.",
    "Breathe in, breathe out. Small steps yield big results.",
    "Momentum is built one single second at a time.",
    "No need to finish the whole project, just finish this timer."
  ];
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  // Load active recommended tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.nextStep) {
          setTasks([result.nextStep]);
          setSelectedTaskId(result.nextStep.id);
        } else {
          setTasks([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  // Quote shifter
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      }, 45000); // Shift quote every 45s
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Main countdown timer loop
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleCompleteSession();
            clearInterval(interval);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setSessionCompleted(false);
  };

  const handleCompleteSession = async () => {
    setIsActive(false);
    setSessionCompleted(true);

    if (selectedTaskId) {
      try {
        await fetch("/api/focus/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            taskId: selectedTaskId,
            durationMinutes: 25 - minutes,
            completed: 1
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm max-w-xl mx-auto space-y-8 py-10">
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2 font-sans">
          <BrainCircuit className="w-5 h-5 text-emerald-500" />
          Focus Session
        </h3>
        <p className="text-xs text-slate-400 font-sans font-semibold">Dedicate 25 minutes to your next best action with absolute calm.</p>
      </div>

      {/* Task Selector */}
      <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-sans">Selected Focus Target</label>
        {loading ? (
          <p className="text-xs text-slate-400 font-medium">Loading your recommended task...</p>
        ) : tasks.length > 0 ? (
          tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-xs font-bold text-slate-800 font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>{t.title}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 font-semibold italic">No recommended action scheduled. Go to Goal Journey to launch one!</p>
        )}
      </div>

      {/* Large Timer Circle layout */}
      <div className="flex flex-col items-center justify-center space-y-6">
        
        <div className="relative w-56 h-56 rounded-full border border-slate-100 flex flex-col items-center justify-center shadow-sm bg-slate-50/50">
          {/* Pulsing ring during focus */}
          {isActive && (
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping pointer-events-none"></div>
          )}
          
          <span className="text-5xl font-bold font-mono tracking-tight text-slate-900">{formattedTime}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 font-sans">{isActive ? "FLOWING" : "PAUSED"}</span>
        </div>

        {/* Dynamic Quote remark */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-slate-500 font-semibold italic text-center max-w-sm font-sans"
          >
            "{currentQuote}"
          </motion.p>
        </AnimatePresence>

        {/* Controls Row */}
        <div className="flex items-center gap-4 font-sans">
          <button
            onClick={handleResetTimer}
            className="p-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleToggleTimer}
            className={`px-8 py-3 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors ${
              isActive 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                Pause Focus
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Start Focus
              </>
            )}
          </button>

          <button
            onClick={handleCompleteSession}
            className="p-3 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-500 hover:text-emerald-600 rounded-xl transition-all cursor-pointer"
            title="Mark Session Completed"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session Completed Alert */}
      {sessionCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 text-xs font-sans"
        >
          <Heart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-emerald-900">Wonderful Job Focused!</h5>
            <p className="text-slate-600 mt-1 font-semibold">
              Your focus session has been saved to your workspace! Momentum Score increased by <strong>+5 points</strong>! Keep up this incredible flow.
            </p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
