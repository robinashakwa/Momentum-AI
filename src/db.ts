/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { 
  User, Goal, Milestone, Task, MiniTask, 
  Reflection, FocusSession, ChatMessage, Achievement, Settings 
} from "./types.js";

// Database path
const dbPath = path.resolve(process.cwd(), "momentum_ai.db");
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma("journal_mode = WAL");

/**
 * Initialize Database Tables
 */
export function initDb() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions Table for Authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Goals Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_date TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
      plant_stage INTEGER DEFAULT 0, -- 0: Seed, 1: Sprout, 2: Sapling, 3: Flowering, 4: Tree
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Milestones Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'completed'
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tasks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL,
      goal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'completed'
      date_scheduled TEXT NOT NULL, -- YYYY-MM-DD
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // MiniTasks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mini_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      goal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'completed'
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Reflections Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reflections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      went_well TEXT NOT NULL,
      slowed_down TEXT NOT NULL,
      feeling TEXT NOT NULL, -- 'happy', 'tired', 'focused', 'anxious', 'neutral'
      tomorrow_advice TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    )
  `);

  // Focus Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed INTEGER DEFAULT 1, -- 0 or 1
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Chat History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender TEXT NOT NULL, -- 'user', 'coach'
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Achievements/Virtual Garden Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER NOT NULL,
      plant_type TEXT NOT NULL, -- '🌱 Sprouty', '🌿 Ivy', '🌳 Oak', '🌸 Blossom'
      stage INTEGER DEFAULT 0,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    )
  `);

  // Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'default',
      working_hours TEXT DEFAULT '09:00 - 17:00',
      break_preference TEXT DEFAULT '5m every 25m',
      language TEXT DEFAULT 'English',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

/**
 * Password Hashing Helpers
 */
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

/**
 * User & Session Functions
 */
export function createUser(username: string, passwordPlain: string): number {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(passwordPlain, salt);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, salt) 
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(username.trim().toLowerCase(), hash, salt);
  const userId = result.lastInsertRowid as number;

  // Initialize Default Settings for user
  const settingsStmt = db.prepare(`
    INSERT INTO settings (user_id, theme, working_hours, break_preference, language)
    VALUES (?, 'default', '09:00 - 17:00', '5m every 25m', 'English')
  `);
  settingsStmt.run(userId);

  return userId;
}

export function verifyUser(username: string, passwordPlain: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
  const user = stmt.get(username.trim().toLowerCase()) as any;
  if (!user) return null;

  const hash = hashPassword(passwordPlain, user.salt);
  if (hash === user.password_hash) {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.created_at
    };
  }
  return null;
}

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  const stmt = db.prepare(`
    INSERT INTO sessions (session_token, user_id, expires_at) 
    VALUES (?, ?, ?)
  `);
  stmt.run(token, userId, expiresAt.toISOString());
  return token;
}

export function getUserBySession(token: string): User | null {
  const stmt = db.prepare(`
    SELECT users.* FROM sessions 
    JOIN users ON sessions.user_id = users.id 
    WHERE sessions.session_token = ? AND sessions.expires_at > ?
  `);
  const user = stmt.get(token, new Date().toISOString()) as any;
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at
  };
}

export function deleteSession(token: string) {
  const stmt = db.prepare("DELETE FROM sessions WHERE session_token = ?");
  stmt.run(token);
}

/**
 * Settings CRUD
 */
export function getSettings(userId: number): Settings {
  const stmt = db.prepare("SELECT * FROM settings WHERE user_id = ?");
  let res = stmt.get(userId) as any;
  if (!res) {
    // Fallback/Create
    const createStmt = db.prepare(`
      INSERT INTO settings (user_id) VALUES (?)
    `);
    createStmt.run(userId);
    res = db.prepare("SELECT * FROM settings WHERE user_id = ?").get(userId);
  }
  return {
    id: res.id,
    userId: res.user_id,
    theme: res.theme || 'default',
    workingHours: res.working_hours || '09:00 - 17:00',
    breakPreference: res.break_preference || '5m every 25m',
    language: res.language || 'English'
  };
}

export function updateSettings(userId: number, theme: string, workingHours: string, breakPreference: string, language: string): Settings {
  const stmt = db.prepare(`
    UPDATE settings 
    SET theme = ?, working_hours = ?, break_preference = ?, language = ? 
    WHERE user_id = ?
  `);
  stmt.run(theme, workingHours, breakPreference, language, userId);
  return getSettings(userId);
}

/**
 * Goal & Milestone & Task & MiniTask CRUD
 */
export function createGoal(userId: number, title: string, targetDate: string, milestones: { title: string, tasks: { title: string, miniTasks: string[] }[] }[]): number {
  const goalStmt = db.prepare(`
    INSERT INTO goals (user_id, title, target_date, status, plant_stage) 
    VALUES (?, ?, ?, 'active', 0)
  `);
  const goalResult = goalStmt.run(userId, title, targetDate);
  const goalId = goalResult.lastInsertRowid as number;

  // Bulk insert milestones, tasks, minitasks
  let mIndex = 0;
  for (const milestone of milestones) {
    const milestoneStmt = db.prepare(`
      INSERT INTO milestones (goal_id, user_id, title, status, order_index)
      VALUES (?, ?, ?, 'pending', ?)
    `);
    const milestoneResult = milestoneStmt.run(goalId, userId, milestone.title, mIndex++);
    const milestoneId = milestoneResult.lastInsertRowid as number;

    let tIndex = 0;
    for (const task of milestone.tasks) {
      // For simplicity, evenly schedule tasks leading up to the target date or default to today/tomorrow
      const dateScheduled = targetDate; // Can be fine-tuned or standard
      const taskStmt = db.prepare(`
        INSERT INTO tasks (milestone_id, goal_id, user_id, title, status, date_scheduled, order_index)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `);
      const taskResult = taskStmt.run(milestoneId, goalId, userId, task.title, dateScheduled, tIndex++);
      const taskId = taskResult.lastInsertRowid as number;

      let mtIndex = 0;
      for (const miniTitle of task.miniTasks) {
        const mtStmt = db.prepare(`
          INSERT INTO mini_tasks (task_id, goal_id, user_id, title, status, order_index)
          VALUES (?, ?, ?, ?, 'pending', ?)
        `);
        mtStmt.run(taskId, goalId, userId, miniTitle, mtIndex++);
      }
    }
  }

  // Create virtual plant starting at stage 0 (Seed) in the Achievement garden
  const plants = ["🌱 Sprouty", "🌿 Ivy", "🌳 Oak", "🌸 Blossom"];
  const randomPlant = plants[Math.floor(Math.random() * plants.length)];
  const achStmt = db.prepare(`
    INSERT INTO achievements (user_id, goal_id, plant_type, stage)
    VALUES (?, ?, ?, 0)
  `);
  achStmt.run(userId, goalId, randomPlant);

  return goalId;
}

export function getGoals(userId: number): Goal[] {
  const stmt = db.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC");
  const rows = stmt.all(userId) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    targetDate: r.target_date,
    status: r.status,
    createdAt: r.created_at,
    plantStage: r.plant_stage
  }));
}

export function getGoalDetails(goalId: number, userId: number) {
  const goalStmt = db.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?");
  const goal = goalStmt.get(goalId, userId) as any;
  if (!goal) return null;

  const milestonesStmt = db.prepare("SELECT * FROM milestones WHERE goal_id = ? ORDER BY order_index ASC");
  const milestones = milestonesStmt.all(goalId) as any[];

  const detailedMilestones = milestones.map(m => {
    const tasksStmt = db.prepare("SELECT * FROM tasks WHERE milestone_id = ? ORDER BY order_index ASC");
    const tasks = tasksStmt.all(m.id) as any[];

    const detailedTasks = tasks.map(t => {
      const mtStmt = db.prepare("SELECT * FROM mini_tasks WHERE task_id = ? ORDER BY order_index ASC");
      const miniTasks = mtStmt.all(t.id) as any[];
      return {
        id: t.id,
        milestoneId: t.milestone_id,
        goalId: t.goal_id,
        userId: t.user_id,
        title: t.title,
        status: t.status,
        dateScheduled: t.date_scheduled,
        orderIndex: t.order_index,
        createdAt: t.created_at,
        miniTasks: miniTasks.map(mt => ({
          id: mt.id,
          taskId: mt.task_id,
          goalId: mt.goal_id,
          userId: mt.user_id,
          title: mt.title,
          status: mt.status,
          orderIndex: mt.order_index,
          createdAt: mt.created_at
        }))
      };
    });

    return {
      id: m.id,
      goalId: m.goal_id,
      userId: m.user_id,
      title: m.title,
      status: m.status,
      orderIndex: m.order_index,
      createdAt: m.created_at,
      tasks: detailedTasks
    };
  });

  return {
    id: goal.id,
    userId: goal.user_id,
    title: goal.title,
    targetDate: goal.target_date,
    status: goal.status,
    createdAt: goal.created_at,
    plantStage: goal.plant_stage,
    milestones: detailedMilestones
  };
}

export function updateMiniTaskStatus(miniTaskId: number, userId: number, status: 'pending' | 'completed') {
  const stmt = db.prepare("UPDATE mini_tasks SET status = ? WHERE id = ? AND user_id = ?");
  stmt.run(status, miniTaskId, userId);

  // Check if all minitasks for the task are completed
  const miniTask = db.prepare("SELECT * FROM mini_tasks WHERE id = ?").get(miniTaskId) as any;
  if (miniTask) {
    const taskId = miniTask.task_id;
    const allMini = db.prepare("SELECT * FROM mini_tasks WHERE task_id = ?").all(taskId) as any[];
    const allCompleted = allMini.every(m => m.status === 'completed');
    
    if (allCompleted && allMini.length > 0) {
      updateTaskStatus(taskId, userId, 'completed');
    } else {
      updateTaskStatus(taskId, userId, 'pending');
    }
  }
}

export function updateTaskStatus(taskId: number, userId: number, status: 'pending' | 'completed') {
  const stmt = db.prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?");
  stmt.run(status, taskId, userId);

  // Retrieve details of the task
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as any;
  if (task) {
    const milestoneId = task.milestone_id;
    const goalId = task.goal_id;

    // Check if all tasks in milestone are completed
    const allTasks = db.prepare("SELECT * FROM tasks WHERE milestone_id = ?").all(milestoneId) as any[];
    const milestoneCompleted = allTasks.every(t => t.status === 'completed');
    
    db.prepare("UPDATE milestones SET status = ? WHERE id = ?")
      .run(milestoneCompleted && allTasks.length > 0 ? 'completed' : 'pending', milestoneId);

    // Update goal's plant stage
    // Plant stages: 0 (Seed) to 4 (Mighty Tree) based on percentage of tasks completed
    const totalGoalTasks = db.prepare("SELECT * FROM tasks WHERE goal_id = ?").all(goalId) as any[];
    const completedGoalTasks = totalGoalTasks.filter(t => t.status === 'completed');
    const completionRate = totalGoalTasks.length > 0 ? (completedGoalTasks.length / totalGoalTasks.length) : 0;
    
    let newStage = 0;
    if (completionRate >= 1.0) newStage = 4; // Mighty Tree
    else if (completionRate >= 0.75) newStage = 3; // Flowering Plant
    else if (completionRate >= 0.5) newStage = 2; // Sapling
    else if (completionRate >= 0.25) newStage = 1; // Sprout

    db.prepare("UPDATE goals SET plant_stage = ?, status = ? WHERE id = ?")
      .run(newStage, completionRate >= 1.0 ? 'completed' : 'active', goalId);

    // Keep Achievement synced
    db.prepare("UPDATE achievements SET stage = ? WHERE goal_id = ?").run(newStage, goalId);
  }
}

/**
 * Get Next Best Action (Feature 2 & 3 & 4)
 * Returns the single oldest uncompleted task for active goals
 */
export function getNextAction(userId: number): Task | null {
  const stmt = db.prepare(`
    SELECT tasks.* FROM tasks
    JOIN goals ON tasks.goal_id = goals.id
    WHERE tasks.user_id = ? AND tasks.status = 'pending' AND goals.status = 'active'
    ORDER BY tasks.created_at ASC, tasks.order_index ASC LIMIT 1
  `);
  const row = stmt.get(userId) as any;
  if (!row) return null;

  return {
    id: row.id,
    milestoneId: row.milestone_id,
    goalId: row.goal_id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    dateScheduled: row.date_scheduled,
    orderIndex: row.order_index,
    createdAt: row.created_at
  };
}

/**
 * Focus Session Tracking
 */
export function addFocusSession(userId: number, taskId: number, durationMinutes: number, completed: number): number {
  const stmt = db.prepare(`
    INSERT INTO focus_sessions (user_id, task_id, duration_minutes, completed)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(userId, taskId, durationMinutes, completed);
  return result.lastInsertRowid as number;
}

export function getFocusHistory(userId: number): FocusSession[] {
  const stmt = db.prepare("SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY completed_at DESC");
  const rows = stmt.all(userId) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    taskId: r.task_id,
    durationMinutes: r.duration_minutes,
    completed: r.completed,
    completedAt: r.completed_at
  }));
}

/**
 * Daily Reflections
 */
export function saveReflection(userId: number, date: string, wentWell: string, slowedDown: string, feeling: string, tomorrowAdvice: string): number {
  const stmt = db.prepare(`
    INSERT INTO reflections (user_id, date, went_well, slowed_down, feeling, tomorrow_advice)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      went_well = excluded.went_well,
      slowed_down = excluded.slowed_down,
      feeling = excluded.feeling,
      tomorrow_advice = excluded.tomorrow_advice
  `);
  const result = stmt.run(userId, date, wentWell, slowedDown, feeling, tomorrowAdvice);
  return result.lastInsertRowid as number;
}

export function getReflections(userId: number): Reflection[] {
  const stmt = db.prepare("SELECT * FROM reflections WHERE user_id = ? ORDER BY date DESC");
  const rows = stmt.all(userId) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    date: r.date,
    wentWell: r.went_well,
    slowedDown: r.slowed_down,
    feeling: r.feeling,
    tomorrowAdvice: r.tomorrow_advice,
    createdAt: r.created_at
  }));
}

/**
 * Chat History
 */
export function addChatMessage(userId: number, sender: 'user' | 'coach', message: string): number {
  const stmt = db.prepare(`
    INSERT INTO chat_history (user_id, sender, message)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, sender, message);
  return result.lastInsertRowid as number;
}

export function getChatHistory(userId: number, limit = 50): ChatMessage[] {
  const stmt = db.prepare("SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT ?");
  const rows = stmt.all(userId, limit) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    sender: r.sender,
    message: r.message,
    createdAt: r.created_at
  }));
}

export function clearChatHistory(userId: number) {
  const stmt = db.prepare("DELETE FROM chat_history WHERE user_id = ?");
  stmt.run(userId);
}

/**
 * Achievement Garden (Virtual Plants)
 */
export function getAchievements(userId: number): Achievement[] {
  const stmt = db.prepare(`
    SELECT achievements.*, goals.title as goal_title FROM achievements
    JOIN goals ON achievements.goal_id = goals.id
    WHERE achievements.user_id = ?
  `);
  const rows = stmt.all(userId) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    goalId: r.goal_id,
    plantType: r.plant_type,
    stage: r.stage,
    unlockedAt: r.unlocked_at,
    goalTitle: r.goal_title
  }));
}

/**
 * Calculate Dynamic Momentum Score and Weekly Graph State
 */
export function getMomentumStats(userId: number) {
  // 1. Calculate Completed Tasks Today
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayCompletedStmt = db.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE user_id = ? AND status = 'completed' AND date(created_at, 'localtime') = date('now', 'localtime')
  `);
  const completedToday = (todayCompletedStmt.get(userId) as any).count || 0;

  // 2. Calculate Total Completed Tasks
  const totalCompletedStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'");
  const totalCompleted = (totalCompletedStmt.get(userId) as any).count || 0;

  // 3. Calculate Reflections Completed
  const totalReflectionsStmt = db.prepare("SELECT COUNT(*) as count FROM reflections WHERE user_id = ?");
  const totalReflections = (totalReflectionsStmt.get(userId) as any).count || 0;

  // 4. Calculate Focus Session Count
  const totalFocusSessionsStmt = db.prepare("SELECT COUNT(*) as count FROM focus_sessions WHERE user_id = ? AND completed = 1");
  const totalFocusSessions = (totalFocusSessionsStmt.get(userId) as any).count || 0;

  // 5. Calculate Streak (Consecutive days of completing tasks, sessions, or reflections)
  // Let's retrieve all dates of activity:
  const activityDatesStmt = db.prepare(`
    SELECT DISTINCT date_str FROM (
      SELECT date(created_at, 'localtime') as date_str FROM tasks WHERE user_id = ? AND status = 'completed'
      UNION
      SELECT date as date_str FROM reflections WHERE user_id = ?
      UNION
      SELECT date(completed_at, 'localtime') as date_str FROM focus_sessions WHERE user_id = ? AND completed = 1
    ) ORDER BY date_str DESC
  `);
  const dates = (activityDatesStmt.all(userId, userId, userId) as any[]).map(d => d.date_str);

  let streak = 0;
  if (dates.length > 0) {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];

    // The user must have been active today or yesterday to maintain the streak
    if (dates[0] === todayDateStr || dates[0] === yesterdayDateStr) {
      streak = 1;
      let curr = new Date(dates[0]);
      for (let i = 1; i < dates.length; i++) {
        const nextDate = new Date(dates[i]);
        const diffTime = Math.abs(curr.getTime() - nextDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
          curr = nextDate;
        } else if (diffDays === 0) {
          continue; // same day activity
        } else {
          break; // break in streak
        }
      }
    }
  }

  // 6. Calculate Overall Score
  // Base Score: (TasksCompleted * 10) + (Reflections * 15) + (FocusSessions * 5)
  // Streak Multiplier: streak * 12 points
  const rawScore = (totalCompleted * 10) + (totalReflections * 15) + (totalFocusSessions * 5) + (streak * 12);
  const score = Math.max(10, Math.min(100, rawScore)); // bound score between 10 and 100 for aesthetic display, or let it grow! Let's let it scale dynamically.

  let statusLabel = "🌱 Growing";
  if (streak >= 5 || score >= 80) {
    statusLabel = "🔥 Amazing Week";
  } else if (streak >= 3 || score >= 45) {
    statusLabel = "🚀 Strong Momentum";
  }

  // 7. Generate last 7 days of Weekly Journey (looks like contribution graph)
  const weeklyJourney: { [date: string]: 'completed' | 'partial' | 'missed' | 'empty' } = {};
  
  // Let's retrieve all scheduled/completed tasks for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    
    // Check if user was active on this day
    const completedOnDay = db.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE user_id = ? AND status = 'completed' AND date(created_at, 'localtime') = ?
    `).get(userId, dStr) as any;

    const hadReflection = db.prepare(`
      SELECT COUNT(*) as count FROM reflections 
      WHERE user_id = ? AND date = ?
    `).get(userId, dStr) as any;

    const focusCount = db.prepare(`
      SELECT COUNT(*) as count FROM focus_sessions 
      WHERE user_id = ? AND completed = 1 AND date(completed_at, 'localtime') = ?
    `).get(userId, dStr) as any;

    const activityPoints = (completedOnDay.count * 3) + (hadReflection.count * 4) + (focusCount.count * 2);

    if (activityPoints >= 6) {
      weeklyJourney[dStr] = 'completed';
    } else if (activityPoints > 0) {
      weeklyJourney[dStr] = 'partial';
    } else {
      // Check if they had scheduled goals or tasks for today, if yes it's missed, else it's empty
      weeklyJourney[dStr] = 'empty';
    }
  }

  return {
    score,
    streak,
    completedToday,
    statusLabel,
    weeklyJourney
  };
}
