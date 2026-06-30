/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, CheckCircle, BrainCircuit, Heart, Calendar, Clock, AlertTriangle } from "lucide-react";

interface FocusTimerProps {
  token: string;
}

export default function FocusTimer({ token }: FocusTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Focus encouragement quotes
  const quotes = [
    "One block at a time. The deadline is real, but so is your capability.",
    "Breathe. Postponing other things and committing to this task now is your superpower.",
    "Each focused minute reduces last-minute rush panic. Keep moving!",
    "You have plenty of time if you stay focused right now.",
    "No distractions. Just you, the timer, and your target."
  ];
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  // Load active recommended tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/focus/tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        const activeTasks = result.tasks || [];
        setTasks(activeTasks);
        if (activeTasks.length > 0) {
          setSelectedTaskId(activeTasks[0].id);
        } else {
          setSelectedTaskId(null);
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

  const handleSelectDuration = (mins: number) => {
    setIsActive(false);
    setTotalMinutes(mins);
    setMinutes(mins);
    setSeconds(0);
    setSessionCompleted(false);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setMinutes(totalMinutes);
    setSeconds(0);
    setSessionCompleted(false);
  };

  const handleCompleteSession = async () => {
    setIsActive(false);
    setSessionCompleted(true);

    if (selectedTaskId) {
      try {
        const elapsedMinutes = Math.max(1, totalMinutes - minutes);
        await fetch("/api/focus/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            taskId: selectedTaskId,
            durationMinutes: elapsedMinutes,
            completed: 1
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const getTaskRemainingTimeStr = (task: any) => {
    if (!task) return "";
    const deadlineStr = `${task.dateScheduled}T${task.deadlineTime || "18:00"}:00`;
    const deadlineTime = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diffMs = deadlineTime - now;

    if (diffMs <= 0) {
      return "🔴 OVERDUE";
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = "";
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `;
    timeString += `${minutes}m`;

    return `⏳ ${timeString} left`;
  };

  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="bg-white border border-stone-100 rounded-[32px] p-6 sm:p-8 shadow-sm max-w-xl mx-auto space-y-6 py-10 font-sans">
      
      <div className="text-center space-y-1">
        <h3 className="text-base font-extrabold text-stone-900 flex items-center justify-center gap-2">
          <BrainCircuit className="w-5 h-5 text-red-600" />
          Single-Task Focus Mode
        </h3>
        <p className="text-xs text-stone-400 font-semibold leading-relaxed">
          Select your target task, check its urgency parameters below, and enter distraction-free execution blocks.
        </p>
      </div>

      {/* Task Selector */}
      <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-4 space-y-3">
        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
          Target Task with Deadline
        </label>
        {loading ? (
          <p className="text-xs text-stone-400 font-semibold">Loading active tasks...</p>
        ) : tasks.length > 0 ? (
          <div className="space-y-4">
            <select
              value={selectedTaskId || ""}
              onChange={(e) => setSelectedTaskId(Number(e.target.value))}
              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-red-500 transition-all cursor-pointer"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  🎯 {t.title}
                </option>
              ))}
            </select>

            {/* Selected Task Urgency & Parameter Details (SECTION 6) */}
            {selectedTask && (
              <div className="bg-white border border-stone-100 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                  <span>Urgency Metrics</span>
                  <span className="text-red-600 font-mono">
                    {getTaskRemainingTimeStr(selectedTask)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-stone-800">{selectedTask.title}</h4>
                  <p className="text-[11px] text-stone-500 leading-normal font-medium">
                    {selectedTask.description || "Deliverable required for this goal category."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-stone-50 text-[10px] font-bold font-mono text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" /> 
                    Due: {selectedTask.dateScheduled} at {selectedTask.deadlineTime || "18:00"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Effort Needed: {selectedTask.estimatedHours || 1.0}h
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-stone-400 font-semibold italic">No active tasks found. Go to Goals Tracker to create one!</p>
        )}
      </div>

      {/* Timer Duration Options */}
      <div className="space-y-3">
        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider text-center">
          Select Block Duration
        </label>
        <div className="flex items-center justify-center gap-2">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelectDuration(mins)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                totalMinutes === mins
                  ? "bg-stone-900 border-stone-900 text-white shadow-xs"
                  : "bg-white border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-800"
              }`}
            >
              ⏱️ {mins} Min
            </button>
          ))}
        </div>
      </div>

      {/* Large Timer Circle layout */}
      <div className="flex flex-col items-center justify-center space-y-6">
        
        <div className="relative w-56 h-56 rounded-full border border-stone-100 flex flex-col items-center justify-center shadow-2xs bg-stone-50/50">
          {/* Pulsing ring during focus */}
          {isActive && (
            <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping pointer-events-none"></div>
          )}
          
          <span className="text-5xl font-bold font-mono tracking-tight text-stone-900">{formattedTime}</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-1.5">{isActive ? "RESCUE ACTIVE" : "STANDBY"}</span>
        </div>

        {/* Dynamic Quote remark */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-stone-500 font-semibold italic text-center max-w-sm"
          >
            "{currentQuote}"
          </motion.p>
        </AnimatePresence>

        {/* Controls Row */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetTimer}
            className="p-3 border border-stone-200 hover:bg-stone-50 text-stone-500 rounded-xl transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleToggleTimer}
            disabled={!selectedTaskId}
            className={`px-8 py-3 rounded-xl font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-colors ${
              isActive 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-stone-900 hover:bg-stone-800 disabled:bg-stone-150 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                Pause Timer
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Start Focus Session
              </>
            )}
          </button>

          <button
            onClick={handleCompleteSession}
            disabled={!selectedTaskId}
            className="p-3 border border-stone-200 hover:bg-red-50 hover:border-red-200 text-stone-500 hover:text-red-600 rounded-xl transition-all cursor-pointer"
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
          className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex gap-3 text-xs"
        >
          <Heart className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="font-bold text-red-950">Outstanding Execution block!</h5>
            <p className="text-stone-600 font-semibold leading-relaxed">
              Your focus session has been recorded! Cultivation points are added to the corresponding plant seed. Stay focused to grow a mighty tree!
            </p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
