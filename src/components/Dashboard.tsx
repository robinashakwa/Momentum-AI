/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, CheckCircle2, Circle, AlertCircle, ArrowRight, Sparkles, 
  Smile, Calendar, BrainCircuit, Coffee, BookOpen, Sun, Moon, LogIn, Clock, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Compass, Heart
} from "lucide-react";
import { DashboardData, Task, Reflection } from "../types.js";

interface DashboardProps {
  token: string;
  onSelectTab: (tab: string) => void;
  onGoalCreated: () => void; // Refresh dashboard when goal is modified
}

export default function Dashboard({ token, onSelectTab, onGoalCreated }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Reflection state
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [wentWell, setWentWell] = useState("");
  const [slowedDown, setSlowedDown] = useState("");
  const [feeling, setFeeling] = useState("neutral");
  const [savingReflection, setSavingReflection] = useState(false);
  const [savedAdvice, setSavedAdvice] = useState<string | null>(null);

  // Smart Schedule state
  const [schedule, setSchedule] = useState<any>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Task Mini-tasks details
  const [isTaskExpanded, setIsTaskExpanded] = useState(false);
  const [detailedTask, setDetailedTask] = useState<any>(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch("/api/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        // If there's a next step, let's fetch full goal details to show mini-tasks
        if (result.nextStep) {
          fetchTaskDetails(result.nextStep.goalId);
        } else {
          setDetailedTask(null);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTaskDetails = async (goalId: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        // Locate the current next step in the detailed goal
        if (result.goal && result.goal.milestones) {
          let foundTask: any = null;
          for (const m of result.goal.milestones) {
            for (const t of m.tasks) {
              if (t.id === data?.nextStep?.id || (foundTask === null && t.status === 'pending')) {
                foundTask = t;
                break;
              }
            }
            if (foundTask) break;
          }
          setDetailedTask(foundTask);
        }
      }
    } catch (e) {
      console.error("Error fetching task details:", e);
    }
  };

  const fetchSmartSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const response = await fetch("/api/smart-schedule", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setSchedule(result.schedule);
      }
    } catch (error) {
      console.error("Error generating smart schedule:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSmartSchedule();
  }, [token]);

  const handleCompleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "completed" })
      });
      
      if (response.ok) {
        // Trigger completion animation, reload data
        fetchDashboardData(true);
        onGoalCreated(); // Notify achievements
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMiniTask = async (miniTaskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const response = await fetch(`/api/mini-tasks/${miniTaskId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Toggle in-place temporarily for quick response, then re-fetch
        if (detailedTask) {
          const updatedMini = detailedTask.miniTasks.map((mt: any) => {
            if (mt.id === miniTaskId) return { ...mt, status: newStatus };
            return mt;
          });
          setDetailedTask({ ...detailedTask, miniTasks: updatedMini });
          
          // Check if all are completed now
          const allDone = updatedMini.every((m: any) => m.status === 'completed');
          if (allDone) {
            handleCompleteTask(detailedTask.id);
          } else {
            fetchDashboardData(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell || !slowedDown) return;

    setSavingReflection(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayStr,
          wentWell,
          slowedDown,
          feeling
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSavedAdvice(result.tomorrowAdvice);
        fetchDashboardData(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingReflection(false);
    }
  };

  const closeReflectionModal = () => {
    setShowReflectionModal(false);
    setSavedAdvice(null);
    setWentWell("");
    setSlowedDown("");
    setFeeling("neutral");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-stone-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-stone-500 font-sans">Loading your day...</p>
      </div>
    );
  }

  const focusGoal = data?.focusGoal;
  const nextStep = data?.nextStep;
  const momentum = data?.momentumScore;

  // Render Feeling Emoji
  const getFeelingEmoji = (feel: string) => {
    switch (feel) {
      case "happy": return "😊";
      case "tired": return "🥱";
      case "focused": return "🧠";
      case "anxious": return "🥺";
      default: return "😐";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3.5xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-2">
            {data?.greeting}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Here's your mindful roadmap to build active momentum today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchDashboardData(); fetchSmartSchedule(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Plan
          </button>
          <button
            onClick={() => setShowReflectionModal(true)}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            Reflect on Today
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Focus & Actions, Right is Coach & Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Today's Next Step (Feature 2) - Spotlight */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            {nextStep ? (
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">Today's Focus</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 text-sm font-medium">Goal: {focusGoal?.title}</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => handleCompleteTask(nextStep.id)}
                      className="mt-1.5 flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                      title="Mark Completed"
                    >
                      <Circle className="w-8 h-8" />
                    </button>
                    <div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{nextStep.title}</h3>
                      <p className="text-sm text-slate-500 italic">"{data?.motivationQuote}"</p>
                    </div>
                  </div>
                </div>

                {/* Expand Mini-tasks block */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <button
                    onClick={() => {
                      setIsTaskExpanded(!isTaskExpanded);
                      if (!detailedTask) fetchTaskDetails(nextStep.goalId);
                    }}
                    className="w-full flex justify-between items-center text-xs font-bold text-slate-500 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-emerald-600" />
                      AI Step Breakdown ({detailedTask?.miniTasks?.filter((m: any) => m.status === 'completed').length || 0}/{detailedTask?.miniTasks?.length || 0} mini-steps)
                    </span>
                    {isTaskExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isTaskExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 space-y-2 pt-2 border-t border-slate-200/50"
                    >
                      {detailedTask?.miniTasks && detailedTask.miniTasks.length > 0 ? (
                        detailedTask.miniTasks.map((mt: any) => (
                          <div 
                            key={mt.id} 
                            className="flex items-center justify-between text-xs py-2.5 px-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200/80 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleMiniTask(mt.id, mt.status)}
                                className="text-slate-300 hover:text-emerald-500 transition-colors cursor-pointer"
                              >
                                {mt.status === 'completed' ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <span className={`text-slate-700 font-medium ${mt.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                {mt.title}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                              Step
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">Loading breakdown plan...</p>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => onSelectTab("Focus Timer")}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    Start Focus Session
                  </button>
                  <button
                    onClick={() => onSelectTab("Goals & Journeys")}
                    className="px-8 py-3.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-2xl font-bold transition-all border border-slate-200 cursor-pointer"
                  >
                    Review Roadmap
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4 w-full">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-800">Your Slate is Clean!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    No recommended steps pending right now. Start building momentum by creating a new Goal journey.
                  </p>
                </div>
                <button
                  onClick={() => onSelectTab("Goals & Journeys")}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Create a Goal Journey
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {nextStep && (
              <div className="w-64 h-64 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 relative">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full border-dashed animate-spin-slow"></div>
                <div className="text-center">
                  <span className="text-5xl">🌱</span>
                  <p className="text-emerald-700 font-bold mt-2">Growing Fast</p>
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">🚀 Active Vibe</p>
                </div>
              </div>
            )}
          </div>

          {/* Smart Schedule (Feature 6) */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your AI-Balanced Schedule</h3>
                <p className="text-xs text-slate-400">Custom hourly sequence crafted for natural pauses and maximum calm.</p>
              </div>
              <button
                onClick={fetchSmartSchedule}
                disabled={loadingSchedule}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Regenerate Schedule"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSchedule ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSchedule ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
                <p className="text-xs text-slate-400">Rebalancing your day...</p>
              </div>
            ) : schedule ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Morning */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full w-max">
                    <Sun className="w-3.5 h-3.5" />
                    Morning
                  </div>
                  <div className="space-y-2">
                    {schedule.morning?.map((item: any, i: number) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 leading-tight">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Afternoon */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-max">
                    <Coffee className="w-3.5 h-3.5" />
                    Afternoon
                  </div>
                  <div className="space-y-2">
                    {schedule.afternoon?.map((item: any, i: number) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 leading-tight">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evening */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full w-max">
                    <Moon className="w-3.5 h-3.5" />
                    Evening
                  </div>
                  <div className="space-y-2">
                    {schedule.evening?.map((item: any, i: number) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 leading-tight">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">Failed to render timeline schedule.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Momentum Score, Journey, Coach advice */}
        <div className="space-y-8">
          
          {/* Momentum Score & Badge */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Momentum Score</span>
                <h3 className="text-4xl font-extrabold text-slate-900 mt-1">{momentum?.score || 10}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
                  {momentum?.streak || 0} Day Streak
                </span>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${momentum?.score || 10}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-bold">
                <span>STARTING</span>
                <span>MAX (100)</span>
              </div>
            </div>

            {/* GROWING BADGE DISPLAY */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Current Status:</span>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full flex items-center gap-1">
                {momentum?.statusLabel === "🌱 Growing" && "🌱"}
                {momentum?.statusLabel === "🚀 Strong Momentum" && "🚀"}
                {momentum?.statusLabel === "🔥 Amazing Week" && "🔥"}
                {momentum?.statusLabel || "🌱 Growing"}
              </span>
            </div>
          </div>

          {/* Weekly Journey contribution style (Feature 8) */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Weekly Consistency Graph</h4>
            
            <div className="flex justify-between items-center gap-1 pt-1">
              {momentum?.weeklyJourney && Object.keys(momentum.weeklyJourney).map((dateKey) => {
                const status = momentum.weeklyJourney[dateKey];
                const dateObj = new Date(dateKey);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div key={dateKey} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 font-sans">{dayName[0]}</span>
                    <div 
                      className={`w-full aspect-square max-w-[40px] rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                        status === 'completed' 
                          ? 'bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-500/10' 
                          : status === 'partial' 
                          ? 'bg-emerald-200 border-emerald-300' 
                          : status === 'missed' 
                          ? 'bg-red-50 border-red-100' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                      title={`${dateKey}: ${status}`}
                    >
                      {/* Simple tooltip */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-[9px] font-bold text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1 z-10 pointer-events-none">
                        {status === 'completed' && "🔥 High Activity"}
                        {status === 'partial' && "🌱 Active step"}
                        {status === 'empty' && "Resting"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200 inline-block"></span> Rest</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-200 inline-block"></span> Sprout</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Strong</span>
            </div>
          </div>

          {/* Today's Goals Progress summary */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Focus</h4>
            {focusGoal ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-800 leading-tight block truncate max-w-[180px]">{focusGoal.title}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{data?.todayProgress}% Completed</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${data?.todayProgress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-bold">
                  <span>Created: {new Date(focusGoal.createdAt).toLocaleDateString()}</span>
                  <span>Target: {new Date(focusGoal.targetDate).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 mb-2">No active focus journey</p>
                <button
                  onClick={() => onSelectTab("Goals & Journeys")}
                  className="text-xs text-emerald-600 font-bold hover:text-emerald-700 cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            )}
          </div>

          {/* AI Coach Quick Tip */}
          <div className="bg-gradient-to-br from-[#FAFBF8] to-[#F1F7EC] rounded-[32px] border border-emerald-100 p-8 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <BrainCircuit className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold tracking-tight">AI Coach Tip</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {data?.aiSuggestion}
            </p>
            <button
              onClick={() => onSelectTab("AI Coach")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-1"
            >
              Ask Coach Momentum
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DAILY REFLECTION MODAL (WIZARD) */}
      <AnimatePresence>
        {showReflectionModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-500" />
                  Daily Reflection
                </h3>
                <button 
                  onClick={closeReflectionModal} 
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                {!savedAdvice ? (
                  <form onSubmit={handleSaveReflection} className="space-y-5">
                    <p className="text-xs text-slate-400">
                      Reflecting on your day helps clear your mind and prepares your brain for gentle productivity tomorrow.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        What went well today?
                      </label>
                      <textarea
                        required
                        value={wentWell}
                        onChange={(e) => setWentWell(e.target.value)}
                        placeholder="e.g., I finally sat down and worked for 20 minutes, or I felt focused after lunch."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 h-20 transition-all resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        What slowed you down?
                      </label>
                      <textarea
                        required
                        value={slowedDown}
                        onChange={(e) => setSlowedDown(e.target.value)}
                        placeholder="e.g., I got distracted checking my phone, or I felt overwhelmed by the big tasks."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 h-20 transition-all resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        How did you feel today?
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { name: "happy", label: "Happy", emoji: "😊" },
                          { name: "focused", label: "Focused", emoji: "🧠" },
                          { name: "neutral", label: "Neutral", emoji: "😐" },
                          { name: "tired", label: "Tired", emoji: "🥱" },
                          { name: "anxious", label: "Anxious", emoji: "Anx" }
                        ].map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setFeeling(item.name)}
                            className={`py-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                              feeling === item.name 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span className="text-lg font-sans">
                              {item.name === "anxious" ? "🥺" : item.emoji}
                            </span>
                            <span className="text-[10px] font-bold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 font-sans">
                      <button
                        type="submit"
                        disabled={savingReflection}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center gap-2"
                      >
                        {savingReflection ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Analyzing your reflection...
                          </span>
                        ) : (
                          "Save & Receive Coach Advice"
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6 py-4"
                  >
                    <div className="text-center space-y-2">
                      <span className="text-4xl">{getFeelingEmoji(feeling)}</span>
                      <h4 className="text-base font-bold text-slate-800">Reflection Logged!</h4>
                      <p className="text-xs text-slate-400">Here is tomorrow's gentle coaching advice based on your check-in:</p>
                    </div>

                    <div className="bg-[#F8FAF7] border border-emerald-100 rounded-[24px] p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 text-emerald-600">
                        <Sparkles className="w-5 h-5 opacity-30" />
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans italic font-semibold">
                        "{savedAdvice}"
                      </p>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-2xl p-3 flex gap-2">
                      <Heart className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Excellent work! Logging daily reflections maintains your streak and increases your momentum score by <strong>+15 points</strong>.
                      </p>
                    </div>

                    <button
                      onClick={closeReflectionModal}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Awesome, Thank You
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
