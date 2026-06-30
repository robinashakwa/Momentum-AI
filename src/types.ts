/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  targetDate: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  plantStage: number; // 0: Seed, 1: Sprout, 2: Sapling, 3: Flowering Plant, 4: Mighty Tree
}

export interface Milestone {
  id: number;
  goalId: number;
  userId: number;
  title: string;
  status: 'pending' | 'completed';
  orderIndex: number;
  createdAt: string;
}

export interface Task {
  id: number;
  milestoneId: number;
  goalId: number;
  userId: number;
  title: string;
  status: 'pending' | 'completed';
  dateScheduled: string; // YYYY-MM-DD
  orderIndex: number;
  createdAt: string;
}

export interface MiniTask {
  id: number;
  taskId: number;
  goalId: number;
  userId: number;
  title: string;
  status: 'pending' | 'completed';
  orderIndex: number;
  createdAt: string;
}

export interface Reflection {
  id: number;
  userId: number;
  date: string; // YYYY-MM-DD
  wentWell: string;
  slowedDown: string;
  feeling: string; // "happy", "tired", "focused", "anxious", "neutral"
  tomorrowAdvice: string;
  createdAt: string;
}

export interface FocusSession {
  id: number;
  userId: number;
  taskId: number;
  durationMinutes: number;
  completed: number; // 0 or 1
  completedAt: string;
}

export interface ChatMessage {
  id: number;
  userId: number;
  sender: 'user' | 'coach';
  message: string;
  createdAt: string;
}

export interface Achievement {
  id: number;
  userId: number;
  goalId: number;
  plantType: string; // "🌱 Sprouty", "🌿 Ivy", "🌳 Oak", "🌸 Blossom"
  stage: number;
  unlockedAt: string;
}

export interface Settings {
  id?: number;
  userId: number;
  theme: string; // "default"
  workingHours: string; // "09:00 - 17:00"
  breakPreference: string; // "5m every 25m"
  language: string; // "English"
}

export interface DashboardData {
  greeting: string;
  focusGoal: Goal | null;
  todayProgress: number; // percentage
  nextStep: Task | null;
  aiSuggestion: string;
  motivationQuote: string;
  momentumScore: {
    score: number;
    streak: number;
    completedToday: number;
    statusLabel: string; // "🌱 Growing" | "🚀 Strong Momentum" | "🔥 Amazing Week"
  };
  weeklyJourney: { [date: string]: 'completed' | 'partial' | 'missed' | 'empty' }; // Mon to Fri or last 7 days
}
