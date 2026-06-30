/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, CheckCircle2, Circle, Plus, Calendar, ArrowRight, BookOpen, 
  Trash, ChevronDown, ChevronUp, Compass, Sprout, Heart, Leaf
} from "lucide-react";
import { Goal } from "../types.js";

interface GoalJourneyProps {
  token: string;
  onGoalModified: () => void; // Refresh dashboard statistics when goals change
}

export default function GoalJourney({ token, onGoalModified }: GoalJourneyProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [detailedGoal, setDetailedGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Create Goal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading your workspace...");

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setGoals(result.goals);
        
        // Auto select the first active goal if none selected
        if (result.goals.length > 0 && selectedGoalId === null) {
          setSelectedGoalId(result.goals[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setDetailedGoal(result.goal);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  useEffect(() => {
    if (selectedGoalId) {
      fetchGoalDetails(selectedGoalId);
    } else {
      setDetailedGoal(null);
    }
  }, [selectedGoalId]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;

    setSubmitting(true);
    
    // Cycle beautiful non-technical loading messages
    const messages = [
      "Decomposing your goal...",
      "Reducing decision fatigue...",
      "Planning micro-steps...",
      "Watering your virtual plant..."
    ];
    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 1800);

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, targetDate })
      });

      if (response.ok) {
        const result = await response.json();
        setTitle("");
        setTargetDate("");
        setShowCreateForm(false);
        await fetchGoals();
        setSelectedGoalId(result.goalId);
        onGoalModified(); // Notify parent
      }
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setSubmitting(false);
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
        if (selectedGoalId) {
          await fetchGoalDetails(selectedGoalId);
          onGoalModified();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        if (selectedGoalId) {
          await fetchGoalDetails(selectedGoalId);
          onGoalModified();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Plant stage emoji + text
  const getPlantGraphic = (stage: number) => {
    switch (stage) {
      case 0: return { emoji: "🌱", text: "Seed planted" };
      case 1: return { emoji: "🌿", text: "Sprout growing" };
      case 2: return { emoji: "🍃", text: "Leafy Sapling" };
      case 3: return { emoji: "🌸", text: "Flowering Plant" };
      case 4: return { emoji: "🌳", text: "Mighty Tree" };
      default: return { emoji: "🌱", text: "Seed" };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshSpinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 font-sans">
      {/* Sidebar: Goal List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 font-sans">Your Goals</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>

        {/* Goals List Card */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm space-y-2">
          {goals.length > 0 ? (
            goals.map((g) => {
              const isActive = selectedGoalId === g.id;
              const plant = getPlantGraphic(g.plantStage);
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border text-left cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-50/50 border-emerald-100 text-slate-900 shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-2xl shrink-0">{plant.emoji}</span>
                    <div className="truncate">
                      <span className="font-bold text-xs text-slate-900 block truncate">{g.title}</span>
                      <span className="text-[10px] text-slate-400 font-bold">Target: {new Date(g.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    g.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {g.status}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12">
              <span className="text-3xl text-slate-300 block mb-2">🌱</span>
              <p className="text-xs text-slate-400 max-w-xs mx-auto font-semibold">
                No goals in progress. Create your first Goal Journey above and let AI build your custom roadmap!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Panel: Milestones & Roadmap */}
      <div className="lg:col-span-2 space-y-6">
        {detailedGoal ? (
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
            
            {/* Goal Info Header Card */}
            <div className="bg-[#FBFBFB] border border-slate-100 rounded-[24px] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getPlantGraphic(detailedGoal.plantStage).emoji}</span>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight font-sans">{detailedGoal.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  <span>Due Date: {new Date(detailedGoal.targetDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Plant stage: {getPlantGraphic(detailedGoal.plantStage).text}</span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="w-full md:w-auto flex flex-col items-end shrink-0">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {calculateGoalProgress(detailedGoal)}% Journey Progress
                </span>
                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${calculateGoalProgress(detailedGoal)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Milestones Flow */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Compass className="w-4 h-4 text-emerald-600" />
                AI-Generated Roadmap Flow
              </h4>

              <div className="space-y-6 relative pl-3 border-l-2 border-dashed border-slate-100">
                {detailedGoal.milestones?.map((milestone: any, mIdx: number) => (
                  <div key={milestone.id} className="relative space-y-3">
                    {/* Milestone Bullet Dot */}
                    <div className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 ${
                      milestone.status === 'completed' 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'bg-white border-slate-300'
                    }`}></div>

                    <div className="flex items-center justify-between">
                      <h5 className={`text-sm font-bold font-sans ${
                        milestone.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}>
                        Milestone {mIdx + 1}: {milestone.title}
                      </h5>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        milestone.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {milestone.status === 'completed' ? 'Done' : 'In Progress'}
                      </span>
                    </div>

                    {/* Milestone Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {milestone.tasks?.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 hover:border-slate-200 transition-all space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => handleToggleTask(task.id, task.status)}
                              className="mt-0.5 shrink-0 text-slate-300 hover:text-emerald-500 transition-all cursor-pointer"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <span className={`text-xs font-bold leading-tight font-sans ${
                              task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}>
                              {task.title}
                            </span>
                          </div>

                          {/* Mini tasks inside task card */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                            {task.miniTasks?.map((mt: any) => (
                              <div key={mt.id} className="flex items-center gap-2 text-[11px] font-sans font-semibold">
                                <button
                                  onClick={() => handleToggleMiniTask(mt.id, mt.status)}
                                  className="shrink-0 text-slate-300 hover:text-emerald-500 transition-all cursor-pointer"
                                >
                                  {mt.status === 'completed' ? (
                                    <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className={`text-slate-600 leading-normal ${
                                  mt.status === 'completed' ? 'line-through text-slate-400' : ''
                                }`}>
                                  {mt.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm">
            <span className="text-4xl">🏔️</span>
            <h4 className="text-base font-bold text-slate-800 mt-4 font-sans">No Selected Journey</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed font-sans font-semibold">
              Select or create a goal journey on the left to review its milestones, tasks, and mini action steps decomposed automatically by AI.
            </p>
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100/80 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-[#FBFBFB] flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 font-sans">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Initiate Goal Journey
                </h3>
                <button
                  disabled={submitting}
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                {!submitting ? (
                  <form onSubmit={handleCreateGoal} className="space-y-4 font-sans">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        What is your primary Goal?
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Learn React, Prepare for Interview, Lose Weight"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm rounded-xl transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Target Date
                      </label>
                      <input
                        type="date"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm rounded-xl transition-all font-medium"
                      />
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-2xl p-3 flex gap-2">
                      <Leaf className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                        By focusing on just <strong>ONE Goal</strong> at a time, you dramatically reduce cognitive overload and build consistency. Our AI will decompose this into custom micro-actions instantly.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
                      >
                        Generate Roadmap Journey
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-slate-800 font-sans">{loadingMessage}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-sans font-semibold">Our Gemini productivity agent is generating a high-quality low-friction schedule.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple internal helper to compute overall percentage
function calculateGoalProgress(detailedGoal: any): number {
  if (!detailedGoal || !detailedGoal.milestones) return 0;
  let totalTasks = 0;
  let completedTasks = 0;
  detailedGoal.milestones.forEach((m: any) => {
    m.tasks.forEach((t: any) => {
      totalTasks++;
      if (t.status === 'completed') completedTasks++;
    });
  });
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function RefreshSpinner() {
  return (
    <div className="flex flex-col items-center gap-2 font-sans">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
      <span className="text-xs text-slate-400 font-semibold">Decomposing your tasks...</span>
    </div>
  );
}
