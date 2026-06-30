/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, Circle, ArrowRight, Sparkles, 
  Clock, RefreshCw, Compass, Plus, Trash, AlertCircle, Calendar, Zap, Flame
} from "lucide-react";
import { DashboardData } from "../types.js";

interface DashboardProps {
  token: string;
  onSelectTab: (tab: string) => void;
  onGoalCreated: () => void;
}

export default function Dashboard({ token, onSelectTab, onGoalCreated }: DashboardProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | "">("");

  // New Goal Form State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalDeadlineTime, setGoalDeadlineTime] = useState("18:00");
  const [goalEstimatedHours, setGoalEstimatedHours] = useState("5");
  const [goalPriority, setGoalPriority] = useState("medium");
  const [creatingGoal, setCreatingGoal] = useState(false);

  // New Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadlineDate, setTaskDeadlineDate] = useState("");
  const [taskDeadlineTime, setTaskDeadlineTime] = useState("18:00");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState("1.0");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [addingTask, setAddingTask] = useState(false);
  const [formError, setFormError] = useState("");

  // Emergency Mode & Smart Schedule State
  const [emergencySchedule, setEmergencySchedule] = useState<any | null>(null);
  const [loadingEmergencySchedule, setLoadingEmergencySchedule] = useState(false);

  // Remaining Time Counter State
  const [timeLeftStr, setTimeLeftStr] = useState("");

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch dashboard stats
      const response = await fetch("/api/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        // Auto select focus goal if available
        if (result.focusGoal) {
          setSelectedGoalId(result.focusGoal.id);
        }
      }

      // 2. Fetch all goals
      const goalsRes = await fetch("/api/goals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (goalsRes.ok) {
        const goalsResult = await goalsRes.json();
        setAllGoals(goalsResult.goals || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Tick remaining time of nearest deadline every second
  useEffect(() => {
    const nearest = data?.deadlineStats?.nearestTask;
    if (!nearest) {
      setTimeLeftStr("");
      return;
    }

    const interval = setInterval(() => {
      const targetStr = nearest.dateScheduled || nearest.targetDate;
      const timeStr = nearest.deadlineTime || '18:00';
      const deadline = new Date(`${targetStr}T${timeStr}`);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeftStr("🚨 Overdue!");
      } else {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

        let str = "";
        if (days > 0) str += `${days}d `;
        str += `${hours}h ${mins}m ${secs}s`;
        setTimeLeftStr(str);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.deadlineStats?.nearestTask]);

  // Generate Emergency Rescue Schedule
  const generateEmergencyRescue = async () => {
    setLoadingEmergencySchedule(true);
    try {
      const res = await fetch("/api/smart-schedule", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setEmergencySchedule(result.schedule);
      }
    } catch (err) {
      console.error("Emergency rescue gen failed", err);
    } finally {
      setLoadingEmergencySchedule(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTargetDate || !goalDeadlineTime) {
      setFormError("Title, Deadline Date and Time are required!");
      return;
    }

    setCreatingGoal(true);
    setFormError("");
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: goalTitle.trim(),
          description: goalDescription,
          targetDate: goalTargetDate,
          deadlineTime: goalDeadlineTime,
          estimatedHours: parseFloat(goalEstimatedHours) || 0,
          priority: goalPriority,
          milestones: [{ title: "Primary Target Deliverables", order_index: 0 }]
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        setGoalTitle("");
        setGoalDescription("");
        setGoalTargetDate("");
        setGoalDeadlineTime("18:00");
        setGoalEstimatedHours("5");
        setGoalPriority("medium");
        setShowGoalModal(false);
        await fetchDashboardData(true);
        onGoalCreated();
      } else {
        const errJson = await response.json();
        setFormError(errJson.error || "Failed to create goal category.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Server error. Please try again.");
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedGoalId) {
      setFormError("Please select a Goal Category for this task.");
      return;
    }
    if (!taskTitle.trim() || !taskDeadlineDate || !taskDeadlineTime) {
      setFormError("Task title, Deadline Date and Deadline Time are strictly required!");
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
          title: taskTitle.trim(),
          description: taskDescription,
          deadlineDate: taskDeadlineDate,
          deadlineTime: taskDeadlineTime,
          estimatedHours: parseFloat(taskEstimatedHours) || 1.0,
          priority: taskPriority
        })
      });

      if (response.ok) {
        setTaskTitle("");
        setTaskDescription("");
        setTaskDeadlineDate("");
        setTaskDeadlineTime("18:00");
        setTaskEstimatedHours("1.0");
        setTaskPriority("medium");
        await fetchDashboardData(true);
        onGoalCreated();
      } else {
        const err = await response.json();
        setFormError(err.error || "Failed to create task.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Failed to add task manually.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchDashboardData(true);
        onGoalCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
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
        await fetchDashboardData(true);
        onGoalCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-stone-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-red-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-stone-500 font-sans animate-pulse">Running Deadline Rescue Engine...</p>
      </div>
    );
  }

  const stats = data?.deadlineStats || {
    dueToday: [], dueTomorrow: [], overdue: [], upcoming: [], emergency: [], nearestTask: null, nearestTimeLeft: null
  };

  const isEmergencyActive = stats.emergency.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 font-sans">
      
      {/* Red Alert Banner for Emergency Mode */}
      {isEmergencyActive && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 animate-bounce">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-red-800">EMERGENCY MODE ACTIVATED</h4>
              <p className="text-xs text-red-600">You have {stats.emergency.length} task(s) due within 24 hours! Do not panic. We have a rescue plan.</p>
            </div>
          </div>
          <button
            onClick={generateEmergencyRescue}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Get Emergency Schedule
          </button>
        </motion.div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full inline-block mb-1.5">Last-Minute Life Saver</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 font-sans">
            Deadline Rescue Hub
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time deadline tracking, urgent action plan generators, and simple to-do task blocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchDashboardData(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 bg-white hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-600 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Deadlines
          </button>
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal Category
          </button>
        </div>
      </div>

      {/* EMERGENCY RESCUE INTERFACE (SECTION 10) */}
      {emergencySchedule && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-900 text-white rounded-3xl p-6 space-y-6 shadow-xl border border-stone-800"
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <h3 className="text-base font-extrabold text-white">Emergency Rescue Action Plan</h3>
                <p className="text-[11px] text-stone-400">Strictly generated based on your next upcoming deadline requirements</p>
              </div>
            </div>
            <button 
              onClick={() => setEmergencySchedule(null)}
              className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Hide Rescue Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Morning blocks */}
            <div className="bg-stone-800/40 border border-stone-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Morning blocks</span>
              <div className="space-y-2">
                {emergencySchedule.morning?.map((block: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-stone-700 pl-3 py-1 text-xs">
                    <span className="block font-mono text-[10px] text-stone-400">{block.time}</span>
                    <span className="font-bold text-stone-200">{block.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Afternoon blocks */}
            <div className="bg-stone-800/40 border border-stone-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">Afternoon blocks</span>
              <div className="space-y-2">
                {emergencySchedule.afternoon?.map((block: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-stone-700 pl-3 py-1 text-xs">
                    <span className="block font-mono text-[10px] text-stone-400">{block.time}</span>
                    <span className="font-bold text-stone-200">{block.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evening blocks */}
            <div className="bg-stone-800/40 border border-stone-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">Evening blocks</span>
              <div className="space-y-2">
                {emergencySchedule.evening?.map((block: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-stone-700 pl-3 py-1 text-xs">
                    <span className="block font-mono text-[10px] text-stone-400">{block.time}</span>
                    <span className="font-bold text-stone-200">{block.activity}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Suggested Skips Section */}
          <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              AI SKIPS RECOMMENDATION (Saves Estimated 3.5 Hours)
            </h4>
            <p className="text-[11px] text-red-200/80 leading-relaxed">
              To guarantee meeting your imminent deadlines, we strongly suggest skipping: 
              <strong> social media browsing, secondary non-urgent emails, complex environment configurations, and formatting details</strong>. Focus strictly on working code/raw deliverable output first!
            </p>
          </div>
        </motion.div>
      )}

      {/* Nearest Deadline Hero Banner */}
      {stats.nearestTask ? (
        <div className="bg-stone-900 text-white rounded-[28px] p-6 sm:p-8 relative overflow-hidden shadow-lg border border-stone-800">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-[10px] uppercase tracking-widest font-extrabold rounded-full inline-block animate-pulse">
                Nearest Deadline Target
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{stats.nearestTask.title}</h2>
              <p className="text-xs text-stone-400 font-sans max-w-md">
                {stats.nearestTask.description || "No supplementary description provided. Every moment counts."}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-2 font-mono text-xs text-stone-300">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-stone-400" /> {stats.nearestTask.dateScheduled}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-stone-400" /> {stats.nearestTask.deadlineTime || "18:00"}</span>
                <span className="px-2 py-0.5 bg-stone-800 text-stone-300 text-[10px] font-bold rounded-md">Priority: {stats.nearestTask.priority}</span>
              </div>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto min-w-[200px]">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold mb-1">Time Left to Finish</span>
              <span className="text-2xl font-extrabold text-red-400 tracking-tight block">
                {timeLeftStr || "Calculating..."}
              </span>
              <button
                onClick={() => onSelectTab("Focus Timer")}
                className="mt-3 w-full py-1.5 bg-white text-stone-900 hover:bg-stone-100 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3 text-red-600" />
                Launch Rescue Focus Timer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone-200 rounded-[28px] p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">No active deadlines tracked</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed mt-1">
              Set up a goal category or add scheduled tasks with precise dates and times to activate the deadline tracking engines.
            </p>
          </div>
        </div>
      )}

      {/* Deadline Bento Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Overdue */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">🔴 Overdue Tasks</span>
          <span className="text-2xl font-extrabold text-stone-900 block">{stats.overdue.length}</span>
          <span className="text-[10px] text-stone-400 block font-sans">Requires urgent response</span>
        </div>

        {/* Due Today */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">🟠 Due Today</span>
          <span className="text-2xl font-extrabold text-stone-900 block">{stats.dueToday.length}</span>
          <span className="text-[10px] text-stone-400 block font-sans">Must complete today</span>
        </div>

        {/* Due Tomorrow */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">🟡 Due Tomorrow</span>
          <span className="text-2xl font-extrabold text-stone-900 block">{stats.dueTomorrow.length}</span>
          <span className="text-[10px] text-stone-400 block font-sans">On immediate horizon</span>
        </div>

        {/* Upcoming This Week */}
        <div className="bg-white border border-stone-100 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">🟢 Upcoming This Week</span>
          <span className="text-2xl font-extrabold text-stone-900 block">{stats.upcoming.length}</span>
          <span className="text-[10px] text-stone-400 block font-sans">Scheduled out safely</span>
        </div>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Add Urgent Task Form */}
        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">Quick Task Creator</h3>
            <p className="text-[11px] text-stone-400">Every task strictly requires a target goal and a hard deadline</p>
          </div>

          <form onSubmit={handleAddTask} className="space-y-4">
            
            {/* Choose Goal Category */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Goal Category</label>
              <select
                required
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-red-500"
              >
                <option value="">-- Select Goal Category --</option>
                {allGoals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Task Name / Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Finish chemistry assignment"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Brief summary of required deliverable details..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-500 h-16 resize-none"
              />
            </div>

            {/* Date Scheduled (Required Deadline Date) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Deadline Date (Required)</label>
              <input
                type="date"
                required
                value={taskDeadlineDate}
                onChange={(e) => setTaskDeadlineDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>

            {/* Deadline Time */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Deadline Time (Required)</label>
              <input
                type="time"
                required
                value={taskDeadlineTime}
                onChange={(e) => setTaskDeadlineTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Estimated Hours */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={taskEstimatedHours}
                  onChange={(e) => setTaskEstimatedHours(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Priority</label>
                <select
                  required
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg">{formError}</p>
            )}

            <button
              type="submit"
              disabled={addingTask}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Task with Hard Deadline
            </button>
          </form>
        </div>

        {/* Right columns: Simple lists categorised by Deadline Urgent lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Overdue tasks list */}
          {stats.overdue.length > 0 && (
            <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping"></span>
                ⚠️ OVERDUE TASKS ({stats.overdue.length})
              </h3>
              
              <div className="space-y-3">
                {stats.overdue.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-stone-900 leading-tight block">{task.title}</span>
                      <span className="text-[10px] text-red-600 font-semibold block">Missed Deadline: {task.dateScheduled} at {task.deadlineTime || "18:00"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, 'pending')}
                        className="px-2.5 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold rounded-lg cursor-pointer"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today & Tomorrow List */}
          <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
              ⏱️ URGENT DEADLINES (NEXT 48 HOURS)
            </h3>

            {stats.dueToday.length === 0 && stats.dueTomorrow.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-8">No tasks due today or tomorrow. Awesome job keeping up!</p>
            ) : (
              <div className="space-y-3">
                {/* Due Today */}
                {stats.dueToday.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-orange-50/40 border border-orange-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span className="text-xs font-extrabold text-stone-900 leading-tight block">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-orange-600 font-bold block ml-3">DUE TODAY at {task.deadlineTime || "18:00"} • Est: {task.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, 'pending')}
                        className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-extrabold rounded-lg cursor-pointer"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Due Tomorrow */}
                {stats.dueTomorrow.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-amber-50/40 border border-amber-100 rounded-2xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="text-xs font-extrabold text-stone-900 leading-tight block">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold block ml-3">Due Tomorrow at {task.deadlineTime || "18:00"} • Est: {task.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, 'pending')}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-lg cursor-pointer"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming this Week */}
          <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
              🗓️ UPCOMING THIS WEEK
            </h3>

            {stats.upcoming.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">No other tasks scheduled for this week.</p>
            ) : (
              <div className="space-y-3">
                {stats.upcoming.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200/50 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">{task.title}</span>
                      <span className="text-[10px] text-stone-500 block">Due on {task.dateScheduled} at {task.deadlineTime || "18:00"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, 'pending')}
                        className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* NEW GOAL MODAL WITH FORM FIELD MANDATES */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden font-sans"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  New Goal Category
                </h3>
                <button 
                  onClick={() => setShowGoalModal(false)} 
                  className="text-stone-400 hover:text-stone-600 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hackathon Pitch deck"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Describe what high level accomplishments must happen to call this category successful..."
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-red-500 h-20 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Goal Deadline Date (Required)</label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Deadline Time (Required)</label>
                  <input
                    type="time"
                    required
                    value={goalDeadlineTime}
                    onChange={(e) => setGoalDeadlineTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Est. Total Hours</label>
                    <input
                      type="number"
                      required
                      value={goalEstimatedHours}
                      onChange={(e) => setGoalEstimatedHours(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">Priority</label>
                    <select
                      value={goalPriority}
                      onChange={(e) => setGoalPriority(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:outline-none focus:border-red-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {formError && (
                  <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={creatingGoal}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  {creatingGoal ? "Creating..." : "Save Goal & Track Deadlines"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
