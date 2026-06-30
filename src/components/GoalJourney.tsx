/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, CheckCircle2, Circle, Plus, Calendar, ArrowRight, BookOpen, 
  Trash, ChevronDown, ChevronUp, Compass, Sprout, Heart, Leaf, Archive, RotateCcw, Clock, AlertCircle
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
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'archived'>('active');
  
  // Create Goal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [estimatedHours, setEstimatedHours] = useState("5");
  const [priority, setPriority] = useState("medium");
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading your workspace...");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDeadlineDate, setNewTaskDeadlineDate] = useState("");
  const [newTaskDeadlineTime, setNewTaskDeadlineTime] = useState("18:00");
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState("1.0");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [addingTask, setAddingTask] = useState(false);
  const [taskFormError, setTaskFormError] = useState("");

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setGoals(result.goals || []);
        
        // Auto select the first goal matching the active tab if none selected
        const matchingGoals = (result.goals || []).filter((g: any) => g.status === activeTab);
        if (matchingGoals.length > 0) {
          const stillExists = matchingGoals.some((g: any) => g.id === selectedGoalId);
          if (!stillExists) {
            setSelectedGoalId(matchingGoals[0].id);
          }
        } else {
          setSelectedGoalId(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'active' | 'completed' | 'archived') => {
    setActiveTab(tab);
    const matchingGoals = goals.filter(g => g.status === tab);
    if (matchingGoals.length > 0) {
      setSelectedGoalId(matchingGoals[0].id);
    } else {
      setSelectedGoalId(null);
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
    if (!title || !targetDate || !deadlineTime) return;

    setSubmitting(true);
    setLoadingMessage("Decomposing goal requirements...");

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          description,
          targetDate, 
          deadlineTime, 
          estimatedHours: parseFloat(estimatedHours) || 0, 
          priority 
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTitle("");
        setDescription("");
        setTargetDate("");
        setDeadlineTime("18:00");
        setEstimatedHours("5");
        setPriority("medium");
        setShowCreateForm(false);
        await fetchGoals();
        setSelectedGoalId(result.goalId);
        onGoalModified(); // Notify parent
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError("");
    if (!newTaskTitle.trim() || !newTaskDeadlineDate || !newTaskDeadlineTime || !selectedGoalId) {
      setTaskFormError("Task title, Deadline Date and Time are required!");
      return;
    }

    setAddingTask(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoalId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTaskTitle.trim(),
          description: newTaskDescription,
          deadlineDate: newTaskDeadlineDate,
          deadlineTime: newTaskDeadlineTime,
          estimatedHours: parseFloat(newTaskEstimatedHours) || 1.0,
          priority: newTaskPriority
        })
      });
      if (response.ok) {
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskDeadlineDate("");
        setNewTaskDeadlineTime("18:00");
        setNewTaskEstimatedHours("1.0");
        setNewTaskPriority("medium");
        await fetchGoalDetails(selectedGoalId);
        onGoalModified(); // Notify parent of changes to tasks
      }
    } catch (err) {
      console.error("Failed to add task manually:", err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this goal and all its tasks? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setDetailedGoal(null);
        setSelectedGoalId(null);
        await fetchGoals();
        onGoalModified();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGoalStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/goals/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await fetchGoals();
        await fetchGoalDetails(id);
        onGoalModified();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
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

  // Helper calculations for status, days left, and recommendation
  const calculateDaysLeft = (targetDateStr: string) => {
    const now = new Date();
    const deadline = new Date(targetDateStr);
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs < 0) return -1;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatusAndStyles = (targetDateStr: string, progress: number) => {
    const daysLeft = calculateDaysLeft(targetDateStr);
    if (progress >= 100) {
      return { label: "🟢 Completed", className: "bg-emerald-50 text-emerald-800 border-emerald-100" };
    }
    if (daysLeft < 0) {
      return { label: "🔴 Overdue", className: "bg-red-50 text-red-700 border-red-100 animate-pulse" };
    }
    if (daysLeft <= 1) {
      return { label: "🔥 Critical", className: "bg-orange-50 text-orange-700 border-orange-100 animate-pulse" };
    }
    if (daysLeft <= 3 && progress < 50) {
      return { label: "🟡 Needs Attention", className: "bg-amber-50 text-amber-700 border-amber-100" };
    }
    return { label: "🟢 On Track", className: "bg-stone-50 text-stone-700 border-stone-200" };
  };

  const getAIRecommendationText = (goal: any, progress: number) => {
    const daysLeft = calculateDaysLeft(goal.targetDate);
    const totalTasks = goal.milestones?.reduce((acc: number, m: any) => acc + (m.tasks?.length || 0), 0) || 0;
    const completedTasks = goal.milestones?.reduce((acc: number, m: any) => acc + (m.tasks?.filter((t: any) => t.status === 'completed').length || 0), 0) || 0;
    const pendingCount = totalTasks - completedTasks;

    if (progress === 100) {
      return "🎉 Outstanding accomplishment! Goal completed ahead of deadline.";
    }
    if (daysLeft < 0) {
      return "🚨 High Alert: Deadline has expired! Immediately complete the pending tasks to minimize delay penalties.";
    }
    if (daysLeft <= 1) {
      return `🔥 Extreme Urgency: Only ${daysLeft} day(s) left! Activate Emergency Mode, postpone all non-essential items, and complete the ${pendingCount} pending task(s) right now.`;
    }
    if (daysLeft <= 3 && progress < 50) {
      return `⚠️ Attention Required: ${daysLeft} day(s) remaining with only ${progress}% progress. Allocate at least 2-3 hours today specifically to clear pending deliverables.`;
    }
    return "✨ Excellent progress! You are fully on track to finish ahead of schedule. Keep up the high velocity!";
  };

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
        <div className="w-8 h-8 border-4 border-stone-100 border-t-red-500 rounded-full animate-spin"></div>
        <span className="text-xs text-stone-400 font-semibold font-sans">Syncing Goal status...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 font-sans">
      {/* Sidebar: Goal List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-900 font-sans">Goals Tracker</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>

        {/* Goal Tabs (Pending, Completed, Archived) */}
        <div className="bg-stone-100 p-1 rounded-2xl flex gap-1 border border-stone-200/50 font-sans">
          {(['active', 'completed', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 text-center py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {tab === 'active' ? '⏳ Active' : tab === 'completed' ? '✅ Completed' : '📦 Archived'}
            </button>
          ))}
        </div>

        {/* Goals List Card */}
        <div className="bg-white border border-stone-100 rounded-[32px] p-5 shadow-sm space-y-2">
          {goals.filter(g => g.status === activeTab).length > 0 ? (
            goals.filter(g => g.status === activeTab).map((g) => {
              const isActive = selectedGoalId === g.id;
              const plant = getPlantGraphic(g.plantStage);
              const daysLeft = calculateDaysLeft(g.targetDate);
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border text-left cursor-pointer ${
                    isActive 
                      ? 'bg-red-50/30 border-red-100 text-stone-900 shadow-sm' 
                      : 'bg-stone-50 border-transparent text-stone-700 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-2xl shrink-0">{plant.emoji}</span>
                    <div className="truncate">
                      <span className="font-bold text-xs text-stone-900 block truncate">{g.title}</span>
                      <span className="text-[10px] text-stone-500 font-bold block">
                        {daysLeft < 0 ? "🚨 Overdue" : `⏳ ${daysLeft} Days Left`}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    g.status === 'completed' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : g.status === 'archived'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {g.status}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-4">
              <span className="text-3xl text-stone-300 block mb-2">🌱</span>
              <p className="text-xs text-stone-400 max-w-xs mx-auto font-semibold">
                No goals in {activeTab === 'active' ? 'active' : activeTab} status.
              </p>
              {activeTab === 'active' && (
                <p className="text-[10px] text-stone-400 max-w-xs mx-auto font-semibold">
                  Create your first Goal above to start!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel: Milestones & Roadmap */}
      <div className="lg:col-span-2 space-y-6">
        {detailedGoal ? (
          <div className="bg-white border border-stone-100 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Goal Info Header Card */}
            <div className="bg-stone-50 border border-stone-200/50 rounded-[24px] p-5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getPlantGraphic(detailedGoal.plantStage).emoji}</span>
                    <h3 className="text-base font-extrabold text-stone-900 leading-tight font-sans">{detailedGoal.title}</h3>
                  </div>
                  <p className="text-xs text-stone-500 font-sans leading-relaxed">{detailedGoal.description || "No general description set."}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-stone-500 font-bold font-mono">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-stone-400" /> Deadline Date: {detailedGoal.targetDate}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-stone-400" /> Time: {detailedGoal.deadlineTime || "18:00"}</span>
                    <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[9px]">Priority: {detailedGoal.priority}</span>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="w-full md:w-auto flex flex-col items-start md:items-end shrink-0">
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-sans">
                    {calculateGoalProgress(detailedGoal)}% Completed
                  </span>
                  <div className="w-24 bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${calculateGoalProgress(detailedGoal)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Status and AI Recommendation - SECTION 5 */}
              <div className="bg-white border border-stone-200/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Current Status</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 border rounded-full ${
                    getDeadlineStatusAndStyles(detailedGoal.targetDate, calculateGoalProgress(detailedGoal)).className
                  }`}>
                    {getDeadlineStatusAndStyles(detailedGoal.targetDate, calculateGoalProgress(detailedGoal)).label}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">AI Recommendation</span>
                  <p className="text-xs font-semibold text-stone-700 leading-relaxed">
                    {getAIRecommendationText(detailedGoal, calculateGoalProgress(detailedGoal))}
                  </p>
                </div>
              </div>

              {/* Goal Management Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3.5 border-t border-stone-200/60 font-sans">
                {detailedGoal.status !== "completed" ? (
                  <button
                    onClick={() => handleUpdateGoalStatus(detailedGoal.id, "completed")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateGoalStatus(detailedGoal.id, "active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-open Goal
                  </button>
                )}

                {detailedGoal.status !== "archived" ? (
                  <button
                    onClick={() => handleUpdateGoalStatus(detailedGoal.id, "archived")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Goal
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateGoalStatus(detailedGoal.id, "active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore Goal
                  </button>
                )}

                <button
                  onClick={() => handleDeleteGoal(detailedGoal.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all sm:ml-auto"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Delete Goal
                </button>
              </div>
            </div>

            {/* Add Task Manually Form */}
            {detailedGoal.status === "active" && (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Add Task to Category</h4>
                
                <form onSubmit={handleAddTask} className="space-y-3 font-sans">
                  
                  {/* Task Title */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Code database migrations"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                    />
                  </div>

                  {/* Task Description */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Ensure we support SQL migrations for high reliability..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Deadline Date */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Deadline Date (Required)</label>
                      <input
                        type="date"
                        required
                        value={newTaskDeadlineDate}
                        onChange={(e) => setNewTaskDeadlineDate(e.target.value)}
                        className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                      />
                    </div>

                    {/* Deadline Time */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Deadline Time (Required)</label>
                      <input
                        type="time"
                        required
                        value={newTaskDeadlineTime}
                        onChange={(e) => setNewTaskDeadlineTime(e.target.value)}
                        className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Est Hours */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Est. Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={newTaskEstimatedHours}
                        onChange={(e) => setNewTaskEstimatedHours(e.target.value)}
                        className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                      />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="w-full px-4 py-2 text-xs bg-white border border-stone-200 focus:outline-none focus:border-red-500 rounded-xl"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {taskFormError && (
                    <p className="text-[10px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg">{taskFormError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={addingTask}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Save Task with Deadline
                  </button>
                </form>
              </div>
            )}

            {/* Milestones Flow */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Compass className="w-4 h-4 text-red-500" />
                Tasks Roadmap list
              </h4>

              <div className="space-y-4">
                {detailedGoal.milestones?.map((milestone: any, mIdx: number) => {
                  return (
                    <div key={milestone.id} className="space-y-3">
                      {/* Milestone Tasks */}
                      <div className="grid grid-cols-1 gap-3">
                        {milestone.tasks?.map((task: any) => (
                          <div 
                            key={task.id} 
                            className="bg-stone-50/50 border border-stone-200/60 rounded-2xl p-4 hover:border-stone-300 transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <button
                                  onClick={() => handleToggleTask(task.id, task.status)}
                                  className="mt-0.5 shrink-0 text-stone-300 hover:text-emerald-500 transition-all cursor-pointer"
                                >
                                  {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                                
                                <div className="space-y-0.5">
                                  <span className={`text-xs font-extrabold leading-tight ${
                                    task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800'
                                  }`}>
                                    {task.title}
                                  </span>
                                  {task.description && (
                                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[9px] font-bold text-stone-400 font-mono">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-stone-400" /> Due: {task.dateScheduled} at {task.deadlineTime || "18:00"}</span>
                                    <span>•</span>
                                    <span>Effort: {task.estimatedHours}h</span>
                                    <span>•</span>
                                    <span className="uppercase text-stone-500">Priority: {task.priority}</span>
                                    {task.completedAt && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-600">Finished: {new Date(task.completedAt).toLocaleDateString()}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-stone-300 hover:text-rose-600 transition-colors cursor-pointer shrink-0 mt-0.5"
                                title="Delete Task"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {(!milestone.tasks || milestone.tasks.length === 0) && (
                          <p className="text-xs text-stone-400 text-center py-6">No tasks added to this goal category yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-100 rounded-[32px] p-12 text-center shadow-sm">
            <span className="text-4xl">🏔️</span>
            <h4 className="text-base font-bold text-stone-800 mt-4 font-sans">No Selected Goal Journey</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed font-sans font-semibold">
              Select or create a goal category on the left to review its deadlines, remaining days, AI recommendations, and specific scheduled deliverables.
            </p>
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden font-sans"
            >
              <div className="p-6 border-b border-stone-100 bg-[#FBFBFB] flex justify-between items-center">
                <h3 className="text-base font-extrabold text-stone-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  Initiate Goal Category
                </h3>
                <button
                  disabled={submitting}
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-stone-400 hover:text-stone-600 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                {!submitting ? (
                  <form onSubmit={handleCreateGoal} className="space-y-4 font-sans">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        What is your Goal Category?
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Hackathon Project"
                        className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Deliverable target for the Developers Hackathon..."
                        className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-xs rounded-xl transition-all font-medium h-16 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Deadline Date (Required)
                      </label>
                      <input
                        type="date"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Deadline Time (Required)
                      </label>
                      <input
                        type="time"
                        required
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                          Est. Hours
                        </label>
                        <input
                          type="number"
                          required
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(e.target.value)}
                          className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                          Priority
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 text-stone-950 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm rounded-xl transition-all font-medium"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
                      >
                        Track Goal Deadline
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-stone-100 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-red-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-stone-800 font-sans">{loadingMessage}</h4>
                      <p className="text-xs text-stone-400 mt-1 font-sans font-semibold">Our AI advisor is setting up your deadline rescue profiles...</p>
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
    m.tasks?.forEach((t: any) => {
      totalTasks++;
      if (t.status === 'completed') completedTasks++;
    });
  });
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}
